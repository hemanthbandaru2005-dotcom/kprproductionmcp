import { google, drive_v3 } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

if (typeof process !== 'undefined' && process.env) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

export interface DriveCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  parentFolderId: string;
  isConfigured: boolean;
}

function cleanEnvValue(val?: string): string {
  if (!val) return '';
  let str = String(val).trim();
  if (str.includes('=')) {
    str = str.split('=').pop()!.trim();
  }
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

export function getDriveCredentials(): DriveCredentials {
  const clientId = cleanEnvValue(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const refreshToken = cleanEnvValue(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
  const parentFolderId = cleanEnvValue(process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID);

  return {
    clientId,
    clientSecret,
    refreshToken,
    parentFolderId,
    isConfigured: Boolean(clientId && clientSecret && refreshToken)
  };
}

export const DRIVE_SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

let driveClientInstance: drive_v3.Drive | null = null;
let oauth2ClientInstance: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getAuthClient(): InstanceType<typeof google.auth.OAuth2> {
  const { clientId, clientSecret, refreshToken } = getDriveCredentials();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google Drive OAuth 2.0 credentials. Please ensure GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN are set in .env.local'
    );
  }

  if (!oauth2ClientInstance) {
    oauth2ClientInstance = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2ClientInstance.setCredentials({
      refresh_token: refreshToken
    });
  }

  return oauth2ClientInstance;
}

export function getDriveClient(): drive_v3.Drive {
  const auth = getAuthClient();
  if (!driveClientInstance) {
    driveClientInstance = google.drive({
      version: 'v3',
      auth
    });
  }
  return driveClientInstance;
}

export const GOOGLE_DRIVE_PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '';

export async function findOrCreateFolder(folderName: string, parentFolderId: string) {
  const drive = getDriveClient();
  const safeName = folderName.replace(/'/g, "\\'");
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and '${parentFolderId}' in parents and trashed = false`;

  const existing = await drive.files.list({
    q: query,
    fields: 'files(id, name, webViewLink, parents)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives'
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0];
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    },
    fields: 'id, name, webViewLink, parents',
    supportsAllDrives: true
  });

  return created.data;
}

export async function resolveKprUploadFolder({ clientName, bookingId }: { clientName?: string; bookingId?: string }) {
  const { parentFolderId } = getDriveCredentials();
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID is not configured in .env.local');
  }

  const cleanClient = (clientName || 'Valued Client').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const cleanBooking = (bookingId || 'GENERAL').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const clientBookingFolderTitle = `${cleanClient}-${cleanBooking}`;

  const kprRootFolder = await findOrCreateFolder('KPR Productions', parentFolderId);
  const clientFolder = await findOrCreateFolder(clientBookingFolderTitle, kprRootFolder.id!);
  const uploadsFolder = await findOrCreateFolder('uploads', clientFolder.id!);

  const folderPath = `KPR Productions/${clientBookingFolderTitle}/uploads`;

  return {
    rootFolder: kprRootFolder,
    clientFolder,
    uploadsFolder,
    folderId: uploadsFolder.id!,
    folderPath,
    webViewLink: uploadsFolder.webViewLink || `https://drive.google.com/drive/folders/${uploadsFolder.id}`
  };
}

export async function initiateResumableUploadSession({
  fileName,
  fileSize,
  mimeType = 'application/octet-stream',
  folderId
}: {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  folderId?: string;
}) {
  const auth = getAuthClient();
  const tokenResponse = await auth.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse.token;

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType
  };

  const initiateUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true';

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': mimeType || 'application/octet-stream'
  };

  if (fileSize !== undefined && fileSize !== null) {
    headers['X-Upload-Content-Length'] = String(fileSize);
  }

  const response = await fetch(initiateUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate resumable upload session (${response.status}): ${errorText}`);
  }

  const uploadUrl = response.headers.get('location') || response.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Google Drive did not return a resumable session Location URL');
  }

  return {
    success: true,
    uploadUrl,
    folderId
  };
}

export async function getDriveFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
    supportsAllDrives: true
  });
  return res.data;
}

export async function listFilesInFolder(folderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID, options: { pageSize?: number; orderBy?: string } = {}) {
  const targetFolderId = folderId || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  if (!targetFolderId) {
    throw new Error('No Google Drive folder ID specified and GOOGLE_DRIVE_PARENT_FOLDER_ID is not configured in .env.local');
  }

  const drive = getDriveClient();
  const query = `'${targetFolderId}' in parents and trashed = false`;

  const response = await drive.files.list({
    q: query,
    fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink, createdTime, modifiedTime)',
    pageSize: options.pageSize || 50,
    orderBy: options.orderBy || 'folder, modifiedTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives',
    ...options
  });

  return response.data;
}

export default {
  getDriveClient,
  getAuthClient,
  getDriveCredentials,
  findOrCreateFolder,
  resolveKprUploadFolder,
  initiateResumableUploadSession,
  getDriveFileMetadata,
  listFilesInFolder,
  GOOGLE_DRIVE_PARENT_FOLDER_ID
};

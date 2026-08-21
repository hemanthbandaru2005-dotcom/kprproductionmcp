import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env if in Node.js environment
if (typeof process !== 'undefined' && process.env) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

function cleanEnvValue(val) {
  if (!val) return '';
  let str = String(val).trim();
  if (str.includes('=')) {
    str = str.split('=').pop().trim();
  }
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

/**
 * Get Google Drive OAuth 2.0 Credentials from environment
 */
export function getDriveCredentials() {
  const clientId = cleanEnvValue(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const clientSecret = cleanEnvValue(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const refreshToken = cleanEnvValue(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
  const parentFolderId = cleanEnvValue(process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID);

  const isConfigured = Boolean(clientId && clientSecret && refreshToken);

  return {
    clientId,
    clientSecret,
    refreshToken,
    parentFolderId,
    configured: isConfigured,
    isConfigured: isConfigured,
    authMode: 'oauth2'
  };
}

/**
 * Google Drive OAuth Scopes
 */
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

let driveClientInstance = null;
let oauth2ClientInstance = null;

/**
 * Creates or returns the authenticated OAuth 2.0 client with auto-refresh
 */
export function getAuthClient() {
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

/**
 * Get authenticated Google Drive v3 Client
 */
export function getDriveClient() {
  const auth = getAuthClient();
  if (!driveClientInstance) {
    driveClientInstance = google.drive({
      version: 'v3',
      auth
    });
  }
  return driveClientInstance;
}

/**
 * Parent folder ID helper
 */
export const GOOGLE_DRIVE_PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '';

/**
 * Search for a folder by name inside a parent folder before creating to prevent duplicates.
 */
export async function findOrCreateFolder(folderName, parentFolderId) {
  const drive = getDriveClient();
  const safeName = folderName.replace(/'/g, "\\'");
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${safeName}' and '${parentFolderId}' in parents and trashed = false`;

  // 1. Search existing folder
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

  // 2. Create if not found
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

/**
 * Resolves the structured folder hierarchy:
 * Root -> "KPR Productions" -> "[Client Name]-[Booking ID]" -> "uploads"
 * Avoids duplicates on repeat uploads.
 */
export async function resolveKprUploadFolder({ clientName, bookingId }) {
  const { parentFolderId } = getDriveCredentials();
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID is not configured in .env.local');
  }

  const cleanClient = (clientName || 'Valued Client').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const cleanBooking = (bookingId || 'GENERAL').trim().replace(/[/\\?%*:|"<>]/g, '_');
  const clientBookingFolderTitle = `${cleanClient}-${cleanBooking}`;

  // 1. Root -> "KPR Productions"
  const kprRootFolder = await findOrCreateFolder('KPR Productions', parentFolderId);

  // 2. "KPR Productions" -> "[Client Name]-[Booking ID]"
  const clientFolder = await findOrCreateFolder(clientBookingFolderTitle, kprRootFolder.id);

  // 3. "[Client Name]-[Booking ID]" -> "uploads"
  const uploadsFolder = await findOrCreateFolder('uploads', clientFolder.id);

  const folderPath = `KPR Productions/${clientBookingFolderTitle}/uploads`;

  return {
    rootFolder: kprRootFolder,
    clientFolder,
    uploadsFolder,
    folderId: uploadsFolder.id,
    folderPath,
    webViewLink: uploadsFolder.webViewLink || `https://drive.google.com/drive/folders/${uploadsFolder.id}`
  };
}

/**
 * Initiate a Resumable Upload Session directly with Google Drive API
 * Returns the session URI (uploadUrl) to which chunk PUT requests are sent.
 */
export async function initiateResumableUploadSession({
  fileName,
  fileSize,
  mimeType = 'application/octet-stream',
  folderId
}) {
  const auth = getAuthClient();
  const tokenResponse = await auth.getAccessToken();
  const token = tokenResponse.token || tokenResponse;

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType
  };

  const initiateUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true';

  const headers = {
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

/**
 * Get metadata for a file in Google Drive
 */
export async function getDriveFileMetadata(fileId) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
    supportsAllDrives: true
  });
  return res.data;
}

/**
 * List files inside a specified parent folder
 */
export async function listFilesInFolder(folderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID, options = {}) {
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

// Default export
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

import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  getDriveCredentials,
  getDriveClient,
  resolveKprUploadFolder,
  initiateResumableUploadSession,
  getDriveFileMetadata,
  listFilesInFolder
} from '../lib/googleDrive.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PORT = process.env.PORT || 5000;
const mockUploadSessions = new Map();
const serverClientUploads = [];

function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => { chunks.push(chunk); });
    req.on('end', () => { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Range, Range, x-upload-url, x-drive-session-url, x-client-id, x-booking-id');
  res.setHeader('Access-Control-Expose-Headers', 'Range, Content-Range, Location');
}

const server = http.createServer(async (req, res) => {
  const fullUrl = req.url || '';
  const [pathname, queryString] = fullUrl.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // -------------------------------------------------------------
  // 1. Root & Index Endpoint (GET /, GET /api, GET /drive, GET /api/drive)
  // -------------------------------------------------------------
  if ((pathname === '/' || pathname === '/api' || pathname === '/drive' || pathname === '/api/drive' || pathname === '/app/api/drive') && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      service: 'KPR Photography Productions - Google Drive API Backend',
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        drive_test: '/api/drive/test',
        upload_initiate: '/app/api/drive/upload/initiate',
        upload_chunk: '/app/api/drive/upload/chunk',
        upload_complete: '/app/api/drive/upload/complete',
        list_uploads: '/app/api/drive/uploads'
      }
    }, null, 2));
  }

  // -------------------------------------------------------------
  // 2. Health Check Endpoint (GET /health, GET /api/health)
  // -------------------------------------------------------------
  if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      status: 'ok',
      service: 'kpr-photography-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  }

  // -------------------------------------------------------------
  // 3. GET /app/api/drive/test & /api/drive/test
  // -------------------------------------------------------------
  if ((pathname === '/app/api/drive/test' || pathname === '/api/drive/test') && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const creds = getDriveCredentials();
      const drive = getDriveClient();
      let parentFolderDetails = null;

      if (drive && creds.parentFolderId) {
        try {
          const folderRes = await drive.files.get({
            fileId: creds.parentFolderId,
            fields: 'id, name, mimeType, webViewLink, owners',
            supportsAllDrives: true
          });
          parentFolderDetails = folderRes.data;
        } catch (folderErr) {
          parentFolderDetails = { error: folderErr.message };
        }
      }

      let supabaseConnected = false;
      let tableRecordCount = 0;
      const supabase = getServerSupabase();
      if (supabase) {
        const { count, error } = await supabase
          .from('client_uploads')
          .select('*', { count: 'exact', head: true });
        if (!error) {
          supabaseConnected = true;
          tableRecordCount = count || 0;
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        authenticated: creds.configured,
        authMode: creds.authMode,
        hasRefreshToken: Boolean(creds.refreshToken),
        parentFolderId: creds.parentFolderId,
        parentFolderDetails,
        supabaseConnected,
        tableRecordCount,
        serverTime: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      res.statusCode = 500;
      return res.end(JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }));
    }
  }

  // -------------------------------------------------------------
  // 3. POST /app/api/drive/upload/initiate & /api/drive/upload/initiate
  // -------------------------------------------------------------
  if ((pathname === '/app/api/drive/upload/initiate' || pathname === '/api/drive/upload/initiate') && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const body = await parseJsonBody(req);
      const {
        clientId,
        clientName = 'Valued Client',
        clientEmail = '',
        bookingId,
        projectTitle = 'Client Deliverables',
        fileName,
        fileSize = 0,
        mimeType = 'application/octet-stream'
      } = body;

      if (!fileName) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'fileName is required' }));
      }

      const creds = getDriveCredentials();

      if (creds.configured) {
        try {
          const folderInfo = await resolveKprUploadFolder({
            clientId,
            clientName,
            bookingId: bookingId || projectTitle,
            projectTitle
          });

          const sessionInfo = await initiateResumableUploadSession({
            fileName,
            mimeType,
            fileSize,
            parentFolderId: folderInfo.folderId
          });

          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: true,
            uploadUrl: sessionInfo.uploadUrl,
            folderId: folderInfo.folderId,
            folderPath: folderInfo.folderPath,
            isMock: false
          }));
        } catch (driveErr) {
          console.warn('Drive initiate failed, falling back to mock session:', driveErr.message);
        }
      }

      const mockSessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const host = req.headers.host || `localhost:${PORT}`;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const mockUploadUrl = `${protocol}://${host}/app/api/drive/upload/chunk?mock_session=${mockSessionId}`;

      mockUploadSessions.set(mockSessionId, {
        fileName,
        fileSize: Number(fileSize),
        mimeType,
        receivedBytes: 0,
        chunks: [],
        createdAt: Date.now()
      });

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        uploadUrl: mockUploadUrl,
        folderId: 'mock_folder_kpr_root',
        folderPath: `KPR Productions / ${clientName} / ${projectTitle}`,
        isMock: true
      }));

    } catch (error) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: error.message || 'Failed to initiate upload session' }));
    }
  }

  // -------------------------------------------------------------
  // 4. PUT / POST /app/api/drive/upload/chunk
  // -------------------------------------------------------------
  if ((pathname === '/app/api/drive/upload/chunk' || pathname === '/api/drive/upload/chunk') && (req.method === 'PUT' || req.method === 'POST')) {
    res.setHeader('Content-Type', 'application/json');
    try {
      const uploadUrl = req.headers['x-upload-url'] || queryParams.get('mock_session');
      const contentRange = req.headers['content-range'] || '';
      const rawChunk = await parseRawBody(req);

      if (!uploadUrl) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'x-upload-url header or mock_session query is required' }));
      }

      if (uploadUrl.startsWith('http://') || uploadUrl.startsWith('https://')) {
        const driveReqHeaders = {
          'Content-Length': String(rawChunk.length)
        };
        if (contentRange) driveReqHeaders['Content-Range'] = contentRange;
        if (req.headers['content-type']) driveReqHeaders['Content-Type'] = req.headers['content-type'];

        const driveFetchRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: driveReqHeaders,
          body: rawChunk
        });

        res.statusCode = driveFetchRes.status;
        const driveRangeHeader = driveFetchRes.headers.get('range') || driveFetchRes.headers.get('Range');
        if (driveRangeHeader) res.setHeader('Range', driveRangeHeader);

        const textResponse = await driveFetchRes.text();
        return res.end(textResponse);
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({ id: `mock_file_${Date.now()}` }));

    } catch (error) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: error.message || 'Chunk proxy failed' }));
    }
  }

  // -------------------------------------------------------------
  // 5. POST /app/api/drive/upload/complete
  // -------------------------------------------------------------
  if ((pathname === '/app/api/drive/upload/complete' || pathname === '/api/drive/upload/complete') && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const body = await parseJsonBody(req);
      const {
        uploadId,
        clientId,
        clientName,
        clientEmail,
        bookingId,
        projectTitle,
        fileId,
        fileName,
        fileSize,
        folderId,
        folderPath
      } = body;

      let webViewLink = body.webViewLink || null;
      let fileMeta = null;

      if (fileId && !fileId.startsWith('mock_')) {
        try {
          fileMeta = await getDriveFileMetadata(fileId);
          if (fileMeta?.webViewLink) webViewLink = fileMeta.webViewLink;
        } catch (metaErr) {
          if (!webViewLink) webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        }
      }

      const effectiveName = fileName || fileMeta?.name || 'Uploaded File';
      const fileExt = effectiveName.split('.').pop()?.toLowerCase() || '';
      const effectiveSize = fileSize || fileMeta?.size || 0;
      const finalUploadId = uploadId || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const uploadRecord = {
        id: finalUploadId,
        client_id: clientId || null,
        client_name: clientName || 'Valued Client',
        client_email: clientEmail || '',
        project_id: bookingId || null,
        project_title: projectTitle || (bookingId ? `Booking ${bookingId}` : 'General Deliverables'),
        file_name: effectiveName,
        file_type: fileExt,
        file_size: Number(effectiveSize),
        file_url: webViewLink,
        drive_sync_status: 'synced',
        drive_file_id: fileId,
        drive_file_url: webViewLink,
        drive_folder_id: folderId || null,
        drive_folder_path: folderPath || 'KPR Productions Client Uploads',
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const supabase = getServerSupabase();
      if (supabase) {
        try {
          await supabase.from('client_uploads').upsert(uploadRecord);
          await supabase.channel('kpr-portal-realtime').send({
            type: 'broadcast',
            event: 'new-upload',
            payload: uploadRecord
          });
        } catch (supaErr) {
          console.warn('Supabase upsert warning:', supaErr.message);
        }
      }

      const existingIdx = serverClientUploads.findIndex(r => r.id === uploadRecord.id);
      if (existingIdx >= 0) {
        serverClientUploads[existingIdx] = uploadRecord;
      } else {
        serverClientUploads.unshift(uploadRecord);
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        message: 'Client upload finalized and synced successfully',
        record: uploadRecord
      }));

    } catch (error) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: error.message || 'Failed to complete upload record' }));
    }
  }

  // -------------------------------------------------------------
  // 6. GET /app/api/drive/uploads & /api/drive/uploads
  // -------------------------------------------------------------
  if ((pathname === '/app/api/drive/uploads' || pathname === '/api/drive/uploads') && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      records: serverClientUploads
    }));
  }

  // 404 for unknown routes
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 KPR Backend Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Drive test: http://localhost:${PORT}/api/drive/test\n`);
});

export default server;

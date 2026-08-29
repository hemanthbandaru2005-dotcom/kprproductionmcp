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
const serverJobs = [
  {
    id: 'job-init-1',
    title: 'Grand Royal Wedding Shoot',
    client_name: 'Vikram & Ananya',
    shoot_type: 'Wedding',
    shoot_date: '2026-09-10',
    date: '2026-09-10',
    due_date: '2026-09-10',
    assigned_worker: 'worker@kpr.com',
    assigned_worker_name: 'worker@kpr.com',
    notes: 'Full candid wedding coverage + cinematic drone shoots',
    status: 'in_progress',
    progress_percent: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

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
  const normalizedPath = (pathname.replace(/\/+$/, '') || '/').toLowerCase();

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // -------------------------------------------------------------
  // 1. Root & Index Endpoint
  // -------------------------------------------------------------
  if (['/', '/api', '/drive', '/api/drive', '/app/api/drive'].includes(normalizedPath) && req.method === 'GET') {
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
  // 2. Health Check Endpoint
  // -------------------------------------------------------------
  if (['/health', '/api/health'].includes(normalizedPath) && req.method === 'GET') {
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
  if (['/app/api/drive/test', '/api/drive/test', '/drive/test', '/api/test'].includes(normalizedPath) && req.method === 'GET') {
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
  // 4. POST /app/api/drive/upload/initiate & aliases
  // -------------------------------------------------------------
  if (['/app/api/drive/upload/initiate', '/api/drive/upload/initiate', '/drive/upload/initiate', '/api/upload/initiate', '/upload/initiate'].includes(normalizedPath) && req.method === 'POST') {
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

      if (creds.isConfigured || creds.configured) {
        try {
          const folderInfo = await resolveKprUploadFolder({
            clientId,
            clientName,
            bookingId: bookingId || projectTitle,
            projectTitle
          });

          const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '*');

          const sessionInfo = await initiateResumableUploadSession({
            fileName,
            mimeType,
            fileSize,
            folderId: folderInfo.folderId,
            parentFolderId: folderInfo.folderId,
            origin: clientOrigin
          });

          console.log(`\n[Google Drive API] Resumable session created for "${fileName}" (${fileSize} bytes)`);
          console.log(`📁 Target Folder: "${folderInfo.folderPath}" [ID: ${folderInfo.folderId}]`);
          console.log(`🔗 Session URL: ${sessionInfo.uploadUrl.substring(0, 80)}...\n`);

          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: true,
            uploadUrl: sessionInfo.uploadUrl,
            folderId: folderInfo.folderId,
            folderPath: folderInfo.folderPath,
            isMock: false
          }));
        } catch (driveErr) {
          console.error('Google Drive Session Initiation Error:', driveErr);
          res.statusCode = 500;
          return res.end(JSON.stringify({
            success: false,
            error: `Google Drive upload initiation failed: ${driveErr.message}`
          }));
        }
      }

      console.warn('[Warning] Google Drive credentials not configured. Using local mock session.');
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
      console.error('Initiate Route Error:', error);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: error.message || 'Failed to initiate upload session' }));
    }
  }

  // -------------------------------------------------------------
  // 5. PUT / POST /app/api/drive/upload/chunk & aliases
  // -------------------------------------------------------------
  if (['/app/api/drive/upload/chunk', '/api/drive/upload/chunk', '/drive/upload/chunk', '/api/upload/chunk', '/upload/chunk'].includes(normalizedPath) && (req.method === 'PUT' || req.method === 'POST')) {
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
  // 6. POST /app/api/drive/upload/complete & aliases
  // -------------------------------------------------------------
  if (['/app/api/drive/upload/complete', '/api/drive/upload/complete', '/drive/upload/complete', '/api/upload/complete', '/upload/complete'].includes(normalizedPath) && req.method === 'POST') {
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
  // 7. GET /app/api/drive/uploads & aliases
  // -------------------------------------------------------------
  if (['/app/api/drive/uploads', '/api/drive/uploads', '/drive/uploads', '/api/uploads', '/uploads'].includes(normalizedPath) && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      records: serverClientUploads
    }));
  }

  // -------------------------------------------------------------
  // 7a. DELETE /app/api/drive/upload/:id & /app/api/drive/uploads/:id
  // -------------------------------------------------------------
  if ((normalizedPath.startsWith('/app/api/drive/upload/') ||
       normalizedPath.startsWith('/api/drive/upload/') ||
       normalizedPath.startsWith('/drive/upload/') ||
       normalizedPath.startsWith('/app/api/drive/uploads/') ||
       normalizedPath.startsWith('/api/drive/uploads/')) && req.method === 'DELETE') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const uploadId = decodeURIComponent(normalizedPath.split('/').pop() || '');
      const cleanId = uploadId.replace(/^worker_jf_/, '');

      // 1. Remove from server memory
      let targetFile = null;
      for (let i = serverClientUploads.length - 1; i >= 0; i--) {
        const item = serverClientUploads[i];
        if (item.id === uploadId || item.id === cleanId || item.drive_file_id === uploadId || item.file_name === uploadId) {
          targetFile = item;
          serverClientUploads.splice(i, 1);
        }
      }

      // 2. If Google Drive file ID is known, delete from Google Drive
      const driveFileId = targetFile?.drive_file_id || (!uploadId.startsWith('upload_') && !uploadId.startsWith('worker_') ? uploadId : null);
      if (driveFileId) {
        try {
          const drive = getDriveClient();
          if (drive) {
            await drive.files.delete({ fileId: driveFileId, supportsAllDrives: true });
          }
        } catch (e) {}
      }

      // 3. Delete from Supabase & Broadcast deletion
      const supabase = getServerSupabase();
      if (supabase) {
        try {
          await supabase.from('client_uploads').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
          await supabase.from('job_files').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
          if (targetFile?.file_name) {
            await supabase.from('client_uploads').delete().eq('file_name', targetFile.file_name);
          }

          // Insert blacklist record with valid UUID
          const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
          await supabase.from('verifications').insert([{
            id: uuid,
            client_id: uploadId,
            client_name: 'SYSTEM_DELETION_SYNC',
            client_email: 'sync@kpr.com',
            album_id: 'SYSTEM_DELETED_UPLOADS',
            event_id: uploadId,
            event_title: targetFile?.file_name || 'Deleted Upload',
            client_note: targetFile?.file_name || '',
            status: 'deleted',
            notes: JSON.stringify({ id: uploadId, cleanId, fileName: targetFile?.file_name, deleted_at: new Date().toISOString() }),
            sent_at: new Date().toISOString()
          }]);

          // Realtime broadcast to all devices
          await supabase.channel('kpr_client_uploads_broadcast_v1').send({
            type: 'broadcast',
            event: 'delete_upload',
            payload: { uploadId, cleanId, fileName: targetFile?.file_name }
          });
        } catch (supaErr) {
          console.warn('Supabase delete sync warning:', supaErr.message);
        }
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true, message: 'Upload permanently deleted' }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Failed to delete upload' }));
    }
  }

  // -------------------------------------------------------------
  // 8. GET /app/api/jobs & /api/jobs (Sync across all Admins & Workers)
  // -------------------------------------------------------------
  if (['/app/api/jobs', '/api/jobs', '/jobs'].includes(normalizedPath) && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify({
      success: true,
      jobs: serverJobs
    }));
  }

  // -------------------------------------------------------------
  // 9. POST /app/api/jobs & /api/jobs (Create Job)
  // -------------------------------------------------------------
  if (['/app/api/jobs', '/api/jobs', '/jobs'].includes(normalizedPath) && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      const body = await parseJsonBody(req);
      const newJob = {
        id: body.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: (body.title || '').trim(),
        client_name: (body.client_name || '').trim() || null,
        shoot_type: (body.shoot_type || 'Photoshoot').trim(),
        shoot_date: body.shoot_date || body.date || null,
        date: body.shoot_date || body.date || null,
        due_date: body.shoot_date || body.date || null,
        assigned_worker: (body.assigned_worker || '').trim().toLowerCase() || null,
        assigned_worker_name: (body.assigned_worker_name || body.assigned_worker || '').trim() || null,
        notes: (body.notes || '').trim() || null,
        status: body.status || 'in_progress',
        progress_percent: body.progress_percent || 0,
        created_at: body.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const existingIdx = serverJobs.findIndex(j => j.id === newJob.id);
      if (existingIdx >= 0) {
        serverJobs[existingIdx] = newJob;
      } else {
        serverJobs.unshift(newJob);
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true, job: newJob }));
    } catch (e) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: e.message || 'Failed to create job' }));
    }
  }

  // -------------------------------------------------------------
  // 10. PUT & DELETE /app/api/jobs/:id
  // -------------------------------------------------------------
  if (normalizedPath.startsWith('/app/api/jobs/') || normalizedPath.startsWith('/api/jobs/') || normalizedPath.startsWith('/jobs/')) {
    const jobId = normalizedPath.split('/').pop();

    if (req.method === 'PUT') {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body = await parseJsonBody(req);
        const existingIdx = serverJobs.findIndex(j => j.id === jobId);
        const existing = existingIdx >= 0 ? serverJobs[existingIdx] : { id: jobId };

        const updatedJob = {
          ...existing,
          ...body,
          id: jobId,
          updated_at: new Date().toISOString()
        };

        if (existingIdx >= 0) {
          serverJobs[existingIdx] = updatedJob;
        } else {
          serverJobs.unshift(updatedJob);
        }

        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, job: updatedJob }));
      } catch (e) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: e.message || 'Failed to update job' }));
      }
    }

    if (req.method === 'DELETE') {
      res.setHeader('Content-Type', 'application/json');
      const idx = serverJobs.findIndex(j => j.id === jobId);
      if (idx >= 0) {
        serverJobs.splice(idx, 1);
      }
      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true }));
    }
  }

  // -------------------------------------------------------------
  // 11. POST /api/cleanup-test-data & /app/api/cleanup-test-data
  // -------------------------------------------------------------
  if ((normalizedPath === '/api/cleanup-test-data' || normalizedPath === '/app/api/cleanup-test-data' || normalizedPath === '/api/admin/clean-fake-data') && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    try {
      // 1. Clear server-side in-memory mock jobs and mock uploads
      serverJobs.length = 0;
      serverClientUploads.length = 0;
      mockUploadSessions.clear();

      let supabaseDeleted = {
        jobs: 0,
        uploads: 0,
        messages: 0
      };

      const serverSupabase = getServerSupabase();
      if (serverSupabase) {
        // Safe deletion of test jobs
        try {
          const { data: delJobs, error: errJobs } = await serverSupabase
            .from('jobs')
            .delete()
            .or('id.like.job-init-%,id.like.test-%,title.ilike.%test%,title.ilike.%demo%,client_name.ilike.%test%,client_name.ilike.%demo%')
            .select('id');
          if (!errJobs && delJobs) supabaseDeleted.jobs = delJobs.length;
        } catch (e) {}

        // Safe deletion of test uploads
        try {
          const { data: delUps, error: errUps } = await serverSupabase
            .from('client_uploads')
            .delete()
            .or('client_email.ilike.%test%,client_email.ilike.%example.com%,client_name.ilike.%test%')
            .select('id');
          if (!errUps && delUps) supabaseDeleted.uploads = delUps.length;
        } catch (e) {}

        // Safe deletion of test chat messages
        try {
          const { data: delMsgs, error: errMsgs } = await serverSupabase
            .from('chat_messages')
            .delete()
            .or('sender_email.ilike.%test%,sender_email.ilike.%example.com%,message.ilike.%test message%')
            .select('id');
          if (!errMsgs && delMsgs) supabaseDeleted.messages = delMsgs.length;
        } catch (e) {}
      }

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        message: 'All fake test data deleted successfully. Real production data is untouched.',
        deleted: supabaseDeleted
      }));
    } catch (e) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: e.message || 'Cleanup failed' }));
    }
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

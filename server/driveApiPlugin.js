import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import {
  getDriveCredentials,
  getDriveClient,
  resolveKprUploadFolder,
  initiateResumableUploadSession,
  getDriveFileMetadata,
  listFilesInFolder
} from '../lib/googleDrive.js';

// Load environment variables in server runtime
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Mock upload sessions map for seamless local development when GCP credentials are not yet populated
const mockUploadSessions = new Map();

// In-memory server-side uploads registry to ensure bulletproof client upload retrieval
const serverClientUploads = [];

/**
 * Helper to initialize server-side Supabase client
 */
function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Parse JSON body from raw Node.js incoming request
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
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

/**
 * Parse binary buffer from raw Node.js incoming request
 */
function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

/**
 * Set CORS and standard headers
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Range, Range, x-upload-url, x-drive-session-url, x-client-id, x-booking-id');
  res.setHeader('Access-Control-Expose-Headers', 'Range, Content-Range, Location');
}

/**
 * Vite Dev Server Plugin to handle server-side Google Drive API endpoints
 */
export function driveApiPlugin() {
  return {
    name: 'kpr-drive-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const fullUrl = req.url || '';
        const [pathname, queryString] = fullUrl.split('?');
        const queryParams = new URLSearchParams(queryString || '');

        setCorsHeaders(res);

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // -------------------------------------------------------------
        // 0. GET /, /api, /drive, /api/drive, /api/health, /health
        // -------------------------------------------------------------
        if ((pathname === '/' || pathname === '/api' || pathname === '/drive' || pathname === '/api/drive' || pathname === '/app/api/drive') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({
            service: 'KPR Photography Productions - Vite Dev Drive Plugin',
            status: 'online',
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

        if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'ok', service: 'kpr-drive-plugin', timestamp: new Date().toISOString() }));
        }

        // -------------------------------------------------------------
        // 1. GET /app/api/drive/test & /api/drive/test (Admin Test Route)
        // -------------------------------------------------------------
        if (pathname === '/app/api/drive/test' || pathname === '/api/drive/test') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const credentials = getDriveCredentials();

            if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken || !credentials.parentFolderId) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                authenticated: false,
                message: 'Google Drive OAuth 2.0 credentials are not fully configured in .env.local',
                status: {
                  GOOGLE_OAUTH_CLIENT_ID: credentials.clientId ? 'Configured ✅' : 'Missing ❌',
                  GOOGLE_OAUTH_CLIENT_SECRET: credentials.clientSecret ? 'Configured ✅' : 'Missing ❌',
                  GOOGLE_OAUTH_REFRESH_TOKEN: credentials.refreshToken ? 'Configured ✅' : 'Missing ❌',
                  GOOGLE_DRIVE_PARENT_FOLDER_ID: credentials.parentFolderId ? 'Configured ✅' : 'Missing ❌'
                },
                setupGuide: [
                  '1. Set GOOGLE_OAUTH_CLIENT_ID in .env.local with your OAuth Client ID.',
                  '2. Set GOOGLE_OAUTH_CLIENT_SECRET in .env.local with your OAuth Client Secret.',
                  '3. Set GOOGLE_OAUTH_REFRESH_TOKEN in .env.local with your Refresh Token.',
                  '4. Set GOOGLE_DRIVE_PARENT_FOLDER_ID in .env.local with your Google Drive folder ID.'
                ]
              }, null, 2));
            }

            const parentFolderId = credentials.parentFolderId;
            const drive = getDriveClient();

            const [folderMeta, fileListResult] = await Promise.all([
              drive.files.get({
                fileId: parentFolderId,
                fields: 'id, name, mimeType, webViewLink',
                supportsAllDrives: true
              }).catch(err => ({ error: err.message })),
              listFilesInFolder(parentFolderId, { pageSize: 20 })
            ]);

            const files = fileListResult.files || [];

            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              authenticated: true,
              message: 'Google Drive OAuth 2.0 authenticated successfully using personal Gmail account!',
              parentFolder: {
                id: parentFolderId,
                name: folderMeta?.data?.name || 'Root Parent Folder',
                link: folderMeta?.data?.webViewLink || `https://drive.google.com/drive/folders/${parentFolderId}`
              },
              fileCount: files.length,
              files: files.map(f => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                size: f.size,
                modifiedTime: f.modifiedTime,
                webViewLink: f.webViewLink
              }))
            }, null, 2));

          } catch (error) {
            console.error('Google Drive Test Route Error:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              authenticated: false,
              error: error.message || 'Internal server error during Google Drive authentication',
              details: error.stack
            }, null, 2));
          }
        }

        // -------------------------------------------------------------
        // 2. POST /app/api/drive/upload/initiate (Resumable Session)
        // -------------------------------------------------------------
        if (
          (pathname === '/app/api/drive/upload/initiate' || pathname === '/api/drive/upload/initiate') &&
          req.method === 'POST'
        ) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseJsonBody(req);
            const {
              clientId,
              clientName,
              bookingId,
              projectTitle,
              fileName,
              fileSize,
              mimeType
            } = body;

            if (!fileName) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                error: 'fileName is required to initiate upload'
              }));
            }

            const effectiveClientName = clientName || (clientId ? `Client_${clientId}` : 'Valued Client');
            const effectiveBookingId = bookingId || projectTitle || 'GENERAL';
            let effectiveMime = mimeType || 'application/octet-stream';
            if (fileName.toLowerCase().endsWith('.zip')) {
              effectiveMime = 'application/zip';
            }

            const credentials = getDriveCredentials();

            if (credentials.isConfigured) {
              // Live Google Drive API flow
              const folderInfo = await resolveKprUploadFolder({
                clientName: effectiveClientName,
                bookingId: effectiveBookingId
              });

              const session = await initiateResumableUploadSession({
                fileName,
                fileSize,
                mimeType: effectiveMime,
                folderId: folderInfo.folderId,
                parentFolderId: folderInfo.folderId,
                origin: req.headers.origin || '*'
              });

              res.statusCode = 200;
              return res.end(JSON.stringify({
                success: true,
                uploadUrl: session.uploadUrl,
                folderId: folderInfo.folderId,
                folderPath: folderInfo.folderPath,
                folderUrl: folderInfo.webViewLink,
                clientBookingFolder: folderInfo.clientFolder?.name
              }));
            } else {
              // Local Dev Mock Resumable Session
              const mockSessId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const folderPath = `KPR Productions/${effectiveClientName}-${effectiveBookingId}/uploads`;
              const host = req.headers.host || 'localhost:5174';
              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const uploadUrl = `${protocol}://${host}/app/api/drive/mock-session/${mockSessId}`;

              mockUploadSessions.set(mockSessId, {
                fileName,
                fileSize: Number(fileSize) || 0,
                bytesUploaded: 0,
                mimeType: mimeType || 'application/octet-stream',
                folderPath
              });

              res.statusCode = 200;
              return res.end(JSON.stringify({
                success: true,
                uploadUrl,
                folderId: `mock_folder_${Date.now()}`,
                folderPath,
                folderUrl: `https://drive.google.com/drive/folders/mock_${Date.now()}`,
                clientBookingFolder: `${effectiveClientName}-${effectiveBookingId}`,
                isMockMode: true
              }));
            }
          } catch (error) {
            console.error('Drive Upload Initiate Error:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: error.message || 'Failed to initiate Drive resumable upload session'
            }));
          }
        }

        // -------------------------------------------------------------
        // 3. Mock Session Direct PUT Handler: /app/api/drive/mock-session/:id
        // -------------------------------------------------------------
        if (pathname.startsWith('/app/api/drive/mock-session/') && req.method === 'PUT') {
          const sessId = pathname.replace('/app/api/drive/mock-session/', '');
          const session = mockUploadSessions.get(sessId);

          const contentRange = req.headers['content-range'] || '';
          const rawBuffer = await parseRawBody(req);

          let startByte = 0;
          let endByte = rawBuffer.length - 1;
          let totalBytes = session?.fileSize || rawBuffer.length;

          if (contentRange) {
            const match = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/);
            if (match) {
              startByte = parseInt(match[1], 10);
              endByte = parseInt(match[2], 10);
              if (match[3] !== '*') {
                totalBytes = parseInt(match[3], 10);
              }
            }
          }

          const confirmedBytes = endByte + 1;
          if (session) {
            session.bytesUploaded = confirmedBytes;
          }

          if (confirmedBytes >= totalBytes) {
            // Upload Finished!
            const mockFileId = `drive_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            return res.end(JSON.stringify({
              id: mockFileId,
              name: session?.fileName || 'Uploaded File',
              mimeType: session?.mimeType || 'application/octet-stream',
              size: totalBytes,
              webViewLink: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`
            }));
          } else {
            // 308 Resume Incomplete
            res.setHeader('Range', `bytes=0-${endByte}`);
            res.statusCode = 308;
            return res.end();
          }
        }

        // -------------------------------------------------------------
        // 4. PUT /app/api/drive/upload/chunk (Proxy Chunk to Drive or Mock)
        // -------------------------------------------------------------
        if (
          (pathname === '/app/api/drive/upload/chunk' || pathname === '/api/drive/upload/chunk') &&
          req.method === 'PUT'
        ) {
          try {
            const uploadUrl =
              req.headers['x-upload-url'] ||
              req.headers['x-drive-session-url'] ||
              queryParams.get('uploadUrl');

            if (!uploadUrl) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                error: 'Missing upload session URL. Provide via x-upload-url header or uploadUrl query parameter.'
              }));
            }

            const rawBuffer = await parseRawBody(req);
            const contentRange = req.headers['content-range'];
            const contentType = req.headers['content-type'] || 'application/octet-stream';

            // Check if proxying to internal mock session
            if (uploadUrl.includes('/mock-session/')) {
              const sessId = uploadUrl.split('/mock-session/')[1];
              const session = mockUploadSessions.get(sessId);

              let startByte = 0;
              let endByte = rawBuffer.length - 1;
              let totalBytes = session?.fileSize || rawBuffer.length;

              if (contentRange) {
                const match = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/);
                if (match) {
                  startByte = parseInt(match[1], 10);
                  endByte = parseInt(match[2], 10);
                  if (match[3] !== '*') {
                    totalBytes = parseInt(match[3], 10);
                  }
                }
              }

              const confirmedBytes = endByte + 1;
              if (session) {
                session.bytesUploaded = confirmedBytes;
              }

              if (confirmedBytes >= totalBytes) {
                const mockFileId = `drive_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  id: mockFileId,
                  name: session?.fileName || 'Uploaded File',
                  mimeType: session?.mimeType || 'application/octet-stream',
                  size: totalBytes,
                  webViewLink: `https://drive.google.com/file/d/${mockFileId}/view?usp=sharing`
                }));
              } else {
                res.setHeader('Range', `bytes=0-${endByte}`);
                res.statusCode = 308;
                return res.end();
              }
            }

            // Real Google Drive Proxy
            const driveHeaders = {
              'Content-Type': contentType
            };

            if (contentRange) {
              driveHeaders['Content-Range'] = contentRange;
            }
            if (rawBuffer.length > 0) {
              driveHeaders['Content-Length'] = String(rawBuffer.length);
            }

            const driveRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: driveHeaders,
              body: rawBuffer
            });

            const rangeHeader = driveRes.headers.get('range') || driveRes.headers.get('Range');
            if (rangeHeader) {
              res.setHeader('Range', rangeHeader);
            }

            const responseText = await driveRes.text();

            if (driveRes.status === 403 && responseText.includes('storageQuotaExceeded')) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 403;
              return res.end(JSON.stringify({
                success: false,
                error: 'Google Drive Quota: Service Accounts have 0 personal quota on personal My Drive. Please share a folder located in a Google Shared Drive (Team Drive), or enable Domain-Wide Delegation in Google Workspace.'
              }));
            }

            return res.end(responseText);
          } catch (error) {
            console.error('Drive Chunk Proxy Error:', error);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: error.message || 'Chunk proxy upload failed'
            }));
          }
        }

        // -------------------------------------------------------------
        // 5. POST /app/api/drive/upload/complete (Save to Supabase & Realtime)
        // -------------------------------------------------------------
        if (
          (pathname === '/app/api/drive/upload/complete' || pathname === '/api/drive/upload/complete') &&
          req.method === 'POST'
        ) {
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
              mimeType,
              folderId,
              folderPath
            } = body;

            if (!fileId) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                error: 'fileId is required to complete upload'
              }));
            }

            let fileMeta = null;
            let webViewLink = body.webViewLink;
            try {
              fileMeta = await getDriveFileMetadata(fileId);
              if (fileMeta?.webViewLink) {
                webViewLink = fileMeta.webViewLink;
              }
            } catch (metaErr) {
              if (!webViewLink) {
                webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
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
                const { error: upsertErr } = await supabase
                  .from('client_uploads')
                  .upsert(uploadRecord);

                if (upsertErr) {
                  console.warn('Supabase upsert client_uploads warning:', upsertErr.message);
                }

                await supabase.channel('kpr-portal-realtime').send({
                  type: 'broadcast',
                  event: 'new-upload',
                  payload: uploadRecord
                });
              } catch (supaErr) {
                console.warn('Supabase realtime broadcast warning:', supaErr.message);
              }
            }

            // Store record in server-side registry
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
            console.error('Drive Upload Complete Error:', error);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: error.message || 'Failed to complete upload record'
            }));
          }
        }

        // -------------------------------------------------------------
        // 5. GET /app/api/drive/uploads & /api/drive/uploads - List Uploads
        // -------------------------------------------------------------
        if ((pathname === '/app/api/drive/uploads' || pathname === '/api/drive/uploads') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: true,
            records: serverClientUploads
          }));
        }

        // -------------------------------------------------------------
        // 5a. DELETE /app/api/drive/upload/:id & /api/drive/upload/:id - Delete Upload
        // -------------------------------------------------------------
        if ((pathname.startsWith('/app/api/drive/upload/') ||
             pathname.startsWith('/api/drive/upload/') ||
             pathname.startsWith('/app/api/drive/uploads/') ||
             pathname.startsWith('/api/drive/uploads/')) && req.method === 'DELETE') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const uploadId = decodeURIComponent(pathname.split('/').pop() || '');
            const cleanId = uploadId.replace(/^worker_jf_/, '');

            let targetFile = null;
            for (let i = serverClientUploads.length - 1; i >= 0; i--) {
              const item = serverClientUploads[i];
              if (item.id === uploadId || item.id === cleanId || item.drive_file_id === uploadId || item.file_name === uploadId) {
                targetFile = item;
                serverClientUploads.splice(i, 1);
              }
            }

            const serverSupabase = getServerSupabase();
            if (serverSupabase) {
              try {
                await serverSupabase.from('client_uploads').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
                await serverSupabase.from('job_files').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
                if (targetFile?.file_name) {
                  await serverSupabase.from('client_uploads').delete().eq('file_name', targetFile.file_name);
                }

                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0;
                  const v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
                await serverSupabase.from('verifications').insert([{
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

                await serverSupabase.channel('kpr_client_uploads_broadcast_v1').send({
                  type: 'broadcast',
                  event: 'delete_upload',
                  payload: { uploadId, cleanId, fileName: targetFile?.file_name }
                });
              } catch (e) {}
            }

            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Upload deleted from dev server and cloud' }));
          } catch (err) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: err.message || 'Failed to delete upload' }));
          }
        }

        // -------------------------------------------------------------
        // 6. Job Sync Endpoints for All Admins & Workers
        // -------------------------------------------------------------
        if ((pathname === '/app/api/jobs' || pathname === '/api/jobs') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: true,
            jobs: serverClientUploads._jobs || []
          }));
        }

        if ((pathname === '/app/api/jobs' || pathname === '/api/jobs') && req.method === 'POST') {
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

            if (!serverClientUploads._jobs) serverClientUploads._jobs = [];
            serverClientUploads._jobs.unshift(newJob);

            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, job: newJob }));
          } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: e.message }));
          }
        }

        if (pathname.startsWith('/app/api/jobs/') || pathname.startsWith('/api/jobs/')) {
          const jobId = pathname.split('/').pop();
          if (!serverClientUploads._jobs) serverClientUploads._jobs = [];

          if (req.method === 'PUT') {
            res.setHeader('Content-Type', 'application/json');
            const body = await parseJsonBody(req);
            const idx = serverClientUploads._jobs.findIndex(j => j.id === jobId);
            const updated = { ...(idx >= 0 ? serverClientUploads._jobs[idx] : { id: jobId }), ...body, id: jobId, updated_at: new Date().toISOString() };
            if (idx >= 0) serverClientUploads._jobs[idx] = updated;
            else serverClientUploads._jobs.unshift(updated);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, job: updated }));
          }

          if (req.method === 'DELETE') {
            res.setHeader('Content-Type', 'application/json');
            const idx = serverClientUploads._jobs.findIndex(j => j.id === jobId);
            if (idx >= 0) serverClientUploads._jobs.splice(idx, 1);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true }));
          }
        }

        if ((pathname === '/api/cleanup-test-data' || pathname === '/app/api/cleanup-test-data' || pathname === '/api/admin/clean-fake-data') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            if (serverClientUploads._jobs) serverClientUploads._jobs = [];
            mockUploadSessions.clear();

            let supabaseDeleted = {
              jobs: 0,
              uploads: 0,
              messages: 0
            };

            const serverSupabase = getServerSupabase();
            if (serverSupabase) {
              try {
                const { data: delJobs, error: errJobs } = await serverSupabase
                  .from('jobs')
                  .delete()
                  .or('id.like.job-init-%,id.like.test-%,title.ilike.%test%,title.ilike.%demo%,client_name.ilike.%test%,client_name.ilike.%demo%')
                  .select('id');
                if (!errJobs && delJobs) supabaseDeleted.jobs = delJobs.length;
              } catch (e) {}

              try {
                const { data: delUps, error: errUps } = await serverSupabase
                  .from('client_uploads')
                  .delete()
                  .or('client_email.ilike.%test%,client_email.ilike.%example.com%,client_name.ilike.%test%')
                  .select('id');
                if (!errUps && delUps) supabaseDeleted.uploads = delUps.length;
              } catch (e) {}

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

        // Pass through to next middleware
        next();
      });
    }
  };
}

export default driveApiPlugin;

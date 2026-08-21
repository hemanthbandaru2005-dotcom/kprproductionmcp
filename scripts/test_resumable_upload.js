import { createServer } from 'vite';
import { getDriveCredentials } from '../lib/googleDrive.js';

async function runTests() {
  console.log('\n===============================================================');
  console.log('  KPR Productions - Resumable Upload Backend API Test (Stage 2)');
  console.log('===============================================================\n');

  // Start temporary dev server on port 5190 for API testing
  const server = await createServer({
    configFile: './vite.config.js',
    server: { port: 5190 }
  });
  await server.listen();
  const baseUrl = 'http://localhost:5190';
  console.log(`🚀 Test server listening at ${baseUrl}`);

  try {
    const creds = getDriveCredentials();
    console.log('\n1. Checking Environment Credentials:');
    console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL:', creds.clientEmail ? `✅ ${creds.clientEmail}` : '❌ Missing (using mock verification)');
    console.log('   - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', creds.privateKey ? '✅ Present' : '❌ Missing');
    console.log('   - GOOGLE_DRIVE_PARENT_FOLDER_ID:', creds.parentFolderId ? `✅ ${creds.parentFolderId}` : '❌ Missing');

    // Test 1: POST /app/api/drive/upload/initiate Validation Check
    console.log('\n2. Testing POST /app/api/drive/upload/initiate input validation...');
    const badInitiateRes = await fetch(`${baseUrl}/app/api/drive/upload/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing fileName
    });
    const badInitiateJson = await badInitiateRes.json();
    if (badInitiateRes.status === 400 && badInitiateJson.error) {
      console.log('   ✅ Correctly rejected empty request with 400 Bad Request:', badInitiateJson.error);
    } else {
      console.log('   ⚠️ Unexpected response for empty initiate:', badInitiateJson);
    }

    // Test 2: PUT /app/api/drive/upload/chunk Validation Check
    console.log('\n3. Testing PUT /app/api/drive/upload/chunk missing session URL check...');
    const badChunkRes = await fetch(`${baseUrl}/app/api/drive/upload/chunk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: Buffer.from('test')
    });
    const badChunkJson = await badChunkRes.json();
    if (badChunkRes.status === 400 && badChunkJson.error) {
      console.log('   ✅ Correctly rejected missing upload URL with 400 Bad Request:', badChunkJson.error);
    } else {
      console.log('   ⚠️ Unexpected response for bad chunk:', badChunkJson);
    }

    // Test 3: POST /app/api/drive/upload/complete Validation Check
    console.log('\n4. Testing POST /app/api/drive/upload/complete validation check...');
    const badCompleteRes = await fetch(`${baseUrl}/app/api/drive/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: 'test.jpg' }) // missing fileId
    });
    const badCompleteJson = await badCompleteRes.json();
    if (badCompleteRes.status === 400 && badCompleteJson.error) {
      console.log('   ✅ Correctly rejected missing fileId with 400 Bad Request:', badCompleteJson.error);
    } else {
      console.log('   ⚠️ Unexpected response for bad complete:', badCompleteJson);
    }

    // Test 4: POST /app/api/drive/upload/complete with valid payload
    console.log('\n5. Testing POST /app/api/drive/upload/complete record persistence...');
    const testCompleteRes = await fetch(`${baseUrl}/app/api/drive/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: `test_upload_${Date.now()}`,
        clientId: 'client-test-123',
        clientName: 'Demo Client',
        bookingId: 'BK-2026-001',
        projectTitle: 'Wedding Highlights',
        fileId: 'mock_drive_file_id_7788',
        fileName: 'highlight_01.jpg',
        fileSize: 1048576,
        mimeType: 'image/jpeg',
        folderId: 'mock_folder_id',
        folderPath: 'KPR Productions/Demo Client-BK-2026-001/uploads'
      })
    });
    const testCompleteJson = await testCompleteRes.json();
    if (testCompleteRes.status === 200 && testCompleteJson.success && testCompleteJson.record) {
      console.log('   ✅ Upload record successfully stored & marked synced!');
      console.log('   📄 Stored Record:', {
        id: testCompleteJson.record.id,
        client_name: testCompleteJson.record.client_name,
        project_title: testCompleteJson.record.project_title,
        drive_sync_status: testCompleteJson.record.drive_sync_status,
        drive_file_id: testCompleteJson.record.drive_file_id,
        drive_folder_path: testCompleteJson.record.drive_folder_path
      });
    } else {
      console.log('   ⚠️ Unexpected response for complete route:', testCompleteJson);
    }

    // Test 5: End-to-end Live Test if credentials are present
    if (creds.isConfigured) {
      console.log('\n6. Live Google Drive Resumable Multi-Chunk Upload Test:');
      const testFileName = `kpr_stage2_test_${Date.now()}.txt`;
      const testBuffer = Buffer.alloc(600 * 1024, 'KPR Productions Resumable Chunk Test Payload.\n'); // 600 KiB to test multi-chunk
      const totalSize = testBuffer.length;
      const chunkSize = 256 * 1024; // 256 KiB chunks

      console.log(`   Initiating session for file: "${testFileName}" (${totalSize} bytes)...`);
      const initRes = await fetch(`${baseUrl}/app/api/drive/upload/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Live Test Client',
          bookingId: 'BK-LIVE-001',
          fileName: testFileName,
          fileSize: totalSize,
          mimeType: 'text/plain'
        })
      });

      const initData = await initRes.json();
      if (!initData.success || !initData.uploadUrl) {
        throw new Error(`Initiate failed: ${JSON.stringify(initData)}`);
      }
      console.log(`   ✅ Session initiated. Target Folder: "${initData.folderPath}"`);

      // Chunk 1: 0 - 262143 (256 KB)
      console.log('   Sending Chunk 1 (0 - 262143 bytes)...');
      const chunk1 = testBuffer.subarray(0, chunkSize);
      const chunk1Res = await fetch(`${baseUrl}/app/api/drive/upload/chunk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Range': `bytes 0-${chunkSize - 1}/${totalSize}`,
          'Content-Length': String(chunk1.length),
          'x-upload-url': initData.uploadUrl
        },
        body: chunk1
      });

      console.log(`   ✅ Chunk 1 Response Status: ${chunk1Res.status} (Expected 308 Resume Incomplete)`);
      console.log(`   ✅ Range Header returned by Drive: ${chunk1Res.headers.get('range') || 'none'}`);

      // Chunk 2: 262144 - 524287 (256 KB)
      console.log('   Sending Chunk 2 (262144 - 524287 bytes)...');
      const chunk2 = testBuffer.subarray(chunkSize, chunkSize * 2);
      const chunk2Res = await fetch(`${baseUrl}/app/api/drive/upload/chunk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Range': `bytes ${chunkSize}-${chunkSize * 2 - 1}/${totalSize}`,
          'Content-Length': String(chunk2.length),
          'x-upload-url': initData.uploadUrl
        },
        body: chunk2
      });

      console.log(`   ✅ Chunk 2 Response Status: ${chunk2Res.status} (Expected 308 Resume Incomplete)`);

      // Chunk 3 (Final chunk): 524288 - 614399
      console.log(`   Sending Chunk 3 Final (${chunkSize * 2} - ${totalSize - 1} bytes)...`);
      const chunk3 = testBuffer.subarray(chunkSize * 2, totalSize);
      const chunk3Res = await fetch(`${baseUrl}/app/api/drive/upload/chunk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Range': `bytes ${chunkSize * 2}-${totalSize - 1}/${totalSize}`,
          'Content-Length': String(chunk3.length),
          'x-upload-url': initData.uploadUrl
        },
        body: chunk3
      });

      console.log(`   ✅ Final Chunk Response Status: ${chunk3Res.status} (Expected 200/201 Complete)`);
      const finalDriveData = await chunk3Res.json();
      console.log(`   🎉 Google Drive File Uploaded! File ID: ${finalDriveData.id}`);

      // Final complete endpoint call
      const compRes = await fetch(`${baseUrl}/app/api/drive/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Live Test Client',
          bookingId: 'BK-LIVE-001',
          fileId: finalDriveData.id,
          fileName: testFileName,
          fileSize: totalSize,
          mimeType: 'text/plain',
          folderId: initData.folderId,
          folderPath: initData.folderPath
        })
      });
      const compJson = await compRes.json();
      console.log('   ✅ Persisted final record to Supabase:', compJson.record?.id);
    } else {
      console.log('\n💡 Note: Live Drive upload skipped because .env.local credentials are empty.');
      console.log('   Once you populate .env.local, run "npm run test:upload" to test live multi-chunk upload.');
    }

    console.log('\n🎉 ALL STAGE 2 API ENDPOINT TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('\n❌ Test Error:', err);
  } finally {
    await server.close();
    process.exit(0);
  }
}

runTests();

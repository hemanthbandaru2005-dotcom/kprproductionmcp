import { getDriveCredentials, getDriveClient, resolveKprUploadFolder, initiateResumableUploadSession } from '../lib/googleDrive.js';
import { isFileTypeSupported, getMimeType } from '../src/utils/googleDriveSyncService.js';
import { getFileCategory } from '../src/utils/clientUploadsService.js';

// Minimal valid ZIP binary (containing a file "wedding_raw_photos_manifest.txt")
function createSampleZipBuffer() {
  const zipHeader = Buffer.from([
    0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21, 0x00,
    0x7b, 0x5a, 0x22, 0x4f, 0x1c, 0x00, 0x00, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x08, 0x00,
    0x00, 0x00, 0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74, 0x4b, 0x50, 0x52, 0x20,
    0x50, 0x72, 0x6f, 0x64, 0x75, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x20, 0x5a, 0x49,
    0x50, 0x20, 0x55, 0x70, 0x6c, 0x6f, 0x61, 0x64, 0x20, 0x54, 0x65, 0x73, 0x74, 0x50,
    0x4b, 0x01, 0x02, 0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21,
    0x00, 0x7b, 0x5a, 0x22, 0x4f, 0x1c, 0x00, 0x00, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74, 0x50, 0x4b, 0x05,
    0x06, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x36, 0x00, 0x00, 0x00, 0x44,
    0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  return zipHeader;
}

async function runZipUploadTest() {
  console.log('\n======================================================');
  console.log('  KPR Productions - ZIP File Upload & Google Drive Test');
  console.log('======================================================\n');

  const zipFileName = `kpr_wedding_raw_photos_${Date.now()}.zip`;
  const zipBuffer = createSampleZipBuffer();
  const zipSize = zipBuffer.length;

  console.log('1. Validating ZIP file support in client utilities:');
  const isSupported = isFileTypeSupported(zipFileName, 'application/zip');
  const isCompressedSupported = isFileTypeSupported(zipFileName, 'application/x-zip-compressed');
  const isOctetSupported = isFileTypeSupported(zipFileName, 'application/octet-stream');
  const mimeType = getMimeType(zipFileName, 'application/zip');
  const category = getFileCategory(zipFileName);

  console.log(`   - isFileTypeSupported("${zipFileName}", "application/zip"):`, isSupported ? '✅ TRUE' : '❌ FALSE');
  console.log(`   - isFileTypeSupported("${zipFileName}", "application/x-zip-compressed"):`, isCompressedSupported ? '✅ TRUE' : '❌ FALSE');
  console.log(`   - isFileTypeSupported("${zipFileName}", "application/octet-stream"):`, isOctetSupported ? '✅ TRUE' : '❌ FALSE');
  console.log(`   - getMimeType("${zipFileName}"):`, mimeType === 'application/zip' ? `✅ ${mimeType}` : `❌ ${mimeType}`);
  console.log(`   - getFileCategory("${zipFileName}"):`, category === 'zip' ? `✅ ${category}` : `❌ ${category}`);

  if (!isSupported || !isCompressedSupported || !isOctetSupported || category !== 'zip') {
    console.error('\n❌ ZIP validation utility check failed!');
    process.exit(1);
  }

  console.log('\n2. Resolving target KPR Google Drive folder hierarchy:');
  const folderInfo = await resolveKprUploadFolder({
    clientName: 'Rahul & Sneha',
    bookingId: 'BK-ZIP-2026'
  });
  console.log(`   ✅ Target Folder: "${folderInfo.folderPath}"`);
  console.log(`   ✅ Folder ID: ${folderInfo.folderId}`);

  console.log(`\n3. Initiating Resumable Google Drive Session for ZIP (${zipSize} bytes)...`);
  const session = await initiateResumableUploadSession({
    fileName: zipFileName,
    fileSize: zipSize,
    mimeType: 'application/zip',
    folderId: folderInfo.folderId
  });
  console.log('   ✅ Resumable Session Created.');

  console.log('\n4. Uploading intact ZIP file chunk to Google Drive...');
  const chunkRes = await fetch(session.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/zip',
      'Content-Range': `bytes 0-${zipSize - 1}/${zipSize}`,
      'Content-Length': String(zipSize)
    },
    body: zipBuffer
  });

  console.log(`   ✅ Chunk Response Status: ${chunkRes.status} (Expected 200/201 Complete)`);

  if (chunkRes.status !== 200 && chunkRes.status !== 201) {
    const errText = await chunkRes.text();
    console.error(`❌ ZIP Chunk upload failed: ${errText}`);
    process.exit(1);
  }

  const driveFile = await chunkRes.json();
  console.log('   🎉 ZIP File Uploaded Successfully to Google Drive!');
  console.log(`   - File ID: ${driveFile.id}`);
  console.log(`   - Name: ${driveFile.name}`);
  console.log(`   - MIME Type: ${driveFile.mimeType}`);

  console.log('\n5. Verifying uploaded ZIP on Google Drive API:');
  const drive = getDriveClient();
  const meta = await drive.files.get({
    fileId: driveFile.id,
    fields: 'id, name, mimeType, size, webViewLink',
    supportsAllDrives: true
  });

  console.log('   ✅ Confirmed file exists on Google Drive:');
  console.log(`      Name: ${meta.data.name}`);
  console.log(`      MIME: ${meta.data.mimeType}`);
  console.log(`      Size: ${meta.data.size} bytes`);
  console.log(`      Drive Link: ${meta.data.webViewLink}`);

  console.log('\n🎉 ALL ZIP FILE UPLOAD TESTS PASSED SUCCESSFULLY! 🚀\n');
}

runZipUploadTest().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});

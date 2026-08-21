import { getDriveCredentials, listFilesInFolder, getDriveClient } from '../lib/googleDrive.js';

async function testConnection() {
  console.log('\n======================================================');
  console.log('  KPR Productions - Google Drive OAuth 2.0 Client Test');
  console.log('======================================================\n');

  const credentials = getDriveCredentials();
  console.log('1. Checking OAuth 2.0 Environment Variables:');
  console.log('   - GOOGLE_OAUTH_CLIENT_ID:', credentials.clientId ? `✅ (${credentials.clientId.substring(0, 20)}...)` : '❌ Missing');
  console.log('   - GOOGLE_OAUTH_CLIENT_SECRET:', credentials.clientSecret ? '✅ Present' : '❌ Missing');
  console.log('   - GOOGLE_OAUTH_REFRESH_TOKEN:', credentials.refreshToken ? '✅ Present' : '❌ Missing');
  console.log('   - GOOGLE_DRIVE_PARENT_FOLDER_ID:', credentials.parentFolderId ? `✅ (${credentials.parentFolderId})` : '❌ Missing');

  if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken || !credentials.parentFolderId) {
    console.log('\n⚠️  Setup Required:');
    console.log('   Please open .env.local and populate the 4 OAuth 2.0 variables:');
    console.log('   - GOOGLE_OAUTH_CLIENT_ID');
    console.log('   - GOOGLE_OAUTH_CLIENT_SECRET');
    console.log('   - GOOGLE_OAUTH_REFRESH_TOKEN');
    console.log('   - GOOGLE_DRIVE_PARENT_FOLDER_ID');
    console.log('\n   See README.md for the step-by-step guide to get your Client ID, Secret, and Refresh Token.');
    process.exit(0);
  }

  console.log('\n2. Attempting authentication & auto-refreshing access token...');
  try {
    const drive = getDriveClient();
    console.log('   ✅ OAuth 2.0 Client initialized & access token refreshed successfully.');

    console.log(`\n3. Querying Parent Folder [${credentials.parentFolderId}] in your Google Drive...`);
    const folderRes = await drive.files.get({
      fileId: credentials.parentFolderId,
      fields: 'id, name, mimeType, webViewLink',
      supportsAllDrives: true
    });
    console.log(`   ✅ Folder Found: "${folderRes.data.name}" (${folderRes.data.webViewLink})`);

    console.log('\n4. Listing contents in parent folder...');
    const listRes = await listFilesInFolder(credentials.parentFolderId, { pageSize: 10 });
    const files = listRes.files || [];
    console.log(`   ✅ Found ${files.length} items in parent folder:`);

    if (files.length === 0) {
      console.log('      (Folder is currently empty)');
    } else {
      files.forEach((f, idx) => {
        console.log(`      [${idx + 1}] ${f.name} (Type: ${f.mimeType}, ID: ${f.id})`);
      });
    }

    console.log('\n🎉 Google Drive OAuth 2.0 Integration Test PASSED successfully!\n');
  } catch (err) {
    console.error('\n❌ Google Drive OAuth 2.0 API Error:', err.message);
    if (err.errors) {
      console.error('   Details:', JSON.stringify(err.errors, null, 2));
    }
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   - Ensure Google Drive API is enabled in your Google Cloud Console project.');
    console.log('   - Ensure the OAuth consent screen has your Gmail added as a Test User.');
    console.log('   - Ensure GOOGLE_OAUTH_REFRESH_TOKEN was generated using the "https://www.googleapis.com/auth/drive" scope.');
  }
}

testConnection();

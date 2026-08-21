import http from 'http';
import url from 'url';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

console.log('\n======================================================');
console.log('  KPR Productions — Google OAuth 2.0 Token Generator  ');
console.log('======================================================\n');

if (!clientId || !clientSecret) {
  console.log('⚠️  Please add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to .env.local first.\n');
  console.log('Steps to get them:');
  console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/apis/credentials)');
  console.log('2. Click Create Credentials -> OAuth client ID');
  console.log('3. Application type: Web application');
  console.log('4. Authorized redirect URIs:');
  console.log('   - http://localhost:5199/oauth2callback');
  console.log('   - https://developers.google.com/oauthplayground');
  console.log('5. Copy Client ID and Secret into .env.local and run this script again.\n');
  process.exit(0);
}

const REDIRECT_URI = 'http://localhost:5199/oauth2callback';
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // Forces generation of a Refresh Token
  scope: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ]
});

console.log('👉 Open the following URL in your browser to authorize access to your Google Drive:\n');
console.log(authUrl);
console.log('\nWaiting for authorization on http://localhost:5199/oauth2callback ...\n');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/oauth2callback') {
      const code = reqUrl.query.code;
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization failed: No code received</h1>');
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background: #f9f9f9;">
          <h2 style="color: #2e7d32;">✅ Google Drive Authorization Successful!</h2>
          <p>Copy your <strong>Refresh Token</strong> below and paste it into your <code>.env.local</code> file:</p>
          <pre style="background: #222; color: #a5d6a7; padding: 12px; border-radius: 8px; word-break: break-all;">GOOGLE_OAUTH_REFRESH_TOKEN="${refreshToken}"</pre>
          <p>You can now close this tab and return to the terminal.</p>
        </div>
      `);

      console.log('\n🎉 SUCCESS! Your Refresh Token is:\n');
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${refreshToken}"\n`);
      console.log('Paste this line into your .env.local file!\n');

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 2000);
    }
  } catch (err) {
    console.error('Error exchanging authorization code for token:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Error: ${err.message}`);
  }
});

server.listen(5199);

# KPR Productions — Client Portal & Google Drive Integration

A high-performance photography and cinematography client portal built with React, Vite, Tailwind CSS, Supabase, and Google Drive API v3 (OAuth 2.0 for Personal Gmail & Google Workspace).

---

## 🚀 Google Drive OAuth 2.0 Setup Guide (Personal Gmail)

To connect your personal Gmail account to the KPR Productions client portal so all uploads use your personal Google Drive storage (15 GB / 100 GB / 2 TB Google One), follow these steps:

### Step 1: Enable Google Drive API
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create your project (e.g. `kpr-productions-portal`).
3. Navigate to **APIs & Services** > **Library**.
4. Search for **Google Drive API** and click **Enable**.

---

### Step 2: Configure the OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen** ([Direct Link](https://console.cloud.google.com/apis/credentials/consent)).
2. Select User Type: **External** and click **Create**.
3. Fill in the App Information:
   - **App name**: `KPR Productions Studio`
   - **User support email**: *Select your Gmail*
   - **Developer contact information**: *Enter your Gmail*
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Add or Remove Scopes**:
   - Filter/select `.../auth/drive` and `.../auth/drive.file`
   - Click **Update** and then **Save and Continue**.
6. On the **Test users** page (**IMPORTANT**):
   - Click **+ Add Users**
   - Type your personal Gmail address (the one you will authorize with)
   - Click **Add** and then **Save and Continue**.
7. Click **Back to Dashboard**.

---

### Step 3: Create OAuth 2.0 Client ID & Secret
1. Go to **APIs & Services** > **Credentials** ([Direct Link](https://console.cloud.google.com/apis/credentials)).
2. Click **+ Create Credentials** ➔ **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Set **Name**: `KPR Portal Drive Uploader`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and add BOTH:
   - `http://localhost:5199/oauth2callback`
   - `https://developers.google.com/oauthplayground`
6. Click **Create**.
7. A dialog will pop up with your **Client ID** and **Client Secret**. Copy them into your `.env.local`:
   ```env
   GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
   ```

---

### Step 4: Obtain Your Refresh Token

You can generate your Refresh Token using either **Method A** (Local helper script) or **Method B** (Google OAuth Playground):

#### Method A: Using Local Helper Script (Easiest)
1. In your project terminal, run:
   ```bash
   npm run get:token
   ```
2. It will print an authorization URL. Click/open it in your browser.
3. Sign in with your Gmail account (if you see a "Google hasn't verified this app" warning, click **Advanced** ➔ **Go to KPR Productions (unsafe)** ➔ **Continue**).
4. You will see a success page with your `GOOGLE_OAUTH_REFRESH_TOKEN`. Copy and paste it into `.env.local`.

#### Method B: Using Google's OAuth 2.0 Playground
1. Open [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2. In the top-right corner, click the **Gear Icon ⚙️ (OAuth 2.0 configuration)**:
   - Check **Use your own OAuth credentials**.
   - Paste your `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
3. In the left panel (Step 1 - Select & authorize APIs):
   - Scroll down to **Drive API v3** and check:
     - `https://www.googleapis.com/auth/drive`
     - `https://www.googleapis.com/auth/drive.file`
   - Click the blue **Authorize APIs** button.
4. Sign in with your personal Gmail and grant permission.
5. In Step 2 (Exchange authorization code for tokens):
   - Click the blue **Exchange authorization code for tokens** button.
   - Copy the value from the **Refresh token** field and paste it into `.env.local` as `GOOGLE_OAUTH_REFRESH_TOKEN`.

---

### Step 5: Get Your Parent Folder ID
1. Open [Google Drive](https://drive.google.com/) using your personal Gmail account.
2. Create or open the folder where you want client uploads to be stored (e.g. `kprproduction`).
3. Copy the Folder ID from the URL in your browser:
   `https://drive.google.com/drive/folders/1M40TsVPli-gX4CxY-2pXXEkuagh2uCh0` ➔ Folder ID is `1M40TsVPli-gX4CxY-2pXXEkuagh2uCh0`.
4. Add it to `.env.local`:
   ```env
   GOOGLE_DRIVE_PARENT_FOLDER_ID="1M40TsVPli-gX4CxY-2pXXEkuagh2uCh0"
   ```

*(Because this is your own personal Google Drive account, you don't need to share this folder with anyone extra!)*

---

### Summary of `.env.local`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Drive OAuth 2.0 Configuration (Personal Gmail)
GOOGLE_OAUTH_CLIENT_ID="1234567890-abcdef.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="GOCSPX-abcdef123456789"
GOOGLE_OAUTH_REFRESH_TOKEN="1//04abcdefghijk..."
GOOGLE_DRIVE_PARENT_FOLDER_ID="1M40TsVPli-gX4CxY-2pXXEkuagh2uCh0"
```

---

## 🧪 Verification & Admin Test Route

Once your `.env.local` is saved:

```bash
# Test OAuth 2.0 authentication and folder access from CLI
npm run test:drive
```

Or open the admin test route in your browser:
👉 **[http://localhost:5176/app/api/drive/test](http://localhost:5176/app/api/drive/test)**

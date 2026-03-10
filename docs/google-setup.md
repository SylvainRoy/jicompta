# 🔧 Google Cloud Configuration - Complete Guide

## 📋 Configuration Steps (15 min)

### **Step 1: Create a Google Cloud Project** ☁️

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/

2. **Create a new project**
   - Click on the project selector (at the top)
   - Click "NEW PROJECT"
   - Name: `JiCompta` (or other)
   - Click "CREATE"
   - Wait for creation (30 seconds)
   - Select the created project

### **Step 2: Enable APIs** 🔌

1. **In the left menu**:
   - Go to "APIs & Services" > "Library"

2. **Enable these 3 APIs** (one by one):

   **a) Google Sheets API**
   - Search: "Google Sheets API"
   - Click on it
   - Click "ENABLE"
   - Wait for activation

   **b) Google Docs API**
   - Search: "Google Docs API"
   - Click on it
   - Click "ENABLE"

   **c) Google Drive API**
   - Search: "Google Drive API"
   - Click on it
   - Click "ENABLE"

### **Step 3: Configure OAuth Consent Screen** 🔐

1. **Go to "APIs & Services" > "OAuth consent screen"**

2. **Application information**
   - Application name: `JiCompta`
   - User support email: (your email)
   - User type: **"External"**
   - Developer email: (your email)

4. **Scopes**
   - In the "Data access" menu
   - Search and check these 3 scopes:
     - ✅ `.../auth/spreadsheets` - See, edit, create and delete your Google Sheets files
     - ✅ `.../auth/documents` - See, edit, create and delete your Google Docs documents
     - ✅ `.../auth/drive.file` - View and manage Google Drive files created by this app
     - ✅ `.../auth/drive` - View and manage Google Drive files

5. **Test users**
   - In the "Audience" menu
   - Add "Test users"
   - Add your email (the one you'll use to sign in)

### **Step 4: Create OAuth Credentials** 🔑

1. **Go to "APIs & Services" > "Credentials"**

2. **Create credentials**
   - Click "+ CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **OAuth client ID configuration**
   - Application type: **"Web application"**
   - Name: `JiCompta Web Client`

4. **Authorized redirect URIs** ⚠️ IMPORTANT

   Click "+ ADD URI" and add **ONLY**:
   ```
   http://localhost:5173
   https://jicompta.web.app
   https://jicompta.firebase.app
   ```

   ⚠️ **IMPORTANT**:
   - Google OAuth **DOES NOT ACCEPT** IP-based URIs (192.168.x.x)
   - Only `localhost` works for local development
   - To test on mobile with OAuth, see `MOBILE_TEST_NGROK.md`
   - To test responsive, use browser DevTools (Ctrl+Shift+M)

5. **Authorized JavaScript origins** (optional but recommended)

   Click "+ ADD URI" and add:
   ```
   http://localhost:5173
   https://jicompta.web.app
   https://jicompta.firebase.app
   ```

6. **Create**
   - Click "CREATE"
   - A popup displays with your Client ID

7. **Copy the Client ID** 📋
   - Copy the ID (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)
   - **DO NOT** copy the "Client secret" (we don't need it)

### **Step 5: Configure the Application** ⚙️

1. **Create the .env file**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file**
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
   ```

### **Step 7: Restart the Server** 🔄

1. **Stop the server** (Ctrl+C in terminal)

2. **Restart**
   ```bash
   npm run dev
   ```

3. **Open the application**
   ```
   http://localhost:5173
   ```

4. **Test the connection**
   - Click "Sign in with Google"
   - Select your Google account
   - Accept the requested permissions
   - You should be redirected to the Dashboard!

---

## ✅ Verification Checklist

Before testing, verify that:

- [ ] Google Cloud project created
- [ ] 3 APIs enabled (Sheets, Docs, Drive)
- [ ] OAuth consent screen configured
- [ ] Your email added as test user
- [ ] OAuth Client ID created
- [ ] **Redirect URIs added** (`http://localhost:5173`)
- [ ] Google Sheet created with 4 tabs
- [ ] Correct headers in each tab
- [ ] .env file created and filled
- [ ] Client ID copied to .env
- [ ] Sheet ID copied to .env
- [ ] Server restarted

---

## 🐛 Common Problems

### Error 400 "redirect_uri_mismatch"
**Cause**: Redirect URI doesn't match
**Solution**:
1. Check in Google Cloud Console > Credentials
2. Ensure `http://localhost:5173` is in authorized URIs
3. No space, no trailing slash
4. Restart server after modification

### Error "access_denied"
**Cause**: Your account is not in test users
**Solution**:
1. Google Cloud Console > APIs & Services > OAuth consent screen
2. "Test users" section
3. Add your email
4. Try again

### Error "invalid_client"
**Cause**: Incorrect Client ID in .env
**Solution**:
1. Check Client ID in Google Cloud Console > Credentials
2. Copy it again to .env
3. Restart server

### Blank page after login
**Cause**: Redirection problem
**Solution**:
1. Open browser console (F12)
2. Check for errors
3. Verify VITE_GOOGLE_REDIRECT_URI in .env matches current URL

---

## 📱 For Mobile Testing

⚠️ **Google OAuth DOES NOT work with IP-based URIs**

### Option 1: DevTools (Recommended for Dev) ⭐

**Easiest**: Test responsive on desktop with DevTools
1. Open `http://localhost:5173`
2. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
3. Select iPhone, iPad, etc.
4. **OAuth works** because you're on localhost
5. Test all features

✅ **Advantages**:
- Fast and efficient
- OAuth works
- Perfectly simulates mobile
- No additional configuration

### Option 2: ngrok for Real Mobile Testing

If you want to test on your **real phone** with OAuth:
- See the complete guide: **`MOBILE_TEST_NGROK.md`**
- Uses an HTTPS tunnel with a real domain
- OAuth works on mobile
- More complex but possible

---

## ⏱️ Estimated Total Time

- Steps 1-2: 5 min (project creation + APIs)
- Step 3: 3 min (consent screen)
- Step 4: 2 min (OAuth Client ID)
- Step 5: 3 min (Google Sheet)
- Steps 6-7: 2 min (app configuration)

**Total: ~15 minutes** ⏰

---

## 🎉 After Configuration

Once configured, you'll be able to:
- ✅ Sign in with your Google account
- ✅ Manage your clients
- ✅ See data synchronized in Google Sheets
- ✅ Add, edit, delete clients
- ✅ Everything is automatically saved!

**Good luck with the configuration!** 🚀

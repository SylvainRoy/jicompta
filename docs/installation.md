# JiCompta Installation

This guide explains how to install and configure JiCompta for multi-user deployment.

## 📋 Prerequisites

- Node.js 18+ and npm
- A Google Cloud project with OAuth 2.0 configured
- The following APIs enabled in Google Cloud Console:
  - Google Sheets API
  - Google Docs API
  - Google Drive API

## 🚀 Development Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd jicompta
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project
3. Enable the required APIs:
   - Google Sheets API
   - Google Docs API
   - Google Drive API
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials:
   - Type: Web Application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Redirect URI: `http://localhost:5173`
6. Copy the Client ID

### 4. Configure environment variables

Create a `.env` file at the project root:

```bash
cp .env.example .env
```

Edit `.env` and replace `VITE_GOOGLE_CLIENT_ID` with your Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**That's it!** No other manual configuration is needed.

### 5. Run the tests

Verify the installation is correct by running the test suite:

```bash
npm test
```

All tests should pass. You can also use:

```bash
npm run test:watch      # Watch mode — re-runs automatically on file changes
npm run test:ui         # Opens an interactive browser UI to explore tests
npm run test:coverage   # Generates a code coverage report (text + HTML in ./coverage/)
```

### 6. Launch the application

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`

## 👤 First User

### Usage Flow

1. **Login**: User clicks "Sign in with Google"
2. **Authorization**: Google requests permissions (Sheets, Docs, Drive)
3. **Automatic Detection**: The application automatically searches for a `Comptabilite/` folder in Drive
   - If found: Configuration is automatically loaded → Dashboard
   - If absent: Setup wizard appears
4. **Automatic Setup** (if needed): The wizard automatically creates:
   - A `Comptabilite/` folder in Google Drive
   - A `Compta` spreadsheet with 4 tabs (Clients, TypeDePrestation, Prestation, Paiement)
   - Templates in `Comptabilite/Modeles/`:
     - Modèle de Facture (customizable)
     - Modèle de Reçu (customizable)
   - Subfolders:
     - `Comptabilite/Factures/` (for generated invoices)
     - `Comptabilite/Recus/` (for generated receipts)
5. **Local Configuration**: IDs of created/found resources are stored in the browser's localStorage
6. **Ready**: User is redirected to the dashboard

**Total duration**: ~10-15 seconds

### Template Customization

After setup, users can customize their templates:

1. Go to "Settings"
2. Click "Open" next to "Invoice Template" or "Receipt Template"
3. Edit the template in Google Docs (formatting, logo, legal information, etc.)
4. Save - changes will be applied to future invoices/receipts

## 🌐 Production Deployment

### Option 1: Firebase Hosting (recommended)

Firebase Hosting is pre-configured and ready to use:

#### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created at [Firebase Console](https://console.firebase.google.com)

#### Deployment Steps

1. **Login to Firebase** (first time only):
   ```bash
   firebase login
   ```

2. **Link to your Firebase project** (already configured in `.firebaserc`):
   ```bash
   firebase use jicompta
   ```
   Or create a new project:
   ```bash
   firebase init hosting
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

5. **Update Google OAuth Configuration**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** > **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Add to **Authorized redirect URIs**:
     ```
     https://jicompta.web.app
     https://jicompta.firebaseapp.com
     ```
   - Add to **Authorized JavaScript origins**:
     ```
     https://jicompta.web.app
     https://jicompta.firebaseapp.com
     ```
   - Click **SAVE**

6. **Access your application**:
   - Primary URL: `https://jicompta.web.app`
   - Alternative: `https://jicompta.firebaseapp.com`
   - Firebase Console: `https://console.firebase.google.com/project/jicompta`

#### Configuration Files

The repository includes:
- `firebase.json` - Firebase Hosting configuration
- `.firebaserc` - Project aliases (ignored by git if needed)

#### Future Deployments

For subsequent deployments:
```bash
npm run build && firebase deploy --only hosting
```

### Option 2: Vercel

1. Create an account on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure environment variables:
   - `VITE_GOOGLE_CLIENT_ID`: Your Client ID
4. Update authorized origins in Google Cloud Console:
   - Add your Vercel domain (ex: `https://jicompta.vercel.app`)
5. Deploy!

### Option 3: Netlify

1. Create an account on [Netlify](https://netlify.com)
2. Connect your repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configure environment variable:
   - `VITE_GOOGLE_CLIENT_ID`: Your Client ID
6. Update Google Cloud Console with your Netlify domain

### Option 4: Custom Server

```bash
# Production build
npm run build

# Static files are in ./dist
# Serve them with nginx, Apache, or any other web server
```

**Important**: Update authorized origins in Google Cloud Console with your production domain.

## 🔧 Advanced Configuration

### Reset Configuration

If a user encounters problems:

1. Go to "Settings"
2. Click "Reset Configuration"
3. A new configuration will be created (old resources remain in Drive)

### Clear Local Configuration

To force the wizard at next login:

1. Go to "Settings"
2. Click "Clear Local Configuration"
3. The wizard will reappear at next login

### Browser or Device Change

If a user changes browser or device:

1. **Login**: User signs in with Google
2. **Automatic Detection**: Application automatically searches for `Comptabilite/` folder in their Drive
3. **Automatic Loading**: If found, configuration is loaded and user immediately accesses the Dashboard
4. **Setup if Needed**: If folder doesn't exist, creation wizard appears

**Advantages:**
- ✅ No manual manipulation needed
- ✅ Instant access to data on any device
- ✅ No need to manually reconfigure
- ✅ Works even after clearing browser cache

## 🔒 Security and Privacy

### User Data

- **Storage**: All data is stored in the user's personal Google Drive
- **Configuration**: Resource IDs are stored locally (localStorage)
- **No Backend**: Application stores no data on a third-party server
- **Permissions**: Application only requests necessary permissions (Sheets, Docs, Drive)

### Multi-user

- Each user has their own Google Drive resources
- No data is shared between users
- Each user must sign in with their own Google account

## 📚 Additional Documentation

- [Firebase Deployment Guide](./FIREBASE_DEPLOYMENT.md) - Complete Firebase Hosting guide
- [Google Setup Guide](./GOOGLE_SETUP.md) - Detailed Google Cloud configuration
- [Templates Setup](./TEMPLATES_SETUP.md) - Available variables in templates
- [Mobile Testing](./MOBILE_TEST_NGROK.md) - Test on mobile with ngrok
- [Progress](./PROGRESS.md) - Project progress status

## 🆘 Troubleshooting

### "Configuration not found"

- Verify you are properly logged in
- Go to Settings and click "Reset Configuration"

### "Drive API error: 404"

- Verify APIs are enabled in Google Cloud Console
- Verify OAuth permissions include `drive` (not just `drive.file`)

### Wizard doesn't launch

- Clear browser's localStorage
- Sign in again

### Templates don't work

- Check in Settings that template IDs are properly configured
- Open templates via Settings and verify they contain `{{VARIABLE}}` placeholders
- If needed, reset the configuration

## 📞 Support

For any questions or issues, open an issue on GitHub.

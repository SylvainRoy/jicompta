# 🔥 Firebase Hosting Deployment Guide

Complete guide for deploying JiCompta to Firebase Hosting.

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase account (free tier works perfectly)
- Firebase CLI installed globally
- JiCompta application built and tested locally

## 🚀 Initial Setup (One-time)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will:
- Open your browser
- Ask you to authenticate with your Google account
- Store credentials locally

### Step 3: Create Firebase Project

**Option A: Via Firebase Console** (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `jicompta` (or your preferred name)
4. Disable Google Analytics (optional for this app)
5. Click "Create project"

**Option B: Via CLI**
```bash
firebase projects:create jicompta
```

### Step 4: Initialize Firebase in Your Project

The JiCompta repository already includes Firebase configuration files:
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project settings

If you need to reconfigure:
```bash
firebase init hosting
```

Select:
- Use existing project: `jicompta`
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (optional)
- Don't overwrite `dist/index.html` if it exists

## 📦 Build Configuration

The `firebase.json` is already configured with optimal settings:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

**Features:**
- ✅ Serves SPA from `dist/` directory
- ✅ All routes redirect to index.html (client-side routing)
- ✅ Optimized caching for static assets (1 year)
- ✅ Efficient file upload (ignores unnecessary files)

## 🏗️ Deployment Process

### Quick Deploy

```bash
npm run build && firebase deploy --only hosting
```

### Step-by-Step Deploy

1. **Build the application**:
   ```bash
   npm run build
   ```

   This creates optimized files in `dist/`:
   - `index.html` - Main HTML file
   - `assets/*.js` - Bundled JavaScript
   - `assets/*.css` - Bundled CSS

2. **Preview locally** (optional):
   ```bash
   firebase serve
   ```
   Access at: `http://localhost:5000`

3. **Deploy to Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

4. **Deployment output**:
   ```
   === Deploying to 'jicompta'...

   i  deploying hosting
   i  hosting[jicompta]: beginning deploy...
   i  hosting[jicompta]: found 3 files in dist
   ✔  hosting[jicompta]: file upload complete
   i  hosting[jicompta]: finalizing version...
   ✔  hosting[jicompta]: version finalized
   i  hosting[jicompta]: releasing new version...
   ✔  hosting[jicompta]: release complete

   ✔  Deploy complete!

   Project Console: https://console.firebase.google.com/project/jicompta/overview
   Hosting URL: https://jicompta.web.app
   ```

## 🔐 Post-Deployment Configuration

### Update Google OAuth Settings

After your first deployment, you **must** update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add Firebase URLs to **Authorized JavaScript origins**:
   ```
   https://jicompta.web.app
   https://jicompta.firebaseapp.com
   ```
6. Add Firebase URLs to **Authorized redirect URIs**:
   ```
   https://jicompta.web.app
   https://jicompta.firebaseapp.com
   ```
7. Click **SAVE**

### Test Your Deployment

1. Visit your app: `https://jicompta.web.app`
2. Test the complete flow:
   - ✅ Click "Sign in with Google"
   - ✅ Authorize permissions
   - ✅ Automatic setup wizard runs
   - ✅ Dashboard loads correctly
   - ✅ Client management works
   - ✅ Google Sheets integration functions

## 🛠️ Advanced Configuration

### Custom Domain

To use your own domain (e.g., `app.mycompany.com`):

1. **Add domain in Firebase Console**:
   - Go to Hosting > Add custom domain
   - Follow the verification steps
   - Add DNS records to your domain provider

2. **Update Google OAuth**:
   - Add your custom domain to Google Cloud Console
   - Update both authorized origins and redirect URIs

### Environment-Specific Deployments

Deploy to different Firebase projects:

```bash
# Production
firebase use production
npm run build
firebase deploy --only hosting

# Staging
firebase use staging
npm run build
firebase deploy --only hosting
```

Configure in `.firebaserc`:
```json
{
  "projects": {
    "default": "jicompta",
    "production": "jicompta-prod",
    "staging": "jicompta-staging"
  }
}
```

### Rollback Deployment

If something goes wrong:

```bash
# List previous deployments
firebase hosting:channel:list

# View deployment history in Firebase Console
# Hosting > Dashboard > Release history

# Or redeploy a previous version manually
```

### Preview Channels

Test deployments before going live:

```bash
# Create a preview channel
firebase hosting:channel:deploy preview-feature-x

# Share preview URL with team
# https://jicompta--preview-feature-x-hash.web.app
```

## 📊 Monitoring & Analytics

### Firebase Console

Monitor your deployment at:
`https://console.firebase.google.com/project/jicompta/overview`

Available metrics:
- Request count
- Bandwidth usage
- Response times
- Error rates

### Performance Monitoring (Optional)

Add Firebase Performance Monitoring:

```bash
npm install firebase
```

Then add to your app initialization.

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: jicompta
```

Generate service account:
```bash
firebase login:ci
```

Add the token to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT`.

## 🐛 Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Deploy fails
```bash
# Ensure you're logged in
firebase login --reauth

# Check project
firebase projects:list

# Use correct project
firebase use jicompta
```

### OAuth errors after deployment
- Verify URLs are added to Google Cloud Console
- Check for typos in redirect URIs
- Wait 5 minutes for changes to propagate

### 404 errors on refresh
- Ensure `rewrites` are configured in `firebase.json`
- All routes should redirect to `index.html`

### Slow loading
- Check that caching headers are set correctly
- Verify gzip compression is enabled
- Consider code splitting in Vite config

## 💰 Costs

Firebase Hosting **free tier** includes:
- 10 GB storage
- 360 MB/day bandwidth
- SSL certificates included
- Custom domains included

For JiCompta's typical usage, the free tier is more than sufficient.

## 📞 Support

- **Firebase Docs**: https://firebase.google.com/docs/hosting
- **Firebase Status**: https://status.firebase.google.com/
- **Community**: https://firebase.google.com/community

## ✅ Deployment Checklist

Before deployment:
- [ ] Application builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Environment variables are correct
- [ ] Firebase project is created
- [ ] Firebase CLI is installed and authenticated

After deployment:
- [ ] Google OAuth URLs updated
- [ ] Application loads at Firebase URL
- [ ] Login flow works
- [ ] Setup wizard functions correctly
- [ ] Google Sheets integration works
- [ ] All features tested in production

---

**Your JiCompta app is now deployed and ready for users! 🎉**

# Firebase Hosting Deployment Guide

Complete guide for deploying JiCompta to Firebase Hosting, including the test/production environment setup.

## Prerequisites

- Node.js 18+ installed
- Firebase account (free tier works perfectly)
- Firebase CLI installed globally
- JiCompta application built and tested locally

## Initial Setup (One-time)

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
- `firebase.json` - Hosting configuration (multi-site)
- `.firebaserc` - Project and target settings (gitignored)

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

## Environments

JiCompta uses **Firebase multi-site hosting** with two environments:

| Environment | URL | Site ID | Purpose |
|---|---|---|---|
| **Production** | https://jicompta.web.app | `jicompta` | Live app for end users |
| **Test** | https://jicompta-test.web.app | `jicompta-test` | Validation before production release |

### How environments differ

| Aspect | Production | Test |
|---|---|---|
| App icon | Blue (`#3b82f6`) | Grey (`#6b7280`) |
| PWA name | "JiCompta" | "JiCompta (TEST)" |
| Theme color | Blue | Grey |
| Header banner | None | Amber "ENVIRONNEMENT DE TEST" |
| Login page | Blue gradient | Amber gradient + TEST badge |

### How it works

The environment is controlled by the `VITE_APP_ENV` build-time variable:

- **Not set or `production`**: standard blue production visuals
- **`test`**: grey icons, amber test banners, modified PWA manifest

At build time:
1. `vite.config.ts` injects `__APP_ENV__` into the JS bundle
2. A Vite plugin (`envHtmlPlugin`) transforms `index.html` to swap icons, manifest, title, and theme colors for test builds
3. Components (`Header.tsx`, `Login.tsx`) conditionally render the test banner based on `__APP_ENV__`

### Setting up a new environment from scratch

If `.firebaserc` is missing (it is gitignored), recreate it:

```bash
# Create the test hosting site (one-time)
firebase hosting:sites:create jicompta-test

# Set up deploy targets
firebase target:apply hosting production jicompta
firebase target:apply hosting test jicompta-test
```

This produces the `.firebaserc` file:
```json
{
  "projects": {
    "default": "jicompta"
  },
  "targets": {
    "jicompta": {
      "hosting": {
        "production": ["jicompta"],
        "test": ["jicompta-test"]
      }
    }
  }
}
```

## Deployment

### Deploy to test (recommended first step)

```bash
npm run deploy:test
```

This runs: `VITE_APP_ENV=test tsc -b && VITE_APP_ENV=test vite build && firebase deploy --only hosting:test`

Visit https://jicompta-test.web.app to validate.

### Deploy to production

```bash
npm run deploy:prod
```

This runs: `tsc -b && vite build && firebase deploy --only hosting:production`

Visit https://jicompta.web.app to confirm.

### Typical deployment workflow

1. Make changes and test locally (`npm run dev`)
2. Run tests (`npm test`)
3. Deploy to test: `npm run deploy:test`
4. Have users validate on https://jicompta-test.web.app
5. Once validated, deploy to production: `npm run deploy:prod`

## Post-Deployment Configuration

### Update Google OAuth Settings

Both environment URLs **must** be registered in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add all URLs to **Authorized JavaScript origins**:
   ```
   https://jicompta.web.app
   https://jicompta.firebaseapp.com
   https://jicompta-test.web.app
   https://jicompta-test.firebaseapp.com
   ```
6. Add all URLs to **Authorized redirect URIs**:
   ```
   https://jicompta.web.app
   https://jicompta.firebaseapp.com
   https://jicompta-test.web.app
   https://jicompta-test.firebaseapp.com
   ```
7. Click **SAVE**

### Test Your Deployment

1. Visit your app URL
2. Test the complete flow:
   - Click "Sign in with Google"
   - Authorize permissions
   - Automatic setup wizard runs
   - Dashboard loads correctly
   - Client management works
   - Google Sheets integration functions

## Build Configuration

### `firebase.json` (multi-site)

The `firebase.json` defines two hosting targets (`production` and `test`) with identical configuration. Both serve from `dist/` with SPA rewrites and aggressive caching for static assets.

### Vite environment plugin

In `vite.config.ts`, the `envHtmlPlugin` transforms `index.html` at build time when `VITE_APP_ENV=test`:

- `/icon.svg` → `/icon-test.svg`
- `/manifest.json` → `/manifest-test.json`
- `/apple-touch-icon.png` → `/apple-touch-icon-test.png`
- Title → "JiCompta (TEST)"
- Theme colors → grey tones

### Test-specific assets

The `public/` directory contains test variants of all PWA assets:

- `icon-test.svg` — grey version of the app icon
- `icon-test-192.png`, `icon-test-512.png` — grey PNG icons
- `apple-touch-icon-test.png` — grey iOS icon
- `manifest-test.json` — PWA manifest with test name and grey icons

## Advanced Configuration

### Custom Domain

To use your own domain (e.g., `app.mycompany.com`):

1. **Add domain in Firebase Console**:
   - Go to Hosting > Add custom domain
   - Follow the verification steps
   - Add DNS records to your domain provider

2. **Update Google OAuth**:
   - Add your custom domain to Google Cloud Console
   - Update both authorized origins and redirect URIs

### Rollback Deployment

If something goes wrong:

```bash
# View deployment history in Firebase Console
# Hosting > Dashboard > Release history

# Or redeploy a previous version by checking out the commit and redeploying
git checkout <previous-commit>
npm run deploy:prod   # or deploy:test
git checkout main
```

### Preview Channels

Test deployments before going live:

```bash
# Create a preview channel
firebase hosting:channel:deploy preview-feature-x

# Share preview URL with team
# https://jicompta--preview-feature-x-hash.web.app
```

## Troubleshooting

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

### Deploy target not configured
If you see `Error: No hosting target(s) found`:
```bash
firebase target:apply hosting production jicompta
firebase target:apply hosting test jicompta-test
```

### OAuth errors after deployment
- Verify all URLs are added to Google Cloud Console (both prod and test)
- Check for typos in redirect URIs
- Wait 5 minutes for changes to propagate

### 404 errors on refresh
- Ensure `rewrites` are configured in `firebase.json`
- All routes should redirect to `index.html`

## Costs

Firebase Hosting **free tier** includes:
- 10 GB storage
- 360 MB/day bandwidth
- SSL certificates included
- Custom domains included

For JiCompta's typical usage (two hosting sites), the free tier is more than sufficient.

## Deployment Checklist

Before deployment:
- [ ] Application builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Environment variables are correct (`.env`)
- [ ] Firebase project is created
- [ ] Firebase CLI is installed and authenticated
- [ ] Firebase deploy targets are configured (`.firebaserc`)

After deployment:
- [ ] Google OAuth URLs updated for both environments
- [ ] Application loads at both Firebase URLs
- [ ] Test environment shows grey icon and amber banner
- [ ] Production environment shows blue icon and no banner
- [ ] Login flow works on both environments
- [ ] Google Sheets integration works

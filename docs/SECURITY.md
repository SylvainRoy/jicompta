# 🔐 Security Guide for JiCompta

This guide explains how to safely manage credentials and deploy JiCompta to GitHub.

## ✅ TL;DR: It's Safe to Push to GitHub!

JiCompta is designed with security in mind:
- ✅ **No secrets in code**: The repository contains no sensitive credentials
- ✅ **Client ID is public**: Google OAuth Client IDs are meant to be public
- ✅ **No backend**: No server-side secrets to manage
- ✅ **User data isolation**: Each user's data stays in their own Google Drive

## 🔑 Understanding Google OAuth Credentials

### What is the Client ID?

The `VITE_GOOGLE_CLIENT_ID` is **NOT a secret**. It's a public identifier that:

- ✅ **Is meant to be exposed** in browser JavaScript
- ✅ **Cannot be used maliciously** without the redirect URI whitelist
- ✅ **Is safe to commit** to public repositories (though we don't recommend it)
- ✅ **Is visible** in your deployed app's network requests

**Why it's safe:**
Google OAuth security relies on:
1. **Redirect URI whitelist**: Only your authorized domains can receive OAuth responses
2. **User consent**: Users must explicitly authorize your app
3. **Token expiration**: Access tokens expire after a short time
4. **Scope restrictions**: Tokens only have access to requested scopes

### What is NOT in the repository?

- ❌ **Client Secret**: This is never used (not needed for browser apps)
- ❌ **Access Tokens**: Generated per-user, stored only in browser localStorage
- ❌ **Refresh Tokens**: Generated per-user, stored only in browser
- ❌ **User Data**: All data stays in each user's Google Drive

## 📁 Files and Security Status

### Safe to Commit (Already in repository)

```
✅ firebase.json          # Public hosting configuration
✅ .firebaserc            # Public project identifier
✅ package.json           # Public dependencies
✅ src/                   # All source code (no secrets)
✅ docs/                  # Documentation
✅ .env.example           # Template without real values
```

### Ignored by Git (Never committed)

```
❌ .env                   # Your actual Client ID
❌ .env.local             # Local overrides
❌ .env.*.local           # Environment-specific overrides
❌ .firebase/             # Firebase cache
❌ .firebaserc            # Can be committed, but optional
❌ node_modules/          # Dependencies
❌ dist/                  # Build output
```

### Verify .gitignore

Your `.gitignore` already includes:
```
# Environment variables
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# Firebase
.firebase
.firebaserc
firebase-debug.log
```

## 🚀 Safe Deployment Workflow

### Option 1: Client ID in .env (Recommended for Development)

**For local development and personal use:**

1. Keep your `.env` file local (already ignored by git)
2. Share `.env.example` in repository
3. Each developer creates their own `.env` from the example
4. Use environment variables in hosting platform (Firebase, Vercel, Netlify)

**Pros:**
- ✅ Simple for development
- ✅ No secrets in repository
- ✅ Easy to manage multiple environments

**Cons:**
- ⚠️ Must configure environment variables on each platform

### Option 2: Client ID in Code (Acceptable for Public Apps)

**For open-source or public applications:**

Since the Client ID is public anyway, you can hardcode it:

```typescript
// src/constants/index.ts
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  'your-actual-client-id.apps.googleusercontent.com';
```

**Pros:**
- ✅ No configuration needed by contributors
- ✅ Easier deployment
- ✅ Still secure (OAuth redirect URI protection)

**Cons:**
- ⚠️ Client ID visible in code (but it's public anyway)
- ⚠️ Harder to use different IDs for dev/prod

### Option 3: Multiple OAuth Clients (Recommended for Production)

**For production applications with multiple environments:**

Create separate OAuth Client IDs:
- Development: `dev-client-id.apps.googleusercontent.com`
- Staging: `staging-client-id.apps.googleusercontent.com`
- Production: `prod-client-id.apps.googleusercontent.com`

Each with appropriate redirect URIs:
```
Development:
- http://localhost:5173

Staging:
- https://staging.jicompta.web.app

Production:
- https://jicompta.web.app
- https://app.yourdomain.com
```

## 🔒 Security Best Practices

### 1. Protect OAuth Configuration

✅ **Do:**
- Keep `.env` in `.gitignore`
- Use `.env.example` as a template
- Configure redirect URIs restrictively in Google Cloud Console
- Only authorize trusted domains

❌ **Don't:**
- Commit `.env` files
- Use `*` wildcards in redirect URIs
- Add unnecessary domains to OAuth whitelist
- Share access tokens between users

### 2. Secure Redirect URIs

In Google Cloud Console, **only** add URIs you control:

```
✅ Good:
- http://localhost:5173                    (development)
- https://jicompta.web.app                 (production)
- https://yourdomain.com                   (custom domain)

❌ Bad:
- http://localhost:*                        (too broad)
- https://*.ngrok.io                        (wildcard)
- http://192.168.1.100:5173                (not supported)
```

### 3. Review Scopes Regularly

JiCompta requests these scopes:
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];
```

✅ **Minimal necessary access**: Only request what you need
✅ **Documented**: Explain why each scope is needed
✅ **User consent**: Users explicitly authorize each scope

### 4. Token Management

The application already implements secure token handling:

```typescript
// Tokens stored in localStorage (browser-only)
localStorage.setItem('jicompta_auth_token', token);

// Tokens expire automatically
const expiresAt = Date.now() + 3600 * 1000; // 1 hour

// Clear tokens on logout
localStorage.removeItem('jicompta_auth_token');
```

✅ **Do:**
- Store tokens in localStorage (not cookies for this use case)
- Check token expiration
- Clear tokens on logout
- Handle expired tokens gracefully

❌ **Don't:**
- Store tokens in git
- Share tokens between users
- Store tokens server-side (no backend needed)

## 🌐 Deploying to GitHub

### Pre-Push Checklist

Before pushing to GitHub, verify:

```bash
# 1. Check what will be committed
git status

# 2. Verify .env is NOT staged
git status | grep .env
# Should show: .env (under "Untracked" or not shown)

# 3. Check no secrets in staged files
git diff --cached | grep -i "secret\|password\|key\|token"
# Should return nothing

# 4. Review .gitignore
cat .gitignore | grep env
# Should include .env files

# 5. Verify .env.example has no real values
cat .env.example
# Should have placeholder values only
```

### Safe Push Process

```bash
# 1. Ensure .env is ignored
git status --ignored | grep .env
# Should show: .env

# 2. Stage files (excluding .env automatically)
git add .

# 3. Review what will be committed
git status

# 4. Commit
git commit -m "Your commit message"

# 5. Push to GitHub
git push origin main
```

### If You Accidentally Commit Secrets

If you accidentally commit your `.env` or Client Secret:

**Option 1: Recent Commit (Not Pushed)**
```bash
# Remove .env from last commit
git reset HEAD~1
git add .
git commit -m "Your message"
```

**Option 2: Already Pushed (More Complex)**
```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (use carefully!)
git push origin --force --all
```

**Important**: If you exposed a real OAuth **Client Secret** (not Client ID):
1. Immediately revoke it in Google Cloud Console
2. Generate a new one
3. Update your hosting platform

## 🔐 Additional Security Measures

### 1. GitHub Repository Settings

For public repositories:
- ✅ Enable branch protection on `main`
- ✅ Require pull request reviews
- ✅ Enable security advisories
- ✅ Enable Dependabot alerts

For private repositories:
- ✅ Limit access to trusted collaborators
- ✅ Use GitHub Secrets for CI/CD
- ✅ Enable two-factor authentication

### 2. Firebase Security

```bash
# Limit who can deploy
firebase projects:addrole user@example.com roles/firebase.admin

# Review deployment history
firebase hosting:channel:list

# Monitor usage
# Check Firebase Console regularly
```

### 3. Google Cloud Security

- ✅ Enable 2FA on your Google account
- ✅ Review OAuth consent screen regularly
- ✅ Monitor API quotas and usage
- ✅ Set up billing alerts
- ✅ Review audit logs periodically

### 4. Code Security

Run security checks:
```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

## 📊 Security Monitoring

### What to Monitor

1. **Google Cloud Console**
   - OAuth consent screen approvals
   - API usage patterns
   - Quota consumption

2. **Firebase Console**
   - Hosting bandwidth
   - Request patterns
   - Error rates

3. **GitHub**
   - Dependabot alerts
   - Security advisories
   - Access logs

### Red Flags

⚠️ **Immediate Action Required:**
- Unexpected API quota usage
- Unknown domains in OAuth redirect URIs
- Unusual access patterns
- Dependabot security alerts

## ✅ Security Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has no real values
- [ ] No secrets committed in git history
- [ ] OAuth redirect URIs are restrictive
- [ ] Google Cloud 2FA enabled
- [ ] Firebase project permissions reviewed
- [ ] Dependencies updated and audited
- [ ] HTTPS enabled (Firebase handles this)
- [ ] Monitoring configured
- [ ] Documentation reviewed

## 📚 Resources

- [Google OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2/production-readiness)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## 💡 Summary

**Key Takeaways:**

1. ✅ **Client ID is public** - Safe to expose, protected by redirect URI whitelist
2. ✅ **No secrets in code** - JiCompta has no server-side secrets
3. ✅ **User data is isolated** - Each user's data in their own Drive
4. ✅ **Safe for GitHub** - Repository ready for public/private hosting

**You can safely push to GitHub!** The application is designed with security as a priority.

---

**Questions or concerns?** Open an issue on GitHub or review the security documentation.

# 🚀 GitHub Repository Setup Guide

Quick reference for pushing JiCompta to GitHub.

## Repository Details

- **Owner**: SylvainRoy
- **Repository**: jicompta
- **URL**: https://github.com/SylvainRoy/jicompta
- **Git Email**: sylvain.roy@m4x.org

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Fill in:
   - Repository name: `jicompta`
   - Description: `Accounting management application for small French businesses with automatic Google Drive configuration`
   - Visibility: **Public** (recommended) or **Private**
   - ❌ Do NOT initialize with README, .gitignore, or license
3. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository on GitHub, run these commands:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/SylvainRoy/jicompta.git

# Verify remote is set correctly
git remote -v

# Push all commits to GitHub
git push -u origin main

# Push all tags (if any)
git push --tags
```

## Step 3: Verify Push

1. Go to: https://github.com/SylvainRoy/jicompta
2. Check that all files are there
3. Verify .env is NOT in the repository
4. Check that README.md displays correctly

## Step 4: Configure Repository Settings (Recommended)

### Add Topics
Go to: https://github.com/SylvainRoy/jicompta/settings

Add topics:
- `accounting`
- `react`
- `typescript`
- `google-drive`
- `firebase`
- `vite`
- `tailwindcss`

### Add Homepage
Set website URL:
- `https://jicompta.web.app`

### Enable Features
- ✅ Issues
- ✅ Discussions (optional)
- ✅ Projects (optional)
- ✅ Wiki (optional)

### Security
- Enable Dependabot alerts
- Enable Dependabot security updates

## Step 5: Add Repository Badges (Optional)

Add to top of README.md:

```markdown
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://jicompta.web.app)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
```

## Common Commands

```bash
# Check current branch
git branch

# View commit history
git log --oneline -10

# Check remote status
git remote -v

# Pull latest changes
git pull origin main

# Push new commits
git push origin main

# Create and push a new branch
git checkout -b feature-name
git push -u origin feature-name
```

## Troubleshooting

### Already have a remote named 'origin'
```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/SylvainRoy/jicompta.git
```

### Authentication issues
If using HTTPS and prompted for password:
1. Go to: https://github.com/settings/tokens
2. Generate a Personal Access Token
3. Use token instead of password

Or use SSH:
```bash
# Use SSH URL instead
git remote set-url origin git@github.com:SylvainRoy/jicompta.git
```

### Push rejected
```bash
# If remote has changes you don't have
git pull --rebase origin main
git push origin main
```

## Next Steps

After pushing to GitHub:

1. ✅ Verify repository is accessible
2. ✅ Check README renders correctly
3. ✅ Ensure .env is NOT visible
4. ✅ Set up branch protection (optional)
5. ✅ Invite collaborators (if needed)
6. ✅ Star your own repo! ⭐

---

**Your JiCompta repository is now on GitHub! 🎉**

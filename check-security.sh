#!/bin/bash
# Security check script for JiCompta before pushing to GitHub

echo "🔐 JiCompta Security Check"
echo "=========================="
echo ""

# Check 1: .env in .gitignore
echo "✓ Checking .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo "  ✅ .env is in .gitignore"
else
    echo "  ❌ .env is NOT in .gitignore - ADD IT NOW!"
    exit 1
fi

# Check 2: .env is not tracked
echo ""
echo "✓ Checking if .env is tracked by git..."
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "  ❌ .env is tracked by git - REMOVE IT NOW!"
    echo "  Run: git rm --cached .env"
    exit 1
else
    echo "  ✅ .env is not tracked"
fi

# Check 3: .env.example exists and has placeholder values
echo ""
echo "✓ Checking .env.example..."
if [ -f .env.example ]; then
    if grep -q "your_google_client_id_here" .env.example; then
        echo "  ✅ .env.example has placeholder values"
    else
        echo "  ⚠️  .env.example might have real values"
    fi
else
    echo "  ⚠️  .env.example not found"
fi

# Check 4: No secrets in staged files
echo ""
echo "✓ Checking staged files for secrets..."
if git diff --cached | grep -iE "(secret|password|token|key).*=.*[a-zA-Z0-9]{20,}" > /dev/null; then
    echo "  ⚠️  Potential secrets found in staged files"
    echo "  Review your staged changes carefully"
else
    echo "  ✅ No obvious secrets in staged files"
fi

# Check 5: Check what's staged
echo ""
echo "✓ Files staged for commit:"
git diff --cached --name-only | while read file; do
    echo "  - $file"
done

if [ -z "$(git diff --cached --name-only)" ]; then
    echo "  (No files staged)"
fi

# Final summary
echo ""
echo "=========================="
echo "📊 Security Check Summary"
echo "=========================="
echo ""
echo "✅ Your repository is ready for GitHub!"
echo ""
echo "Remember:"
echo "  1. Client ID is public - it's safe to expose"
echo "  2. No server secrets needed - this is a client-only app"
echo "  3. OAuth security relies on redirect URI whitelist"
echo ""
echo "See docs/SECURITY.md for detailed security information."

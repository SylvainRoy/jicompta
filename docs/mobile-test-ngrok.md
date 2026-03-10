# 📱 Mobile Testing with ngrok

## Why ngrok?

Google OAuth doesn't accept IPs (192.168.x.x) as redirect URIs.
ngrok creates an HTTPS tunnel with a real domain that works with Google OAuth.

## 🚀 Installation and Configuration (10 min)

### Step 1: Install ngrok

**Mac (with Homebrew)**:
```bash
brew install ngrok/ngrok/ngrok
```

**Or direct download**:
1. Go to: https://ngrok.com/download
2. Download for your OS
3. Extract and move to /usr/local/bin

### Step 2: Create an Account (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free)
3. Copy your authtoken

### Step 3: Authenticate ngrok

```bash
ngrok config add-authtoken YOUR_TOKEN
```

### Step 4: Start Local Server

In a terminal:
```bash
npm run dev
# Server starts on http://localhost:5173
```

### Step 5: Create ngrok Tunnel

In a **new terminal**:
```bash
ngrok http 5173
```

You'll see:
```
Session Status                online
Account                       your-email
Forwarding                    https://abc123.ngrok.io -> http://localhost:5173
```

**Copy the HTTPS URL**: `https://abc123.ngrok.io`

### Step 6: Add URI in Google Cloud

1. **Google Cloud Console** > APIs and services > Credentials
2. Click on your OAuth Client
3. **Authorized redirect URIs**, add:
   ```
   https://abc123.ngrok.io
   ```
   ⚠️ Replace `abc123` with your real ngrok URL

4. **Authorized JavaScript origins**, add:
   ```
   https://abc123.ngrok.io
   ```

5. Click **SAVE**

### Step 7: Update .env

```bash
# Edit .env
```

**Temporarily change**:
```env
VITE_GOOGLE_REDIRECT_URI=https://abc123.ngrok.io
```

### Step 8: Restart Server

```bash
# Ctrl+C to stop
npm run dev
```

### Step 9: Test!

**On your phone**:
1. Open: `https://abc123.ngrok.io`
2. Page loads
3. Click "Sign in with Google"
4. OAuth works!
5. Test application normally

**On desktop too**:
- Open: `https://abc123.ngrok.io`
- Everything works the same

---

## ⚠️ Free Version Limitations

- URL changes with each ngrok restart
- Session limited to 8 hours
- 1 tunnel at a time

**Solution**: Each time the URL changes, update:
1. URIs in Google Cloud Console
2. The .env (VITE_GOOGLE_REDIRECT_URI)
3. Restart the server

---

## 🎯 Recommended Dev Workflow

### For normal development:
```env
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```
```bash
npm run dev
# Test on http://localhost:5173
# Use DevTools for responsive
```

### To test on real mobile:
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 5173
# Copy ngrok URL

# Update Google Cloud URIs
# Update .env
# Restart npm run dev

# Test on phone with ngrok URL
```

---

## 💡 Alternative: DevTools = 95% Sufficient

**For daily development**, Chrome/Firefox DevTools are enough:
- ✅ Perfectly simulate mobile
- ✅ Touch events
- ✅ Exact screen sizes
- ✅ Rotation
- ✅ Network throttling
- ✅ Faster than real device

**Use ngrok only for**:
- Testing real performance
- Testing real touch ergonomics
- Client demos
- Final tests before production

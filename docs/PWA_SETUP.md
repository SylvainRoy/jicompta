# 📱 Progressive Web App (PWA) Setup

JiCompta is now a full Progressive Web App that can be installed on mobile devices and run like a native application!

## ✨ Features

- 📲 **Install to Home Screen**: Add JiCompta to your home screen on iOS and Android
- 🚀 **App-like Experience**: Runs in standalone mode without browser UI
- ⚡ **Fast Loading**: Service worker caches assets for quick startup
- 📴 **Offline Capable**: Basic functionality available without internet (view cached data)
- 🔄 **Auto-Updates**: Automatically checks for new versions

## 🎯 How to Install

### On iPhone/iPad (Safari)

1. Open **Safari** and go to `https://jicompta.web.app`
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "JiCompta")
5. Tap **"Add"** in the top right
6. JiCompta icon will appear on your home screen! 🎉

**Result:**
- Launches in fullscreen (no Safari UI)
- Looks and feels like a native app
- Appears in app switcher
- Blue theme color matches the app

### On Android (Chrome)

1. Open **Chrome** and go to `https://jicompta.web.app`
2. Tap the **menu** (three dots) in the top right
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Tap **"Install"** in the prompt
5. JiCompta will be added to your home screen and app drawer! 🎉

**Alternative:** Chrome may show an automatic install banner at the bottom

**Result:**
- Launches in standalone mode
- No browser UI (address bar, tabs)
- Behaves like a native Android app
- Can be found in app drawer

## 🔧 Technical Implementation

### Files Added

```
public/
├── manifest.json           # PWA manifest with app metadata
├── sw.js                  # Service worker for caching & offline
├── icon.svg               # Source vector icon
├── icon-192.png          # PWA icon (Android)
├── icon-512.png          # PWA icon (high-res)
└── apple-touch-icon.png  # iOS home screen icon
```

### manifest.json

Defines the app's appearance and behavior:

```json
{
  "name": "JiCompta",
  "short_name": "JiCompta",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

**Key properties:**
- `display: "standalone"` - Hides browser UI
- `theme_color` - iOS status bar and Android theme
- `orientation: "portrait-primary"` - Mobile-optimized orientation

### Service Worker (sw.js)

Provides offline capabilities and caching:

- **Network-first strategy** - Always tries network, falls back to cache
- **Static asset caching** - Caches HTML, CSS, JS, images
- **Smart caching** - Skips OAuth and API requests (always fresh)
- **Auto-cleanup** - Removes old cache versions

### iOS Meta Tags

Added to `index.html` for iOS PWA support:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="JiCompta">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## 🎨 Customizing the Icon

The default icon is a simple calculator design. To customize:

### Option 1: Replace PNG Files

Create new icons and replace:
- `public/icon-192.png` (192x192 px)
- `public/icon-512.png` (512x512 px)
- `public/apple-touch-icon.png` (180x180 px)

### Option 2: Edit SVG and Regenerate

1. Edit `public/icon.svg` with your design
2. Run `./generate-icons.sh`
3. Rebuild: `npm run build`
4. Redeploy: `firebase deploy --only hosting`

### Design Tips

- **Keep it simple**: Icons are viewed at small sizes
- **Use high contrast**: Ensure visibility on all backgrounds
- **Test on devices**: Check how it looks on actual home screens
- **Square design**: Icons are displayed in squares/circles
- **Avoid text**: Small text is hard to read at icon sizes

## 🚀 Deploying PWA

### Build and Deploy

```bash
# Build with PWA assets
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Verification Checklist

After deployment, verify:

- [ ] Visit `https://jicompta.web.app` on mobile
- [ ] Check browser shows "Install app" prompt (Chrome)
- [ ] iOS Safari "Add to Home Screen" option available
- [ ] Manifest loads without errors (check DevTools)
- [ ] Service worker registers successfully
- [ ] Icons display correctly when installed
- [ ] App launches in standalone mode
- [ ] No browser UI visible when running
- [ ] Offline mode works (turn off wifi, reload app)

### Testing

**Chrome DevTools (Desktop):**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section - should show app details
4. Check **Service Workers** - should show registered worker
5. Click **"Update on reload"** for development

**Lighthouse Audit:**
1. Open DevTools
2. Go to **Lighthouse** tab
3. Select "Progressive Web App" category
4. Click **"Generate report"**
5. Should score 90+ for PWA

## 📊 PWA Features Status

### ✅ Implemented

- [x] Web App Manifest
- [x] Service Worker
- [x] Installable on iOS
- [x] Installable on Android
- [x] Standalone display mode
- [x] Theme colors
- [x] Icons (all sizes)
- [x] Offline-capable (basic)
- [x] Fast loading (caching)

### 🔄 Future Enhancements

- [ ] Push notifications (when users want alerts)
- [ ] Background sync (sync data when online again)
- [ ] App shortcuts (quick actions from icon)
- [ ] Badge API (show notification count)
- [ ] Share target (receive shared content)
- [ ] Advanced offline mode (full offline CRUD)

## 🐛 Troubleshooting

### Install button doesn't appear

**Chrome:**
- Manifest must be valid
- Must be served over HTTPS
- Service worker must register successfully
- Must meet PWA installability criteria

**Solution:** Check DevTools → Application → Manifest

### Icon doesn't show on home screen

**iOS:**
- Check `apple-touch-icon.png` exists
- Verify it's at least 180x180 px
- Clear Safari cache and try again

**Android:**
- Check manifest icons are valid PNG
- Verify correct sizes (192x192, 512x512)
- Reinstall the app

### Service worker not updating

**During development:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()))
```

**In production:**
- Service worker automatically updates
- Users see update on next visit
- Can force update with skip waiting

### Offline mode not working

- Check service worker registered: `navigator.serviceWorker.ready`
- Verify cache strategy in `sw.js`
- OAuth/API calls won't work offline (by design)
- Only cached pages available offline

## 📱 Browser Support

| Browser | Version | Install | Standalone | Offline |
|---------|---------|---------|------------|---------|
| Safari iOS | 11.3+ | ✅ | ✅ | ✅ |
| Chrome Android | 57+ | ✅ | ✅ | ✅ |
| Firefox Android | 58+ | ✅ | ✅ | ✅ |
| Samsung Internet | 4+ | ✅ | ✅ | ✅ |
| Safari macOS | 17+ | ⚠️ | ⚠️ | ✅ |
| Chrome Desktop | 73+ | ✅ | ✅ | ✅ |
| Edge Desktop | 79+ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Partial support
- ❌ Not supported

## 📚 Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Guide](https://web.dev/progressive-web-apps/)
- [iOS PWA Guidelines](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Android PWA Guidelines](https://developer.chrome.com/docs/android/trusted-web-activity/)

## ✨ Result

**JiCompta is now a fully installable Progressive Web App!**

Users can add it to their home screen and use it like a native app, with:
- No browser UI clutter
- Fast loading with caching
- Offline capability
- True app-like experience

🎉 **Your accounting app is now in everyone's pocket!**

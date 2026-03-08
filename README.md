# JiCompta

Accounting management application for small French businesses with automatic configuration.

## ✨ Main Features

- **Automatic Configuration**: Complete setup in 10 seconds via an interactive wizard
- **Multi-user**: Each user has their own data in their Google Drive
- **PDF Generation**: Invoices and receipts automatically generated with customizable templates
- **Mobile-first**: Responsive interface optimized for smartphones and tablets
- **Progressive Web App**: Install on your home screen - works like a native app
- **No Backend**: All data stays in the user's Google Drive

## 🚀 Technologies

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks
- **APIs**: Google OAuth 2.0, Google Sheets, Google Docs, Google Drive

## 📦 Quick Installation

### Prerequisites

- Node.js 18+ and npm
- A Google Cloud account with OAuth 2.0 configured

### Installation in 3 Steps

1. **Clone and Install**

```bash
git clone <repository-url>
cd jicompta
npm install
```

2. **Configure Google OAuth**

- Create a project on [Google Cloud Console](https://console.cloud.google.com)
- Enable APIs: Google Sheets, Google Docs, Google Drive
- Create an OAuth 2.0 Client ID (Web Application)
- Add `http://localhost:5173` to authorized URIs
- Copy the Client ID

3. **Configure Environment**

```bash
cp .env.example .env
```

Edit `.env` with your Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> **⚠️ Important**: This is the **only** ID needed! All other IDs (spreadsheet, templates, folders) are automatically created and managed by the application.

**That's it!** Launch the application:

```bash
npm run dev
```

The application will be accessible at http://localhost:5173

## 👤 First Use

### Automatic Configuration

1. **Login**: Click "Sign in with Google" and authorize the permissions

2. **Automatic Detection**: The application searches your Google Drive:
   - ✅ **Existing configuration found**: Automatic loading of your workspace
   - 🆕 **New account**: The Setup Wizard launches

3. **Setup Wizard** (for new accounts only):
   - Creates the `Comptabilite/` folder in your Drive
   - Creates the `Compta` spreadsheet with 4 tabs (Clients, TypeDePrestation, Prestation, Paiement)
   - Creates document templates in `Comptabilite/Modeles/`
     - `Modèle de Facture` (customizable)
     - `Modèle de Reçu` (customizable)
   - Creates `Comptabilite/Factures/` and `Comptabilite/Recus/` folders
   - **Duration**: ~10-15 seconds

4. **Ready!** → Automatic redirection to the dashboard

### 📱 Multi-device Support

The application works **automatically on all your devices**:

- **Desktop Computer** → Sign in with Google → Your data is there!
- **Phone** → Sign in with Google → Your data is there!
- **Work Computer** → Sign in with Google → Your data is there!

**No manual synchronization needed**: Everything is in your Google Drive.

### 🔄 How Does It Work?

1. On login, the application searches for a `Comptabilite/` folder in your Drive
2. If found → Automatically loads the configuration (file IDs)
3. If absent → Launches the wizard to create the structure
4. Configuration is stored in the browser (localStorage) for quick access
5. On a new device → Automatic detection again

> **Note**: If you clear the browser cache, don't panic! The application will automatically search for your configuration in Drive.

See [INSTALLATION.md](./docs/INSTALLATION.md) for more details.

## 📂 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── common/         # Generic components (Button, Input, Modal...)
│   ├── layout/         # Layout, Sidebar, Header
│   └── forms/          # Specific forms
├── pages/              # Main pages
├── services/           # API services and business logic
├── contexts/           # React Contexts (Auth, Data, Notifications)
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── types/              # TypeScript types
└── constants/          # Constants
```

## ✅ Features

### Infrastructure and Configuration (✅ Complete)

- ✅ Automatic setup via interactive wizard
- ✅ Automatic creation of spreadsheet and templates
- ✅ Configuration stored in localStorage
- ✅ Detection and loading of existing configuration
- ✅ Settings page to manage configuration
- ✅ Google OAuth 2.0 with session management
- ✅ Toast notification system

### Data Management (✅ Complete)

- ✅ **Clients**: Complete CRUD with validation
- ✅ **Service Types**: Complete CRUD with suggested amounts
- ✅ **Services**: Complete CRUD with automatic status calculation
- ✅ **Payments**: Complete CRUD with links to services
- ✅ Filters and search on all pages
- ✅ Real-time Google Sheets integration

### Document Generation (✅ Complete)

- ✅ Automatic invoice generation in PDF
- ✅ Automatic receipt generation in PDF
- ✅ Customizable templates in Google Docs
- ✅ Organized storage by year in Google Drive
- ✅ Dynamic variables (client, amount, date, etc.)
- ✅ Contextual buttons (Generate/View depending on state)
- ✅ Loading indicators during generation

### User Interface (✅ Complete)

- ✅ Mobile-first responsive design
- ✅ Card view (mobile) and table (desktop)
- ✅ Intuitive navigation with sidebar
- ✅ Dashboard with statistics and charts
- ✅ Forms with real-time validation
- ✅ Modals for creation/editing
- ✅ Loading states and error messages

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint the code
```

## 📖 Documentation

- [Complete Installation](./docs/INSTALLATION.md) - Detailed installation guide
- [Firebase Deployment](./docs/FIREBASE_DEPLOYMENT.md) - Complete Firebase Hosting guide
- [PWA Setup](./docs/PWA_SETUP.md) - Install on home screen guide
- [Security Guide](./docs/SECURITY.md) - Credential management and GitHub deployment
- [Google Configuration](./docs/GOOGLE_SETUP.md) - Google Cloud Console setup
- [Templates](./docs/TEMPLATES_SETUP.md) - Available variables for invoices/receipts
- [Mobile Testing](./docs/MOBILE_TEST_NGROK.md) - Test on mobile with ngrok
- [Specifications](./docs/specification.md) - Complete functional specifications
- [Progress](./docs/PROGRESS.md) - Project progress status

## 🌐 Deployment

### Firebase Hosting (Recommended)

Firebase Hosting is already configured and ready to deploy:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (already configured, but if needed):
   ```bash
   firebase init hosting
   ```

4. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Update Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Add your Firebase URLs to authorized origins and redirect URIs:
     - `https://jicompta.web.app`
     - `https://jicompta.firebaseapp.com`

Your app will be live at: `https://jicompta.web.app`

### Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel
4. Update `VITE_GOOGLE_REDIRECT_URI` with production URL
5. Add production URL to Google Cloud Console (authorized URIs)

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Configure environment variables
4. Update authorized URIs in Google Cloud

## 🔐 Security and Privacy

- **No Backend**: The application stores no data on a third-party server
- **Personal Data**: Everything stays in the user's Google Drive
- **Automatic Configuration**:
  - File IDs are automatically discovered in Drive
  - Stored locally in the browser (localStorage) for performance
  - Re-detected automatically if cache is cleared
- **Secure OAuth**: Authentication via Google OAuth 2.0
- **Multi-user**: Complete isolation between users
  - Each user has their own `Comptabilite/` folder in their Drive
  - No possible interaction between accounts
  - Single shared Client ID (developer side), separate data (user side)
- **Safe for GitHub**: Client ID is public by design, protected by OAuth redirect URI whitelist
  - See [Security Guide](./docs/SECURITY.md) for detailed information
  - Run `./check-security.sh` before pushing to verify no secrets are committed

## 🎉 Recent Improvements (March 2026)

### Complete Industrialization

The application has been fully industrialized to simplify installation and use:

- ✅ **Fully automatic setup**: No need to manually create files in Drive
- ✅ **Only one ID required**: Only `VITE_GOOGLE_CLIENT_ID` is needed in `.env`
- ✅ **Automatic detection**: Finds and automatically loads existing configuration
- ✅ **Multi-device support**: Works on all devices without configuration
- ✅ **French names**: All folders and files in French (Comptabilite, Modeles, etc.)
- ✅ **Service management**: Correct distinction between linked and paid services

### Migration from Previous Version

If you're using an old version with manual configuration:

1. Old configurations continue to work
2. To benefit from automatic detection:
   - Make sure your folder is named `Comptabilite/`
   - Your spreadsheet must be named `Compta`
   - Your templates must be in `Comptabilite/Modeles/`
3. Clear the browser's localStorage to force re-detection

## 📝 Development Notes

### Data Formats

- **Dates**: Storage in `YYYY-MM-DD`, display in `DD/MM/YYYY`
- **Amounts**: Storage as decimal, display in French format `1 234,56 €`
- **Payment IDs**: Format `yymmddnnnn` (ex: 2603150001)

### Google Sheets API

- Data starts at row 2 (row 1 = headers)
- Each tab corresponds to a table
- Changes are synchronous with Google Sheets

## 👤 Author

JiCompta - Application developed with Claude Code

## 📄 License

Proprietary - All rights reserved

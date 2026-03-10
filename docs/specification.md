# Technical Specifications - Accounting Application

## Project Overview

**Accounting management application for small French businesses.**

A responsive web application allowing complete management of services, payments, clients, and PDF document generation for receipts and invoices with a template system based on Google Docs documents.

Data is stored in Google Sheets documents.

## Technical Stack

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API + Hooks

### Google Integration
- **Authentication**: Google OAuth 2.0 (user login)
- **Google Sheets API**: For reading/writing data
- **Google Docs API**: For invoice/receipt templates
- **Google Drive API**: For PDF export and storage

### Document Generation
- **Method**: Google Docs templates → variable replacement → PDF export via API
- **Storage**: PDFs saved in Google Drive, URLs stored in Sheets

### Deployment
- **Hosting**: GitHub Pages or Firebase Hosting (static hosting)
- **Type**: Single Page Application (SPA) + Progressive Web App (PWA)
- **Build**: Production optimized via Vite
- **PWA**:
  - Configured manifest (manifest.json)
  - Service Worker for caching
  - Installable on mobile (Android and iOS)
  - Configured icons and splash screens
  - Standalone mode for native app experience

### Main Dependencies
- `react`, `react-dom`
- `react-router-dom`
- `@google/oauth2`, `googleapis`
- `tailwindcss`
- `axios` or `fetch` for API calls

## User Interface

### Main Navigation
- **Sidebar/Menu**: Dashboard, Services, Payments, Clients, Service Types
- **Header**: Logged-in user, sign out, year selector

### Detailed Screens

#### 1. Dashboard (Home Page)
The dashboard contains the following sections (implemented).

**Year Selector**:
- Dropdown in top right with calendar icon
- Statistics filtering by year
- Defaults to current year
- "All" option to view all data
- Design: white background with border, modern style

**Services Section**:
- Card with blue gradient and document icon
- Displays: number of services and total amount for selected year
- Clickable link to services without payment with:
  - Design: orange background with navigation arrow
  - Hover: transition and arrow movement
  - Redirects to /prestations with "non_facturee" filter

**Payments Section**:
- Card with green gradient and payment icon
- Displays: number of payments and total amount for selected year
- Clickable link to pending payments with:
  - Design: red background with navigation arrow
  - Hover: transition and arrow movement
  - Redirects to /paiements with "en_attente" filter

**Clients Section**:
- Card with purple gradient and users icon
- Displays: total number of registered clients
- Subsection "Clients with largest pending payments":
  - Top 3 clients with total pending amount
  - Each client is clickable and redirects to /paiements with specific client filter
  - Design: white cards with navigation arrow on hover

**Recent Lists** (3-column grid):
1. **5 most recently created services**:
   - Header: blue gradient with icon
   - List with client, type, date, amount
   - Hover: light blue background

2. **5 most recent payments**:
   - Header: green gradient with icon
   - List with reference, client, date/status, amount
   - Status icons: ✓ (paid) or ⏰ (pending)
   - Hover: light green background

3. **Unpaid payments** (alert):
   - Header: red gradient with warning icon
   - List of pending payments with ⚠️ icon
   - If empty: displays green ✓ icon "All payments are received"
   - Hover: light red background

**Visual Improvements**:
- Color gradients for each section
- Colored icons in rounded squares with shadows
- Transition animations on hover
- Navigation arrows that move on hover
- Improved typography with larger titles
- Optimized spacing and padding

#### 2. Client Management
- **List**: Table with name, email, phone, actions (edit, delete)
- **Search**: By name, email or phone
- **Create/Edit Form**:
  - Name (required)
  - Email (required, format validation)
  - Phone (optional)
  - Address (textarea, multi-line)
  - SIRET Number (optional, 14 digits)
- **Delete Validation**: Warn if associated services/payments exist

#### 3. Service Types Management
- **List**: Table with name, suggested amount, actions
- **Create/Edit Form**:
  - Name (required)
  - Suggested amount (number, required, > 0)
- **Delete Validation**: Warn if associated services exist

#### 4. Services Management
- **List**: Table with date, client, type, amount, payment status, actions
- **Filters**: By status (not invoiced / invoiced / paid)
- **Search**: By client name or type
- **Sort**: By descending date (most recent first)
- **Create/Edit Form**:
  - Date (required, date picker)
  - Client (required, dropdown)
  - Service type (required, dropdown)
  - Amount (pre-filled from suggested amount, editable, required, > 0)
- **Bulk Actions**: Select multiple services to create a payment
- **Visual Indicator**:
  - Badge "Not invoiced" (yellow) - no linked payment
  - Badge "Invoiced" (blue) - payment created but not received
  - Badge "Paid" (green) - payment received
- **Protection**: Cannot edit or delete a service linked to a payment
- **URL parameters**: Support for `?filter=` parameters for direct links from dashboard

#### 5. Payments Management
- **List**: Table with reference, client, total, payment date, status, actions
- **Filters**: By status (paid / pending)
- **Search**: By client name or reference
- **Sort**: By descending reference (most recent first, format: yymmddnnnn)
- **Creation from selected services**:
  - Display list of selected services
  - Verify same client (validation)
  - Calculate total automatically
  - Generate reference automatically (format: yymmddnnnn)
  - Payment method (optional at creation)
  - Payment date (optional at creation)
- **Invoice generation**:
  - Button to create PDF from Google Docs template
  - If invoice already exists, opens PDF directly
  - Persistent notification during generation (~10-15s)
  - PDF stored in Drive: `Comptabilite/Factures/YYYY/`
- **Payment receipt**:
  - Payment date (date picker)
  - Method (dropdown: Transfer, Cash, Check, PayPal, Other)
- **Receipt generation**:
  - Available only after payment receipt
  - Same process as invoice
  - PDF stored in Drive: `Comptabilite/Recus/YYYY/`
- **Deletion**:
  - Possible only if payment not received
  - Automatically unlinks all associated services
  - Confirmation required with details of impacted services
- **Visual Indicator**:
  - Badge "Pending" (orange) - no payment date
  - Badge "Paid" (green) - with payment date
  - Label "Invoice generated" or "Receipt generated" (gray) depending on available documents
- **Document links**: Invoice and receipt clickable to PDF in Google Drive
- **URL parameters**: Support for `?filter=` and `?client=` parameters for direct links

#### 6. Login Page
- **"Sign in with Google" button**
- Welcome message / instructions
- Authentication error handling
- After login: auto-detection or configuration creation

#### 7. Automatic Configuration
The application has an automatic configuration system that detects or creates the necessary Google Drive structure.

**Auto-detection** (`checkExistingSetup()`):
1. Search for a `Comptabilite` folder in Google Drive
2. Search for the `Compta` spreadsheet in that folder
3. Search for subfolders: `Factures`, `Recus`, `Modeles`
4. Search for templates: `Modèle de Facture`, `Modèle de Reçu`
5. If found: automatically loads the configuration

**Auto-setup** (`autoSetup()`):
If no existing configuration is found:
1. Creates folder structure in Drive: `Comptabilite/Factures/`, `Comptabilite/Recus/`, `Comptabilite/Modeles/`
2. Creates the `Compta` spreadsheet with 4 tabs and headers:
   - `Clients`: nom, email, telephone, adresse, numero_siret
   - `TypeDePrestation`: nom, montant_suggere
   - `Prestation`: date, nom_client, type_prestation, montant, paiement_id
   - `Paiement`: reference, client, total, date_encaissement, mode_encaissement, facture, recu
3. Creates document templates in `Modeles/`:
   - `Modèle de Facture` with placeholders
   - `Modèle de Reçu` with placeholders
4. Saves configuration in localStorage (`jicompta_config`)
5. Ready to use (total duration: ~15 seconds)

**Multi-device**:
- Configuration stored in localStorage (specific to each device)
- First login on new device: auto-detects existing config
- No synchronization needed (everything is in Google Drive)

**Configuration Page**:
- Display of Google Drive resource IDs
- Ability to reset configuration
- Links to resources in Google Drive

### UX Principles
- Responsive design (mobile-first) with mobile cards and desktop tables
- Modal confirmations for deletions
- Success/error messages (toast notifications with persistent notification system)
- Loading states during API calls (spinners with messages)
- Forms with real-time validation
- Accessibility (ARIA labels, keyboard navigation)
- Auto-refresh: automatic data reload when app becomes visible
- Data protection: cannot modify/delete services linked to payments
- Sort by descending date: lists displayed from most recent to oldest
- Contextual navigation: clickable links from dashboard to filtered views

## Technical Constraints

The application must be accessible via a web browser and easily usable on phones and tablets.

It is not necessary to manage concurrent usage since there is only one system user.

Data must be saved in a Google Sheets document, as defined below, which the user can optionally edit manually.

## Authentication & Security

### Google OAuth Flow
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User authorizes scopes:
   - `https://www.googleapis.com/auth/spreadsheets` (Sheets read/write)
   - `https://www.googleapis.com/auth/documents` (Docs read/write)
   - `https://www.googleapis.com/auth/drive.file` (Drive file creation)
4. Redirect to app with token
5. Token stored in localStorage
6. Automatic token refresh before expiration

### Session Management
- JWT token stored locally
- Token verification on app load
- Sign out: token deletion + redirect to login
- Expired session: notification + automatic redirect

### Google Cloud Project Configuration
- Create project in Google Cloud Console
- Enable APIs: Google Sheets, Google Docs, Google Drive
- Create OAuth 2.0 Client ID
- Configure authorized domains (localhost + production domain)

## PDF Document Generation

### Google Docs Templates

#### Invoice and Receipt Template
Google Docs documents with variables to replace (all available for both types):

**Payment Information:**
- `{{REFERENCE_PAIEMENT}}`: Payment ID
- `{{DATE_FACTURE}}`: Document creation date
- `{{DATE_ENCAISSEMENT}}`: Payment date (or "Not received")
- `{{MODE_ENCAISSEMENT}}`: Payment method (or "Not specified")
- `{{TOTAL}}`: Total amount

**Client Information:**
- `{{NOM_CLIENT}}`: Client name
- `{{EMAIL_CLIENT}}`: Client email
- `{{TELEPHONE_CLIENT}}`: Client phone (or "Not provided")
- `{{ADRESSE_CLIENT}}`: Full address (or "Not provided")
- `{{SIRET_CLIENT}}`: SIRET number (or "Not provided")

**Details:**
- `{{LISTE_PRESTATIONS}}`: Services table (date, type, amount)

### Generation Process
1. **Copy template**: Create copy of Google Docs template
2. **Replace variables**: Use Google Docs API to replace placeholders
3. **PDF Export**: Export via Drive API in PDF format
4. **Storage**: Save PDF in specific Google Drive folder
5. **URL**: Get shareable link and store in Google Sheets
6. **Cleanup**: Delete temporary Doc copy

### Google Drive Organization
```
/Comptabilité/
  ├── Templates/
  │   ├── Template_Facture.gdoc
  │   └── Template_Recu.gdoc
  ├── Factures/
  │   ├── 2025/
  │   └── 2026/
  └── Reçus/
      ├── 2025/
      └── 2026/
```

## Data Formats and Conventions

### Date Formats
- **Display format**: DD/MM/YYYY (e.g.: 15/03/2026)
- **Google Sheets storage format**: YYYY-MM-DD (ISO 8601)
- **Automatic conversion**: On display and save

### Currency Formats
- **Currency**: Euro (€)
- **Display format**: Space as thousands separator, comma for decimals (e.g.: 1 234,56 €)
- **Storage format**: Decimal number (e.g.: 1234.56)
- **Precision**: 2 decimals maximum

### Payment ID Generation
- **Format**: `yymmddnnnn`
  - `yy`: 2-digit year (e.g.: 26 for 2026)
  - `mm`: 2-digit month (01-12)
  - `dd`: 2-digit day (01-31)
  - `nnnn`: 4-digit sequential number for the day (0001-9999)
- **Example**: 2603150001 (1st payment of March 15, 2026)
- **Generation**: Find the last number of the day and increment

### Email Validation
- Standard RFC 5322 format
- Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### SIRET Validation
- Exactly 14 digits
- Optional
- Validation with Luhn algorithm (optional)

## Error Management

### Google API Errors
- **Rate limiting**: Retry with exponential backoff
- **Expired token**: Automatic refresh then retry
- **Insufficient permissions**: Explicit message to user
- **Network**: Offline detection, modification queue

### Business Errors
- **Non-existent client**: Error message with suggestion
- **Invalid amount**: Real-time form validation
- **Different clients**: Block grouped payment creation
- **Deletion with dependencies**: Modal with dependencies list

### Technical Errors
- **Application crash**: React error boundary
- **Corrupted data**: Validation on load + fallback
- **Google Sheets inaccessible**: Read-only mode + local cache

### User Notifications
- **Success**: Green toast 3 seconds (e.g.: "Client created successfully")
- **Error**: Red toast with action (e.g.: "Network error - Retry")
- **Warning**: Orange toast (e.g.: "This client has associated services")
- **Information**: Blue toast (e.g.: "Synchronizing...")

## Data Models

Here are the different tabs in the Google Sheet that contains the data.

"Clients" Tab:
- nom: client name
- email: client email
- telephone: client phone
- adresse: client address on one or more lines
- numero_siret: client SIRET number

TypeDePrestation Tab
- nom: service type name (example: "Individual lesson per unit")
- montant_suggere: an amount to suggest in the application. The user can change it when creating the service.

Prestation Tab
- date: the service date
- nom_client: the client name
- type_prestation: the service type
- montant: the service amount, in euros
- paiement_id: a reference to the payment if there is one

Paiement Tab
- reference: the payment ID, with format yymmddnnnn
- client: the client name
- total: the payment amount
- date_encaissement: the payment date
- mode_encaissement: the payment method (transfer, cash, check, paypal, other)
- facture: the invoice URL if there is one
- recu: the receipt URL if there is one

## Business Logic

### Services → Payments Workflow

1. Create individual services
2. Select services from the same client to create a payment
3. Generate an invoice for this payment
4. Receive the payment (date + method)
5. Generate a receipt for this payment

### Business Validations

- Client required for service
- Service type required
- Amount > 0
- Same client for grouped payment
- No deletion if dependencies exist

### Referential Constraints

- Prestation → Client (required)
- Prestation → TypePrestation (required)
- Prestation → Paiement (optional)
- Paiement → Client (required)

### Data Saving

- Automatic save on every modification

## Application Architecture

### Folder Structure
```
src/
├── components/          # Reusable React components
│   ├── common/         # Generic components (Button, Input, Modal...)
│   ├── layout/         # Layout, Sidebar, Header
│   └── forms/          # Specific forms
├── pages/              # Main pages (Dashboard, Clients, etc.)
├── services/           # API services and business logic
│   ├── googleAuth.ts   # OAuth flow, token management, user info
│   ├── googleSetup.ts  # Auto-setup wizard, Drive resource creation
│   ├── googleSheets.ts # CRUD operations for the 4 sheets
│   └── googleDocs.ts   # PDF generation (invoices/receipts)
├── contexts/           # React Contexts (Auth, Data)
├── hooks/              # Custom hooks
├── utils/              # Utility functions
│   ├── dateFormatter.ts
│   ├── currencyFormatter.ts
│   └── validators.ts
├── types/              # TypeScript types
└── constants/          # Constants (API scopes, configs)
```

### Application Layers

#### 1. Presentation Layer (Components/Pages)
- Pure React components
- UI management and user interactions
- Consume hooks and contexts

#### 2. State Layer (Contexts + Hooks)
The application uses **React Context API** with a 4-layer architecture:

1. **AuthContext** (`src/contexts/AuthContext.tsx`):
   - Manages Google OAuth session
   - Loads/validates tokens from localStorage
   - Provides: `user`, `isAuthenticated`, `logout`, `handleGoogleSuccess`

2. **ConfigContext** (`src/contexts/ConfigContext.tsx`):
   - Manages Google Drive resource IDs
   - Cached in localStorage (`jicompta_config`)
   - Auto-detection via `checkExistingSetup()`
   - Provides: `config`, `isConfigured`, `saveConfig`, `clearConfig`

3. **DataContext** (`src/contexts/DataContext.tsx`):
   - **Main context** - manages all business data
   - Loads from Google Sheets when `isAuthenticated && isConfigured`
   - Provides CRUD operations: clients, typesPrestations, prestations, paiements
   - All mutations refresh from Sheets to maintain sync
   - Provides: `refreshAll()`, `addClient()`, `updateClient()`, `deleteClient()`, etc.
   - Auto-refresh: reloads data when app becomes visible

4. **NotificationContext** (`src/contexts/NotificationContext.tsx`):
   - Toast/notification management
   - Persistent notifications support (for PDF generation)
   - Provides: `success()`, `error()`, `info()`, `warning()`, `removeNotification()`

**Provider order** (in `App.tsx`):
```
AuthProvider
  → ConfigProvider
    → DataProvider
      → NotificationProvider
        → Routes
```
This order is critical: ConfigContext depends on AuthContext, DataContext depends on both.

**Mutation pattern**:
All mutations follow: API call → refresh → update state
Example: `addClient()` → `sheetsService.addClient()` → `refreshClients()` → state update

#### 3. Services Layer (Business Logic)
- Communication with Google APIs
- Data transformations (Sheets ↔ App)
- Business validations
- Document generation

#### 4. Utilities Layer
- Date/amount formatting
- Validators
- Generic helpers

### Local Cache Management

#### Cache Strategy
- **Read data**: In-memory cache (Context)
- **Modifications**: Optimistic updates + sync with Sheets
- **Invalidation**: On reload or after timeout (5 min)

#### Synchronization
- Initial load: Fetch all data on login
- Modifications: Immediate local update + API call
- On failure: Rollback + retry or notification

## Environment Configuration

### Environment Variables
```
VITE_GOOGLE_CLIENT_ID=           # OAuth Client ID
VITE_GOOGLE_REDIRECT_URI=        # OAuth redirect URL
VITE_SPREADSHEET_ID=             # Main Google Sheet ID
VITE_TEMPLATE_FACTURE_ID=        # Invoice template ID
VITE_TEMPLATE_RECU_ID=           # Receipt template ID
VITE_DRIVE_FOLDER_FACTURES_ID=   # Drive invoices folder ID
VITE_DRIVE_FOLDER_RECUS_ID=      # Drive receipts folder ID
```

### Configuration Files
- `.env.development`: Variables for local dev
- `.env.production`: Variables for production
- `tailwind.config.js`: Tailwind configuration
- `vite.config.ts`: Vite configuration
- `tsconfig.json`: TypeScript configuration

## Tests (Optional but Recommended)

### Unit Tests
- **Framework**: Vitest (native Vite)
- **Target**: Services, utils, validators
- **Example**: Format validation, ID generation

### Component Tests
- **Framework**: React Testing Library
- **Target**: Form components, buttons, modals
- **Example**: Form submission, input validation

### E2E Tests (For later)
- **Framework**: Playwright or Cypress
- **Critical Scenarios**:
  - Login → Create service → Create payment → Generate invoice
  - Complete CRUD on a client

## Performance

### React Optimizations
- Page lazy loading (React.lazy + Suspense)
- Memoization (useMemo, useCallback) for heavy calculations
- Avoid unnecessary re-renders

### Network Optimizations
- Batch Google Sheets requests if possible
- List pagination (100+ items)
- Response compression

### Initial Load
- Skeleton loaders during fetch
- Progressive loading (partial display)
- Frequent data caching

## Limitations and Constraints

### Google API Quotas
- **Sheets API**: 300 requests/minute/project
- **Docs API**: 300 requests/minute/project
- **Drive API**: 1000 requests/100 seconds/user
- **Strategy**: Client-side rate limiting + retry logic

### Technical Limitations
- Single simultaneous user (no conflict management)
- No complete offline mode (read-only possible)
- Google dependency (no alternative backend)

### Data Volumes
- Recommended maximum: 10,000 services/year
- Google Sheets maximum: 5 million cells
- Degraded performance beyond 1000 rows (consider pagination)

## Implemented Features

### Complete
- ✅ PWA (Progressive Web App) with mobile installation support
- ✅ Data auto-refresh when returning to the app
- ✅ Data protection (linked services not modifiable)
- ✅ Payment deletion with automatic service unlinking
- ✅ Contextual navigation from dashboard with filters
- ✅ Automatic configuration system
- ✅ Improved design with gradients, icons and animations
- ✅ Sort by descending date (most recent first)
- ✅ Detailed payment statuses (not invoiced/invoiced/paid)
- ✅ Translated and consistent status labels

## Future Developments (V2+)

### Additional Features
- Backup and restore of the Google Sheet
- PDF accounting export for French tax declaration
- CSV export for accounting software
- Advanced statistics (interactive charts)
- Multi-user with permissions
- Automatic email notifications
- Multiple invoice/receipt templates
- Dark mode
- Multi-currency support
- Recurring services
- Quote management
- Automated monthly/annual reports

### Technical Improvements
- Complete offline mode with synchronization
- Backend API (Node.js/Python) for complex logic
- Real database (PostgreSQL/MongoDB)
- Websockets for real-time sync
- Complete automated tests (unit + E2E)
- Performance optimization for large volumes
- Strict TypeScript migration (strict mode)

## Deliverables

### Phase 1 - MVP
- [ ] Project setup (Vite + React + TypeScript + Tailwind)
- [ ] Google OAuth configuration
- [ ] Login interface
- [ ] Clients CRUD
- [ ] Service Types CRUD
- [ ] Services CRUD
- [ ] Payments CRUD
- [ ] Google Sheets integration (read/write)
- [ ] Basic dashboard
- [ ] PDF invoice generation
- [ ] PDF receipt generation
- [ ] Production deployment

### Phase 2 - Improvements
- [ ] Advanced dashboard statistics
- [ ] Charts
- [ ] Advanced filters and search
- [ ] Data export
- [ ] Unit tests
- [ ] User documentation

## Appendices

### Resources
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)

### Contacts and Support
- Developer: [To be completed]
- Repository: [To be completed]
- Documentation: [To be completed]

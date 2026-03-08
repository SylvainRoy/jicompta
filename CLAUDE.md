# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server on http://localhost:5173
npm run build     # TypeScript compile + Vite production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

## Architecture Overview

### Serverless Architecture

This is a **fully client-side application** with no backend server. All data is stored in the user's Google Drive:

- **Data storage**: Google Sheets (4 tabs: Clients, TypeDePrestation, Prestation, Paiement)
- **PDF generation**: Google Docs templates → PDF export → Drive storage
- **Authentication**: Google OAuth 2.0 (implicit flow, access tokens only)
- **Configuration**: Auto-detected from Drive + cached in localStorage

**Critical**: Each user has their own isolated data in their Google Drive (`Comptabilite/` folder). The app never stores or shares data between users.

### State Management Architecture

The app uses **React Context API** with a three-layer context structure:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages Google OAuth session
   - Loads/validates access tokens from localStorage
   - Provides: `user`, `isAuthenticated`, `logout`, `handleGoogleSuccess`

2. **ConfigContext** (`src/contexts/ConfigContext.tsx`)
   - Manages Google Drive resource IDs (spreadsheet, templates, folders)
   - Cached in localStorage as `jicompta_config`
   - Auto-detected from Drive on first login via `checkExistingSetup()`
   - Provides: `config`, `isConfigured`, `saveConfig`, `clearConfig`

3. **DataContext** (`src/contexts/DataContext.tsx`)
   - **Most important context** - manages all business data
   - Loads data from Google Sheets when `isAuthenticated && isConfigured`
   - Provides CRUD operations for: clients, typesPrestations, prestations, paiements
   - All mutations refresh data from Google Sheets to maintain sync
   - Provides: `refreshAll()`, `addClient()`, `updateClient()`, etc.

**Context Provider Order** (in `App.tsx`):
```
AuthProvider
  → ConfigProvider
    → DataProvider
      → NotificationProvider
        → App Routes
```

This order matters: ConfigContext depends on AuthContext, DataContext depends on both.

### Data Flow Pattern

**On App Load**:
1. `AuthContext` initializes → loads token from localStorage → validates with Google
2. `ConfigContext` initializes → loads config from localStorage
3. `DataContext` useEffect triggers when `isAuthenticated && isConfigured` → calls `refreshAll()`
4. `refreshAll()` fetches all 4 sheets in parallel → updates state

**On User Action** (e.g., add client):
1. User submits form → calls `addClient(client)` from DataContext
2. `addClient()` → `sheetsService.addClient()` → Google Sheets API append
3. After successful API call → `refreshClients()` → refetch all clients
4. State updates → React re-renders

**Important**: All mutations follow the pattern: API call → refresh → update state. This ensures data consistency with Google Sheets.

## Google APIs Integration

### Services Layer (`src/services/`)

- **googleAuth.ts**: OAuth flow, token management, user info fetching
- **googleSetup.ts**: Auto-setup wizard, Drive resource creation, config detection
- **googleSheets.ts**: All CRUD operations for the 4 sheets (Clients, TypeDePrestation, Prestation, Paiement)
- **googleDocs.ts**: PDF generation (factures/reçus) via template copying and replacement

### Auto-Configuration System

The app can automatically detect existing setups or create new ones:

**Detection Flow** (`googleSetup.ts::checkExistingSetup()`):
1. Search Drive for folder named `Comptabilite`
2. Search inside for spreadsheet named `Compta`
3. Find subfolders: `Factures`, `Recus`, `Modeles`
4. Find templates: `Modèle de Facture`, `Modèle de Reçu`
5. Return `SetupConfig` with all IDs

**Auto-Setup Flow** (`googleSetup.ts::autoSetup()`):
1. Create `Comptabilite/` folder structure
2. Create `Compta` spreadsheet with 4 tabs + headers
3. Create invoice and receipt templates in `Modeles/`
4. Return `SetupConfig` with all new IDs

### Google Sheets Data Model

**Row indexing**: Row 1 = headers, data starts at row 2. When calling API functions with `rowIndex`, use 0-based indexing (0 = first data row = row 2 in sheet).

**Sheets structure**:
- `Clients`: nom, email, telephone, adresse, numero_siret
- `TypeDePrestation`: nom, montant_suggere
- `Prestation`: date, nom_client, type_prestation, montant, paiement_id
- `Paiement`: reference, client, total, date_encaissement, mode_encaissement, facture, recu

**Key relationships**:
- `Prestation.nom_client` → `Client.nom`
- `Prestation.type_prestation` → `TypePrestation.nom`
- `Prestation.paiement_id` → `Paiement.reference`
- `Paiement.client` → `Client.nom`

### PDF Generation Flow

**Facture/Reçu generation** (`googleDocs.ts`):
1. Copy template from `Modeles/` folder
2. Find/create year subfolder (e.g., `Factures/2026/`)
3. Replace all template placeholders (`{{VARIABLE}}`) with actual data
4. Export document as PDF
5. Upload PDF to Drive in year folder
6. Make PDF publicly viewable (shareable link)
7. Delete temporary Google Doc
8. Return PDF URL

**Template placeholders**: See `TEMPLATE_PLACEHOLDERS` in `src/constants/index.ts` for all available variables.

## Critical Conventions

### Date Handling

**Storage format**: `YYYY-MM-DD` (ISO 8601, Google Sheets compatible)
**Display format**: `DD/MM/YYYY` (French format)

Use utilities:
- `formatDateForDisplay(isoDate)` - converts storage → display
- Input fields use type="date" which expects/returns `YYYY-MM-DD`

### Currency Formatting

**Storage**: JavaScript number (decimal)
**Display**: French format with space separator and € symbol (e.g., `1 234,56 €`)

Use `formatCurrency(amount)` utility for all currency displays.

### Payment Reference Generation

Format: `yymmddnnnn` (year + month + day + sequence number)
Example: `2603150001` = March 15, 2026, payment #1

Generated by `generatePaiementID(existingRefs)` in `src/utils/validators.ts`.

### Entity Naming (French)

All user-facing entities use French names:
- **NOT** "Services" → use **"Prestations"**
- **NOT** "Service Types" → use **"Types de Prestation"**
- **NOT** "Payments" → use **"Paiements"**
- **NOT** "Accounting" → use **"Comptabilite"**

Variable names in code follow French business terminology (e.g., `nom_client`, `date_encaissement`, `montant_suggere`).

## Key Technical Patterns

### Responsive Design Strategy

The app uses **mobile-first** responsive design with Tailwind CSS:

- **Mobile (< 768px)**: Card-based layouts
- **Desktop (≥ 768px)**: Table-based layouts

Most pages render two views and toggle with `hidden md:block` / `md:hidden` classes. See `src/pages/Clients.tsx` for reference pattern.

### Form Validation Pattern

Forms use controlled components with real-time validation:
1. Form state in component (e.g., `ClientForm.tsx`)
2. Validation on change + on submit
3. Error messages below each field
4. Submit button disabled until valid

### Loading States

All async operations show loading states:
- `isLoading` flag in contexts
- `<Loading />` component with size variants
- Button `isLoading` prop for inline loading states

### Error Handling

Errors bubble up to `NotificationContext` for toast display:
1. Service throws error
2. Context catches → calls `notifyError(message)`
3. Toast appears with error message
4. Error logged to console

## Environment Variables

Only one required variable: `VITE_GOOGLE_CLIENT_ID`

All other IDs (spreadsheet, templates, folders) are auto-detected from Google Drive.

**Security note**: The Client ID is public by design (OAuth 2.0 implicit flow). Security is enforced by redirect URI whitelist in Google Cloud Console.

## Testing Considerations

No test framework currently configured. When adding tests:
- Mock Google API calls (sheets, docs, drive)
- Mock `gapi` and `@react-oauth/google` libraries
- Test DataContext CRUD operations
- Test form validations
- Test date/currency formatters

## Common Gotchas

1. **localStorage is device-specific**: Config and auth tokens don't sync between devices. The app auto-detects config from Drive on new devices.

2. **Row index offset**: Google Sheets API uses 1-based rows, but app uses 0-based indexing for data rows (row 2 = index 0).

3. **Access token expiration**: Tokens expire after 1 hour. `AuthContext` checks expiration on load but doesn't auto-refresh. User must re-login.

4. **Deleting linked entities**: Cannot delete a client/type/payment with related prestations. Check relationships before delete (see `DataContext::deleteClient()`).

5. **Payment status logic**:
   - Payment is "paid" if `date_encaissement` is set
   - Prestation is "paid" if `paiement_id` is set
   - These are independent fields - a payment can exist without being encaissé

6. **PDF generation is slow**: Copying template + replacing text + exporting PDF takes 10-15 seconds. Show loading state.

## Development Workflow

1. **OAuth Setup**: Must configure Google Cloud Console with correct redirect URIs before first run
2. **First Login**: App will auto-setup Drive structure (takes ~15 seconds)
3. **Customize Templates**: After setup, edit templates in Drive (`Comptabilite/Modeles/`)
4. **Multi-device**: Login on new device automatically finds existing config

## Mobile PWA

The app is a Progressive Web App (PWA) configured via `public/manifest.json` and `public/sw.js`. Users can install it on mobile home screens. See `docs/PWA_SETUP.md` for installation guides.

# Schema Migration Framework

## Overview

JiCompta uses Google Sheets as its datastore. As the application evolves, the sheet structure (tabs, columns, headers) may change. The migration framework ensures that existing user spreadsheets are upgraded safely and automatically, without data loss.

## Architecture

### _Meta Sheet

Every JiCompta spreadsheet contains a hidden `_Meta` sheet that tracks the current schema version:

| key            | value |
|----------------|-------|
| schema_version | 2     |

- **New setups** (`autoSetup()`): The `_Meta` sheet is created with `schema_version` set to the latest version. No migrations run.
- **Existing setups** (pre-framework spreadsheets): On first load, `ensureMetaSheet()` creates the `_Meta` sheet with version `0`, meaning all migrations are pending.

### Migration Registry

All migrations are defined in the `MIGRATIONS` array in `src/services/googleSetup.ts`:

```ts
const MIGRATIONS: Migration[] = [
  { version: 1, name: 'add_depense_sheet', run: async (id) => { ... } },
  { version: 2, name: 'add_prestation_associatif_column', run: async (id) => { ... } },
  // Future migrations go here
];
```

Each migration has:
- **version**: Sequential integer, starting at 1. Must be strictly increasing.
- **name**: Descriptive identifier for logging (e.g., `add_depense_sheet`).
- **run**: Async function that receives the `spreadsheetId` and performs the migration.

### Execution Flow

When the app loads (`DataContext.refreshAll()` -> `runMigrations()`):

1. `ensureMetaSheet()` creates the `_Meta` sheet if missing (version defaults to `0`).
2. `getSchemaVersion()` reads the current version from `_Meta`.
3. Pending migrations are filtered: `MIGRATIONS.filter(m => m.version > currentVersion)`.
4. If no pending migrations, return early (single API call overhead on normal loads).
5. **Automatic backup**: Before any migration runs, a backup of the spreadsheet is created in the `Comptabilite/` folder. This allows the user to restore their data if a migration fails or produces unexpected results. The backup is best-effort — if it fails, migrations still proceed.
6. For each pending migration in order:
   - Execute `migration.run(spreadsheetId)`
   - Update `schema_version` in `_Meta` to `migration.version`
7. `clearColumnMapCache()` invalidates the header-based column cache (since migrations may add columns or sheets).

### Header-Based Column Resolution

The app reads data by column **name** (from the header row), not by column **position**. This means:

- A migration that adds a new column won't break older app versions reading the same sheet (unknown columns are ignored).
- Column reordering (e.g., manual edits in Google Sheets) doesn't cause data corruption.
- Missing optional columns gracefully default to `undefined` or `false`.

This is implemented via `readSheetWithHeaders()` and `getColumnMap()` in `src/services/googleSheets.ts`.

## How to Add a New Migration

### Step 1: Append to MIGRATIONS

Add a new entry at the end of the `MIGRATIONS` array in `src/services/googleSetup.ts`:

```ts
const MIGRATIONS: Migration[] = [
  // ... existing migrations ...
  {
    version: 3, // must be previous version + 1
    name: 'add_some_new_column',
    run: async (spreadsheetId: string) => {
      // Your migration logic here
    },
  },
];
```

`LATEST_SCHEMA_VERSION` is derived automatically from the last migration.

### Step 2: Write the Migration Function

Follow these rules:

1. **Idempotent**: Check before modifying. If the migration has already been applied (e.g., column already exists), return early without error.
2. **Non-destructive**: Never delete columns or data. Only add new sheets, columns, or default values.
3. **Self-contained**: Use the `sheetsRequest()` helper (already in scope). Do not depend on other migrations having run in the same session.
4. **Handle failures gracefully**: If a migration fails partway, the version in `_Meta` won't be updated. On next app load, the migration will retry from where it left off (this is why idempotency matters).

### Step 3: Update createSpreadsheet() If Needed

If your migration adds a new sheet or column, also update `createSpreadsheet()` so that **new setups** get the final schema directly without needing to run migrations. This keeps `autoSetup()` fast and ensures consistency.

### Step 4: Update Types and Sheet Service

If you added a new column:
- Add the field to the relevant type in `src/types/index.ts`.
- Update the corresponding `get*` function in `src/services/googleSheets.ts` to read the new column via `getCellString()`, `getCellNumber()`, etc.
- Update the corresponding `add*`/`update*` functions to include the new field in `buildRow()`.

Thanks to header-based resolution, you do **not** need to update column letter mappings or hardcoded ranges.

### Example: Adding a "notes" Column to Clients

```ts
// 1. Migration in MIGRATIONS array:
{
  version: 3,
  name: 'add_client_notes_column',
  run: async (spreadsheetId: string) => {
    // Check if column already exists
    const response = await sheetsRequest(
      `/${spreadsheetId}/values/${encodeURIComponent('Clients!F1:F1')}`
    );
    if (response.values?.length > 0 && response.values[0].length > 0) return;

    // Add header
    await sheetsRequest(
      `/${spreadsheetId}/values/Clients!F1:F1?valueInputOption=RAW`,
      'PUT',
      { values: [['notes']] }
    );
  },
},

// 2. Update createSpreadsheet() headers:
{ range: 'Clients!A1:F1', values: [['nom', 'email', 'telephone', 'adresse', 'numero_siret', 'notes']] }

// 3. Update types/index.ts:
export interface Client {
  // ... existing fields ...
  notes?: string;
}

// 4. Update googleSheets.ts getClients():
clients.push({
  // ... existing fields ...
  notes: getCellOptionalString(row, columns, 'notes'),
});

// 5. Update googleSheets.ts addClient() / updateClient():
const row = buildRow(columns, {
  // ... existing fields ...
  notes: client.notes || '',
});
```

## Current Migrations

| Version | Name | Description |
|---------|------|-------------|
| 1 | `add_depense_sheet` | Adds the `Depense` sheet with headers (date, compte, montant, description) |
| 2 | `add_prestation_associatif_column` | Adds the `associatif` column (F) to the `Prestation` sheet, defaults existing rows to `FALSE` |

## Key Files

| File | Role |
|------|------|
| `src/services/googleSetup.ts` | Migration registry, `_Meta` sheet management, `runMigrations()` |
| `src/services/googleSheets.ts` | Header-based column resolution (`readSheetWithHeaders`, `getColumnMap`, `clearColumnMapCache`) |
| `src/contexts/DataContext.tsx` | Calls `runMigrations()` once per session before first data load |
| `src/types/index.ts` | Data model types matching sheet columns |
| `src/constants/index.ts` | Sheet tab names (`SHEET_TABS`) |

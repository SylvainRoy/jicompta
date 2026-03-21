/**
 * Google Setup Service
 * Automatically creates all required Google Drive resources for a new user
 */

import { loadAuthData } from './googleAuth';
import { clearColumnMapCache } from './googleSheets';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DOCS_API_BASE = 'https://docs.googleapis.com/v1';

export interface SetupConfig {
  spreadsheetId: string;
  templateFactureId: string;
  templateRecuId: string;
  folderComptabiliteId: string;
  folderFacturesId: string;
  folderRecusId: string;
  setupDate: string;
  version: string;
  folderName: string;
}

/**
 * Make a request to Google Sheets API
 */
async function sheetsRequest(endpoint: string, method: string = 'GET', body?: unknown): Promise<any> {
  const user = loadAuthData();
  if (!user) throw new Error('Not authenticated');

  const url = `${SHEETS_API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sheets API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Make a request to Google Drive API
 */
async function driveRequest(endpoint: string, method: string = 'GET', body?: unknown): Promise<any> {
  const user = loadAuthData();
  if (!user) throw new Error('Not authenticated');

  const url = `${DRIVE_API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Drive API error: ${response.status} - ${error}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

/**
 * Make a request to Google Docs API
 */
async function docsRequest(endpoint: string, method: string = 'GET', body?: unknown): Promise<any> {
  const user = loadAuthData();
  if (!user) throw new Error('Not authenticated');

  const url = `${DOCS_API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Docs API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create a folder in Google Drive
 */
async function createFolder(name: string, parentId?: string): Promise<string> {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await driveRequest('/files', 'POST', metadata);
  return response.id;
}

/**
 * Create the folder structure: Comptabilite/Factures, Comptabilite/Recus, and Comptabilite/Modeles
 */
export async function createFolderStructure(folderName: string = 'Comptabilite'): Promise<{
  folderComptabiliteId: string;
  folderFacturesId: string;
  folderRecusId: string;
  folderTemplatesId: string;
}> {
  // Create main folder
  const folderComptabiliteId = await createFolder(folderName);

  // Create subfolders
  const folderFacturesId = await createFolder('Factures', folderComptabiliteId);
  const folderRecusId = await createFolder('Recus', folderComptabiliteId);
  const folderTemplatesId = await createFolder('Modeles', folderComptabiliteId);

  return {
    folderComptabiliteId,
    folderFacturesId,
    folderRecusId,
    folderTemplatesId,
  };
}

/**
 * Create the Compta spreadsheet with all sheets and headers
 */
export async function createSpreadsheet(folderId: string): Promise<string> {
  const spreadsheet = await sheetsRequest('', 'POST', {
    properties: {
      title: 'Compta',
    },
    sheets: [
      {
        properties: {
          title: 'Clients',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'TypeDePrestation',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Prestation',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Paiement',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Depense',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: '_Meta',
          hidden: true,
        },
      },
    ],
  });

  const spreadsheetId = spreadsheet.spreadsheetId;

  // Get the actual sheet IDs from the response
  const sheetIds = spreadsheet.sheets.map((sheet: any) => sheet.properties.sheetId);

  // Add headers to each sheet
  const updates = [
    {
      range: 'Clients!A1:E1',
      values: [['nom', 'email', 'telephone', 'adresse', 'numero_siret']],
    },
    {
      range: 'TypeDePrestation!A1:B1',
      values: [['nom', 'montant_suggere']],
    },
    {
      range: 'Prestation!A1:G1',
      values: [['date', 'nom_client', 'type_prestation', 'montant', 'paiement_id', 'associatif', 'notes']],
    },
    {
      range: 'Paiement!A1:H1',
      values: [['reference', 'client', 'total', 'date_encaissement', 'mode_encaissement', 'facture', 'recu', 'notes']],
    },
    {
      range: 'Depense!A1:D1',
      values: [['date', 'compte', 'montant', 'description']],
    },
    {
      range: '_Meta!A1:B2',
      values: [['key', 'value'], ['schema_version', String(LATEST_SCHEMA_VERSION)]],
    },
  ];

  await sheetsRequest(`/${spreadsheetId}/values:batchUpdate`, 'POST', {
    valueInputOption: 'RAW',
    data: updates,
  });

  // Format headers (bold) using the actual sheet IDs
  const formatRequests = sheetIds.map((sheetId: number) => ({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          textFormat: {
            bold: true,
          },
        },
      },
      fields: 'userEnteredFormat.textFormat.bold',
    },
  }));

  await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
    requests: formatRequests,
  });

  // Move spreadsheet to Comptabilite folder
  const file = await driveRequest(`/files/${spreadsheetId}?fields=parents`, 'GET');
  const previousParents = file.parents ? file.parents.join(',') : '';

  await driveRequest(
    `/files/${spreadsheetId}?addParents=${folderId}&removeParents=${previousParents}`,
    'PATCH'
  );

  return spreadsheetId;
}

/**
 * Create a template document (facture or reçu)
 */
export async function createTemplate(type: 'facture' | 'recu', folderId: string): Promise<string> {
  const title = type === 'facture' ? 'Modèle de Facture' : 'Modèle de Reçu';

  // Create the document
  const doc = await docsRequest('/documents', 'POST', {
    title,
  });

  const documentId = doc.documentId;

  // Move to folder
  const file = await driveRequest(`/files/${documentId}?fields=parents`, 'GET');
  const previousParents = file.parents ? file.parents.join(',') : '';

  await driveRequest(
    `/files/${documentId}?addParents=${folderId}&removeParents=${previousParents}`,
    'PATCH'
  );

  // Add template content
  const content = type === 'facture'
    ? createFactureTemplateContent()
    : createRecuTemplateContent();

  await docsRequest(`/documents/${documentId}:batchUpdate`, 'POST', {
    requests: [
      {
        insertText: {
          location: {
            index: 1,
          },
          text: content,
        },
      },
    ],
  });

  return documentId;
}

/**
 * Generate facture template content
 */
function createFactureTemplateContent(): string {
  return `FACTURE

Référence: {{REFERENCE_PAIEMENT}}
Date de facture: {{DATE_FACTURE}}

Client:
{{NOM_CLIENT}}
{{EMAIL_CLIENT}}
{{TELEPHONE_CLIENT}}
{{ADRESSE_CLIENT}}
SIRET: {{SIRET_CLIENT}}

Prestations:
{{LISTE_PRESTATIONS}}

Total: {{TOTAL}}

Date d'encaissement: {{DATE_ENCAISSEMENT}}
Mode d'encaissement: {{MODE_ENCAISSEMENT}}
`;
}

/**
 * Generate reçu template content
 */
function createRecuTemplateContent(): string {
  return `REÇU

Référence: {{REFERENCE_PAIEMENT}}
Date: {{DATE_FACTURE}}

Client:
{{NOM_CLIENT}}
{{EMAIL_CLIENT}}
{{TELEPHONE_CLIENT}}
{{ADRESSE_CLIENT}}
SIRET: {{SIRET_CLIENT}}

Prestations:
{{LISTE_PRESTATIONS}}

Total: {{TOTAL}}

Encaissé le: {{DATE_ENCAISSEMENT}}
Mode d'encaissement: {{MODE_ENCAISSEMENT}}
`;
}

// ==================== SCHEMA MIGRATION FRAMEWORK ====================

interface Migration {
  version: number;
  name: string;
  run: (spreadsheetId: string) => Promise<void>;
}

/**
 * Ordered list of all schema migrations.
 * Each migration has a version number, a descriptive name, and a run function.
 * Migrations are idempotent — they check before modifying.
 * New migrations must be appended at the end with an incremented version.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'add_depense_sheet',
    run: async (spreadsheetId: string) => {
      const spreadsheet = await sheetsRequest(`/${spreadsheetId}?includeGridData=false`);
      const sheets = spreadsheet.sheets || [];
      if (sheets.some((sheet: any) => sheet.properties.title === 'Depense')) return;

      await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
        requests: [{
          addSheet: {
            properties: {
              title: 'Depense',
              gridProperties: { frozenRowCount: 1 },
            },
          },
        }],
      });

      await sheetsRequest(`/${spreadsheetId}/values/Depense!A1:D1?valueInputOption=RAW`, 'PUT', {
        values: [['date', 'compte', 'montant', 'description']],
      });

      const updated = await sheetsRequest(`/${spreadsheetId}?includeGridData=false`);
      const depenseSheet = updated.sheets.find((s: any) => s.properties.title === 'Depense');
      if (depenseSheet) {
        await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
          requests: [{
            repeatCell: {
              range: { sheetId: depenseSheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          }],
        });
      }
    },
  },
  {
    version: 2,
    name: 'add_prestation_associatif_column',
    run: async (spreadsheetId: string) => {
      const range = 'Prestation!F1:F1';
      const response = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent(range)}`);
      if (response.values?.length > 0 && response.values[0].length > 0) return;

      await sheetsRequest(`/${spreadsheetId}/values/Prestation!F1:F1?valueInputOption=RAW`, 'PUT', {
        values: [['associatif']],
      });

      const prestationsResponse = await sheetsRequest(
        `/${spreadsheetId}/values/${encodeURIComponent('Prestation!A2:E')}`
      );
      if (prestationsResponse.values?.length > 0) {
        const defaultValues = prestationsResponse.values.map(() => ['FALSE']);
        await sheetsRequest(`/${spreadsheetId}/values/Prestation!F2:F?valueInputOption=RAW`, 'PUT', {
          values: defaultValues,
        });
      }

      const spreadsheet = await sheetsRequest(`/${spreadsheetId}?includeGridData=false`);
      const prestationSheet = spreadsheet.sheets.find((s: any) => s.properties.title === 'Prestation');
      if (prestationSheet) {
        await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
          requests: [{
            repeatCell: {
              range: {
                sheetId: prestationSheet.properties.sheetId,
                startRowIndex: 0, endRowIndex: 1,
                startColumnIndex: 5, endColumnIndex: 6,
              },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          }],
        });
      }
    },
  },
  {
    version: 3,
    name: 'add_notes_columns',
    run: async (spreadsheetId: string) => {
      // Add 'notes' column to Prestation sheet (column G)
      const prestationHeaders = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent('Prestation!1:1')}`);
      const prestationHasNotes = prestationHeaders.values?.[0]?.some((h: string) => String(h).toLowerCase() === 'notes');
      if (!prestationHasNotes) {
        const nextCol = (prestationHeaders.values?.[0]?.length ?? 6) + 1;
        const colLetter = String.fromCharCode(64 + nextCol);
        await sheetsRequest(`/${spreadsheetId}/values/Prestation!${colLetter}1:${colLetter}1?valueInputOption=RAW`, 'PUT', {
          values: [['notes']],
        });
      }

      // Add 'notes' column to Paiement sheet (column H)
      const paiementHeaders = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent('Paiement!1:1')}`);
      const paiementHasNotes = paiementHeaders.values?.[0]?.some((h: string) => String(h).toLowerCase() === 'notes');
      if (!paiementHasNotes) {
        const nextCol = (paiementHeaders.values?.[0]?.length ?? 7) + 1;
        const colLetter = String.fromCharCode(64 + nextCol);
        await sheetsRequest(`/${spreadsheetId}/values/Paiement!${colLetter}1:${colLetter}1?valueInputOption=RAW`, 'PUT', {
          values: [['notes']],
        });
      }

      // Bold the new header cells
      const spreadsheet = await sheetsRequest(`/${spreadsheetId}?includeGridData=false`);
      const formatRequests: any[] = [];

      const prestationSheet = spreadsheet.sheets.find((s: any) => s.properties.title === 'Prestation');
      if (prestationSheet) {
        const updatedHeaders = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent('Prestation!1:1')}`);
        const notesIdx = updatedHeaders.values?.[0]?.findIndex((h: string) => String(h).toLowerCase() === 'notes');
        if (notesIdx !== undefined && notesIdx >= 0) {
          formatRequests.push({
            repeatCell: {
              range: {
                sheetId: prestationSheet.properties.sheetId,
                startRowIndex: 0, endRowIndex: 1,
                startColumnIndex: notesIdx, endColumnIndex: notesIdx + 1,
              },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          });
        }
      }

      const paiementSheet = spreadsheet.sheets.find((s: any) => s.properties.title === 'Paiement');
      if (paiementSheet) {
        const updatedHeaders = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent('Paiement!1:1')}`);
        const notesIdx = updatedHeaders.values?.[0]?.findIndex((h: string) => String(h).toLowerCase() === 'notes');
        if (notesIdx !== undefined && notesIdx >= 0) {
          formatRequests.push({
            repeatCell: {
              range: {
                sheetId: paiementSheet.properties.sheetId,
                startRowIndex: 0, endRowIndex: 1,
                startColumnIndex: notesIdx, endColumnIndex: notesIdx + 1,
              },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          });
        }
      }

      if (formatRequests.length > 0) {
        await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
          requests: formatRequests,
        });
      }
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/**
 * Ensure the _Meta sheet exists. For spreadsheets created before the migration
 * framework, this bootstraps the _Meta sheet with version 0 (all migrations pending).
 */
async function ensureMetaSheet(spreadsheetId: string): Promise<void> {
  const spreadsheet = await sheetsRequest(`/${spreadsheetId}?includeGridData=false`);
  const sheets = spreadsheet.sheets || [];
  if (sheets.some((s: any) => s.properties.title === '_Meta')) return;

  await sheetsRequest(`/${spreadsheetId}:batchUpdate`, 'POST', {
    requests: [{
      addSheet: {
        properties: { title: '_Meta', hidden: true },
      },
    }],
  });

  await sheetsRequest(`/${spreadsheetId}/values/_Meta!A1:B2?valueInputOption=RAW`, 'PUT', {
    values: [['key', 'value'], ['schema_version', '0']],
  });
}

/**
 * Read the current schema version from the _Meta sheet.
 */
async function getSchemaVersion(spreadsheetId: string): Promise<number> {
  try {
    const response = await sheetsRequest(`/${spreadsheetId}/values/${encodeURIComponent('_Meta!A2:B')}`);
    const rows = response.values || [];
    for (const row of rows) {
      if (String(row[0]).trim().toLowerCase() === 'schema_version') {
        return parseInt(String(row[1] || '0'), 10) || 0;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Update the schema version in the _Meta sheet.
 */
async function setSchemaVersion(spreadsheetId: string, version: number): Promise<void> {
  await sheetsRequest(`/${spreadsheetId}/values/_Meta!B2?valueInputOption=RAW`, 'PUT', {
    values: [[String(version)]],
  });
}

/**
 * Run all pending schema migrations.
 * Reads the current version from _Meta, runs only newer migrations in order,
 * and updates the version after each successful migration.
 * Automatically creates a backup before running any migration.
 */
export async function runMigrations(spreadsheetId: string): Promise<void> {
  await ensureMetaSheet(spreadsheetId);

  const currentVersion = await getSchemaVersion(spreadsheetId);
  const pending = MIGRATIONS.filter(m => m.version > currentVersion);

  if (pending.length === 0) {
    console.log(`Schema is up to date (version ${currentVersion})`);
    return;
  }

  console.log(`Schema version ${currentVersion} -> ${LATEST_SCHEMA_VERSION}: ${pending.length} migration(s) to run`);

  // Create a backup before running migrations
  const config = loadConfig();
  if (config?.folderComptabiliteId) {
    try {
      const backup = await createBackup(spreadsheetId, config.folderComptabiliteId);
      console.log(`Pre-migration backup created: ${backup.name}`);
    } catch (error) {
      console.warn('Failed to create pre-migration backup, proceeding anyway:', error);
    }
  }

  for (const migration of pending) {
    console.log(`Running migration v${migration.version}: ${migration.name}`);
    await migration.run(spreadsheetId);
    await setSchemaVersion(spreadsheetId, migration.version);
    console.log(`Migration v${migration.version} completed`);
  }

  // Invalidate column map cache since migrations may have changed sheet structure
  clearColumnMapCache();
}

/**
 * Detect a JiCompta setup inside a known folder (by ID and name).
 */
async function detectSetupInFolder(folderComptabiliteId: string, folderName: string): Promise<SetupConfig | null> {
  // Search for "Compta" spreadsheet in the folder
  const spreadsheetQuery = `name='Compta' and '${folderComptabiliteId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const spreadsheetResponse = await driveRequest(`/files?q=${encodeURIComponent(spreadsheetQuery)}&fields=files(id,name,createdTime)`);

  if (!spreadsheetResponse.files || spreadsheetResponse.files.length === 0) {
    return null;
  }

  const spreadsheetId = spreadsheetResponse.files[0].id;

  // Find subfolders (Factures, Recus, Modeles)
  const subfolderQuery = `'${folderComptabiliteId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const subfoldersResponse = await driveRequest(`/files?q=${encodeURIComponent(subfolderQuery)}&fields=files(id,name)`);

  const facturesFolder = subfoldersResponse.files?.find((f: any) => f.name === 'Factures');
  const recusFolder = subfoldersResponse.files?.find((f: any) => f.name === 'Recus');
  const templatesFolder = subfoldersResponse.files?.find((f: any) => f.name === 'Modeles');

  if (!facturesFolder || !recusFolder || !templatesFolder) {
    return null;
  }

  // Find templates in Modeles folder
  const templateQuery = `'${templatesFolder.id}' in parents and name contains 'Modèle' and mimeType='application/vnd.google-apps.document' and trashed=false`;
  const templatesResponse = await driveRequest(`/files?q=${encodeURIComponent(templateQuery)}&fields=files(id,name)`);

  const factureTemplate = templatesResponse.files?.find((f: any) => f.name.includes('Facture'));
  const recuTemplate = templatesResponse.files?.find((f: any) => f.name.includes('Reçu'));

  if (!factureTemplate || !recuTemplate) {
    return null;
  }

  return {
    spreadsheetId,
    templateFactureId: factureTemplate.id,
    templateRecuId: recuTemplate.id,
    folderComptabiliteId,
    folderFacturesId: facturesFolder.id,
    folderRecusId: recusFolder.id,
    setupDate: spreadsheetResponse.files[0].createdTime,
    version: '1.0',
    folderName,
  };
}

/**
 * Check if a JiCompta setup already exists in the user's Drive (by folder name).
 */
export async function checkExistingSetup(folderName: string = 'Comptabilite'): Promise<SetupConfig | null> {
  try {
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const folderResponse = await driveRequest(`/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name)`);

    if (!folderResponse.files || folderResponse.files.length === 0) {
      return null;
    }

    return await detectSetupInFolder(folderResponse.files[0].id, folderName);
  } catch (error) {
    console.error('Error checking existing setup:', error);
    return null;
  }
}

/**
 * Check if a JiCompta setup exists in a specific Drive folder (by folder ID).
 */
export async function checkExistingSetupById(folderId: string): Promise<SetupConfig | null> {
  try {
    // Get the folder name from Drive
    const folderInfo = await driveRequest(`/files/${folderId}?fields=name`);
    if (!folderInfo?.name) {
      return null;
    }

    return await detectSetupInFolder(folderId, folderInfo.name);
  } catch (error) {
    console.error('Error checking existing setup by ID:', error);
    return null;
  }
}

/**
 * Perform complete automatic setup
 */
export async function autoSetup(
  folderName: string = 'Comptabilite',
  onProgress?: (step: string, progress: number) => void
): Promise<SetupConfig> {
  try {
    // Step 1: Create folders
    onProgress?.('Création de la structure de dossiers...', 20);
    const folders = await createFolderStructure(folderName);

    // Step 2: Create spreadsheet
    onProgress?.('Création du tableur Compta...', 40);
    const spreadsheetId = await createSpreadsheet(folders.folderComptabiliteId);

    // Step 3: Create facture template
    onProgress?.('Création du template de facture...', 60);
    const templateFactureId = await createTemplate('facture', folders.folderTemplatesId);

    // Step 4: Create reçu template
    onProgress?.('Création du template de reçu...', 80);
    const templateRecuId = await createTemplate('recu', folders.folderTemplatesId);

    onProgress?.('Configuration terminée!', 100);

    const config: SetupConfig = {
      spreadsheetId,
      templateFactureId,
      templateRecuId,
      folderComptabiliteId: folders.folderComptabiliteId,
      folderFacturesId: folders.folderFacturesId,
      folderRecusId: folders.folderRecusId,
      setupDate: new Date().toISOString(),
      version: '1.0',
      folderName,
    };

    return config;
  } catch (error) {
    console.error('Auto setup failed:', error);
    throw error;
  }
}

/**
 * Load config from localStorage
 */
export function loadConfig(): SetupConfig | null {
  const stored = localStorage.getItem('jicompta_config');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse stored config:', error);
    return null;
  }
}

/**
 * Get a specific config value
 */
export function getConfigValue(key: keyof SetupConfig): string {
  const config = loadConfig();
  if (!config) {
    throw new Error('Configuration not found. Please run setup first.');
  }
  const value = config[key];
  if (!value) {
    throw new Error(`Configuration value '${key}' not found.`);
  }
  return String(value);
}

// ==================== REPOSITORY LIST MANAGEMENT ====================

const REPOSITORIES_STORAGE_KEY = 'jicompta_repositories';

/**
 * Load the list of known repositories from localStorage.
 * Ensures backward compatibility: if no list exists but a config does,
 * bootstraps the list with that config.
 */
export function loadRepositories(): SetupConfig[] {
  const stored = localStorage.getItem(REPOSITORIES_STORAGE_KEY);
  if (stored) {
    try {
      const repos = JSON.parse(stored) as SetupConfig[];
      // Backward compat: ensure all entries have folderName
      return repos.map(r => ({ ...r, folderName: r.folderName || 'Comptabilite' }));
    } catch {
      // corrupted, fall through
    }
  }

  // Bootstrap from current config if it exists
  const currentConfig = loadConfig();
  if (currentConfig) {
    const config = { ...currentConfig, folderName: currentConfig.folderName || 'Comptabilite' };
    localStorage.setItem(REPOSITORIES_STORAGE_KEY, JSON.stringify([config]));
    return [config];
  }

  return [];
}

/**
 * Save the repository list to localStorage.
 */
export function saveRepositories(repos: SetupConfig[]): void {
  localStorage.setItem(REPOSITORIES_STORAGE_KEY, JSON.stringify(repos));
}

/**
 * Add a repository to the list (avoids duplicates by folderComptabiliteId).
 */
export function addRepository(config: SetupConfig): SetupConfig[] {
  const repos = loadRepositories();
  const existing = repos.findIndex(r => r.folderComptabiliteId === config.folderComptabiliteId);
  if (existing >= 0) {
    repos[existing] = config;
  } else {
    repos.push(config);
  }
  saveRepositories(repos);
  return repos;
}

/**
 * Remove a repository from the list by folderComptabiliteId.
 */
export function removeRepository(folderComptabiliteId: string): SetupConfig[] {
  const repos = loadRepositories().filter(r => r.folderComptabiliteId !== folderComptabiliteId);
  saveRepositories(repos);
  return repos;
}

/**
 * Backup interface
 */
export interface Backup {
  id: string;
  name: string;
  createdTime: string;
  date: string; // YYMMDD format extracted from name
  time: string; // HHMMSS format extracted from name
}

/**
 * Create a backup of the spreadsheet
 * Backup name format: compta_backup_YYMMDD_HHMMSS
 */
export async function createBackup(spreadsheetId: string, parentFolderId: string): Promise<Backup> {
  // Generate backup name with current date and time
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hours}${minutes}${seconds}`;
  const backupName = `compta_backup_${dateStr}_${timeStr}`;

  console.log(`Creating backup: ${backupName}`);

  // Copy the spreadsheet
  const copyResult = await driveRequest(
    `/files/${spreadsheetId}/copy`,
    'POST',
    {
      name: backupName,
      parents: [parentFolderId],
    }
  );

  console.log(`Backup created with ID: ${copyResult.id}`);

  return {
    id: copyResult.id,
    name: backupName,
    createdTime: copyResult.createdTime || new Date().toISOString(),
    date: dateStr,
    time: timeStr,
  };
}

/**
 * List all backups in the Comptabilite folder
 * Returns backups sorted by date (newest first)
 */
export async function listBackups(parentFolderId: string): Promise<Backup[]> {
  console.log(`Listing backups in folder: ${parentFolderId}`);

  // Search for files with name starting with "compta_backup_"
  const query = `name contains 'compta_backup_' and '${parentFolderId}' in parents and trashed=false`;
  const result = await driveRequest(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)&orderBy=createdTime desc`
  );

  const backups: Backup[] = (result.files || []).map((file: any) => {
    // Extract date and time from name (compta_backup_YYMMDD_HHMMSS)
    const match = file.name.match(/compta_backup_(\d{6})_(\d{6})/);
    const date = match ? match[1] : '';
    const time = match ? match[2] : '';

    return {
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      date,
      time,
    };
  });

  console.log(`Found ${backups.length} backup(s)`);
  return backups;
}

/**
 * Restore data from a backup
 * This copies all data from the backup spreadsheet to the current spreadsheet
 */
export async function restoreFromBackup(backupId: string, currentSpreadsheetId: string): Promise<void> {
  console.log(`Restoring from backup ${backupId} to ${currentSpreadsheetId}`);

  // Get all sheets from the backup
  const backupData = await sheetsRequest(`/${backupId}?includeGridData=false`);
  const sheets = backupData.sheets || [];

  // For each sheet, get the data and copy it to the current spreadsheet
  for (const sheet of sheets) {
    const sheetName = sheet.properties.title;
    console.log(`Restoring sheet: ${sheetName}`);

    // Get data from backup
    const backupSheetData = await sheetsRequest(
      `/${backupId}/values/${encodeURIComponent(sheetName)}`
    );

    if (!backupSheetData.values || backupSheetData.values.length === 0) {
      console.log(`Sheet ${sheetName} is empty, skipping`);
      continue;
    }

    // Clear current sheet first
    await sheetsRequest(
      `/${currentSpreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`,
      'POST',
      {}
    );

    // Write backup data to current sheet
    await sheetsRequest(
      `/${currentSpreadsheetId}/values/${encodeURIComponent(sheetName)}?valueInputOption=RAW`,
      'PUT',
      {
        range: sheetName,
        values: backupSheetData.values,
      }
    );

    console.log(`Sheet ${sheetName} restored successfully`);
  }

  console.log('Backup restoration complete');
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<void> {
  console.log(`Deleting backup: ${backupId}`);

  await driveRequest(`/files/${backupId}`, 'DELETE');

  console.log('Backup deleted successfully');
}

/**
 * Google Setup Service
 * Automatically creates all required Google Drive resources for a new user
 */

import { loadAuthData } from './googleAuth';

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
export async function createFolderStructure(): Promise<{
  folderComptabiliteId: string;
  folderFacturesId: string;
  folderRecusId: string;
  folderTemplatesId: string;
}> {
  // Create main Comptabilite folder
  const folderComptabiliteId = await createFolder('Comptabilite');

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
          title: 'TypesPrestations',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Prestations',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Paiements',
          gridProperties: {
            frozenRowCount: 1,
          },
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
      range: 'Clients!A1:F1',
      values: [['nom', 'email', 'telephone', 'adresse', 'numero_siret', 'commentaires']],
    },
    {
      range: 'TypesPrestations!A1:C1',
      values: [['nom', 'description', 'tarif_defaut']],
    },
    {
      range: 'Prestations!A1:F1',
      values: [['date', 'nom_client', 'type_prestation', 'montant', 'commentaires', 'paiement_id']],
    },
    {
      range: 'Paiements!A1:G1',
      values: [['reference', 'client', 'total', 'date_encaissement', 'mode_encaissement', 'facture', 'recu']],
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

/**
 * Check if a ComptaClaude setup already exists in the user's Drive
 */
export async function checkExistingSetup(): Promise<SetupConfig | null> {
  try {
    // Search for Comptabilite folder first
    const folderQuery = `name='Comptabilite' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const folderResponse = await driveRequest(`/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name)`);

    if (!folderResponse.files || folderResponse.files.length === 0) {
      return null;
    }

    const folderComptabiliteId = folderResponse.files[0].id;

    // Search for "Compta" spreadsheet in Comptabilite folder
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
    };
  } catch (error) {
    console.error('Error checking existing setup:', error);
    return null;
  }
}

/**
 * Perform complete automatic setup
 */
export async function autoSetup(
  onProgress?: (step: string, progress: number) => void
): Promise<SetupConfig> {
  try {
    // Step 1: Create folders
    onProgress?.('Création de la structure de dossiers...', 20);
    const folders = await createFolderStructure();

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
  const stored = localStorage.getItem('comptaclaude_config');
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

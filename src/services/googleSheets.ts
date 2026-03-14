/**
 * Google Sheets Integration Service
 * Handles reading and writing data to Google Sheets
 */

import { getAccessToken } from './googleAuth';
import { getConfigValue } from './googleSetup';
import { SHEET_TABS } from '@/constants';
import type {
  Client,
  TypePrestation,
  Prestation,
  Paiement,
  Depense,
  GoogleSheetsResponse,
} from '@/types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Make a request to Google Sheets API
 */
async function sheetsRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const spreadsheetId = getConfigValue('spreadsheetId');
  const url = `${BASE_URL}/${spreadsheetId}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
}

/**
 * Read values from a range
 */
async function readRange(range: string): Promise<unknown[][]> {
  try {
    const response = await sheetsRequest<{ values?: unknown[][] }>(
      `/values/${encodeURIComponent(range)}`
    );
    return response.values || [];
  } catch (error) {
    console.error('Error reading range:', error);
    throw error;
  }
}

/**
 * Write values to a range
 */
async function writeRange(range: string, values: unknown[][]): Promise<void> {
  try {
    await sheetsRequest(
      `/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      'PUT',
      { values }
    );
  } catch (error) {
    console.error('Error writing range:', error);
    throw error;
  }
}

/**
 * Append values to a sheet
 */
async function appendRange(range: string, values: unknown[][]): Promise<void> {
  try {
    const response = await sheetsRequest(
      `/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`,
      'POST',
      { values }
    );

    // Log where the data was appended
    if (response.updates?.updatedRange) {
      console.log(`✅ Appended data to: ${response.updates.updatedRange}`);
    }
  } catch (error) {
    console.error('Error appending range:', error);
    throw error;
  }
}

// ==================== CLIENTS ====================

/**
 * Get all clients
 */
export async function getClients(): Promise<GoogleSheetsResponse<Client>> {
  try {
    const range = `${SHEET_TABS.CLIENTS}!A2:E`;
    const rows = await readRange(range);

    const clients: Client[] = [];

    rows.forEach((row, index) => {
      // Skip empty rows
      if (!(row[0] || row[1])) {
        return;
      }

      clients.push({
        nom: String(row[0] || ''),
        email: String(row[1] || ''),
        telephone: row[2] ? String(row[2]) : undefined,
        adresse: row[3] ? String(row[3]) : undefined,
        numero_siret: row[4] ? String(row[4]) : undefined,
        _rowNumber: index,
      });
    });

    return { data: clients };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

/**
 * Add a new client
 */
export async function addClient(client: Client): Promise<void> {
  const range = `${SHEET_TABS.CLIENTS}!A:E`;
  const values = [[
    client.nom,
    client.email,
    client.telephone || '',
    client.adresse || '',
    client.numero_siret || '',
  ]];

  await appendRange(range, values);
}

/**
 * Update a client (by row index, 0-based)
 */
export async function updateClient(rowIndex: number, client: Client): Promise<void> {
  const range = `${SHEET_TABS.CLIENTS}!A${rowIndex + 2}:E${rowIndex + 2}`;
  const values = [[
    client.nom,
    client.email,
    client.telephone || '',
    client.adresse || '',
    client.numero_siret || '',
  ]];

  await writeRange(range, values);
}

/**
 * Delete a client (by setting empty values)
 */
export async function deleteClient(rowIndex: number): Promise<void> {
  const range = `${SHEET_TABS.CLIENTS}!A${rowIndex + 2}:E${rowIndex + 2}`;
  const values = [['', '', '', '', '']];
  await writeRange(range, values);
}

// ==================== TYPE PRESTATION ====================

/**
 * Get all type prestations
 */
export async function getTypesPrestations(): Promise<GoogleSheetsResponse<TypePrestation>> {
  try {
    const range = `${SHEET_TABS.TYPE_PRESTATION}!A2:B`;
    const rows = await readRange(range);

    const types: TypePrestation[] = [];

    rows.forEach((row, index) => {
      // Skip empty rows
      if (!(row[0])) {
        return;
      }

      types.push({
        nom: String(row[0] || ''),
        montant_suggere: parseFloat(String(row[1] || '0')),
        _rowNumber: index,
      });
    });

    return { data: types };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

/**
 * Add a new type prestation
 */
export async function addTypePrestation(type: TypePrestation): Promise<void> {
  const range = `${SHEET_TABS.TYPE_PRESTATION}!A:B`;
  const values = [[type.nom, type.montant_suggere]];
  await appendRange(range, values);
}

/**
 * Update a type prestation
 */
export async function updateTypePrestation(
  rowIndex: number,
  type: TypePrestation
): Promise<void> {
  const range = `${SHEET_TABS.TYPE_PRESTATION}!A${rowIndex + 2}:B${rowIndex + 2}`;
  const values = [[type.nom, type.montant_suggere]];
  await writeRange(range, values);
}

/**
 * Delete a type prestation
 */
export async function deleteTypePrestation(rowIndex: number): Promise<void> {
  const range = `${SHEET_TABS.TYPE_PRESTATION}!A${rowIndex + 2}:B${rowIndex + 2}`;
  const values = [['', '']];
  await writeRange(range, values);
}

// ==================== PRESTATIONS ====================

/**
 * Get all prestations
 */
export async function getPrestations(): Promise<GoogleSheetsResponse<Prestation>> {
  try {
    const range = `${SHEET_TABS.PRESTATION}!A2:F`;
    const rows = await readRange(range);

    const prestations: Prestation[] = [];

    rows.forEach((row, index) => {
      // Filter out empty rows (rows where all required fields are empty)
      if (!(row[0] || row[1] || row[2] || row[3])) {
        return; // Skip empty rows
      }

      // More robust handling of the associatif field
      const associatifValue = row[5];
      let associatif = false;

      if (associatifValue !== undefined && associatifValue !== null && associatifValue !== '') {
        const valueStr = String(associatifValue).trim().toUpperCase();
        associatif = valueStr === 'TRUE' || valueStr === '1' || associatifValue === true;

        // Debug log for associative prestations
        if (associatif) {
          console.log(`✅ Prestation associative (row ${index + 2}):`, {
            client: String(row[1] || ''),
            type: String(row[2] || ''),
            montant: parseFloat(String(row[3] || '0')),
            associatifValue,
            associatif,
          });
        }
      }

      prestations.push({
        date: String(row[0] || ''),
        nom_client: String(row[1] || ''),
        type_prestation: String(row[2] || ''),
        montant: parseFloat(String(row[3] || '0')),
        paiement_id: row[4] ? String(row[4]) : undefined,
        associatif,
        _rowNumber: index, // Store the actual row index from the sheet (0-based)
      });
    });

    return { data: prestations };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

/**
 * Add a new prestation
 */
export async function addPrestation(prestation: Prestation): Promise<void> {
  const range = `${SHEET_TABS.PRESTATION}!A:F`;
  const values = [[
    prestation.date,
    prestation.nom_client,
    prestation.type_prestation,
    prestation.montant,
    prestation.paiement_id || '',
    prestation.associatif ? 'TRUE' : 'FALSE',
  ]];
  await appendRange(range, values);
}

/**
 * Update a prestation
 */
export async function updatePrestation(
  rowIndex: number,
  prestation: Prestation
): Promise<void> {
  const range = `${SHEET_TABS.PRESTATION}!A${rowIndex + 2}:F${rowIndex + 2}`;
  const values = [[
    prestation.date,
    prestation.nom_client,
    prestation.type_prestation,
    prestation.montant,
    prestation.paiement_id || '',
    prestation.associatif ? 'TRUE' : 'FALSE',
  ]];
  await writeRange(range, values);
}

/**
 * Delete a prestation
 */
export async function deletePrestation(rowIndex: number): Promise<void> {
  const range = `${SHEET_TABS.PRESTATION}!A${rowIndex + 2}:F${rowIndex + 2}`;
  const values = [['', '', '', '', '', '']];
  await writeRange(range, values);
}

/**
 * Update payment ID for multiple prestations
 */
export async function updatePrestationsPaiementId(
  rowIndices: number[],
  paiementId: string
): Promise<void> {
  // Batch update
  const requests = rowIndices.map((rowIndex) => ({
    range: `${SHEET_TABS.PRESTATION}!E${rowIndex + 2}`,
    values: [[paiementId]],
  }));

  await sheetsRequest(
    '/values:batchUpdate',
    'POST',
    {
      valueInputOption: 'RAW',
      data: requests,
    }
  );
}

// ==================== PAIEMENTS ====================

/**
 * Get all paiements
 */
export async function getPaiements(): Promise<GoogleSheetsResponse<Paiement>> {
  try {
    const range = `${SHEET_TABS.PAIEMENT}!A2:G`;
    const rows = await readRange(range);

    const paiements: Paiement[] = [];

    rows.forEach((row, index) => {
      // Skip empty rows
      if (!(row[0] || row[1])) {
        return;
      }

      paiements.push({
        reference: String(row[0] || ''),
        client: String(row[1] || ''),
        total: parseFloat(String(row[2] || '0')),
        date_encaissement: row[3] ? String(row[3]) : undefined,
        mode_encaissement: row[4] ? String(row[4]) as any : undefined,
        facture: row[5] ? String(row[5]) : undefined,
        recu: row[6] ? String(row[6]) : undefined,
        _rowNumber: index,
      });
    });

    return { data: paiements };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

/**
 * Add a new paiement
 */
export async function addPaiement(paiement: Paiement): Promise<void> {
  const range = `${SHEET_TABS.PAIEMENT}!A:G`;
  const values = [[
    paiement.reference,
    paiement.client,
    paiement.total,
    paiement.date_encaissement || '',
    paiement.mode_encaissement || '',
    paiement.facture || '',
    paiement.recu || '',
  ]];
  await appendRange(range, values);
}

/**
 * Update a paiement
 */
export async function updatePaiement(rowIndex: number, paiement: Paiement): Promise<void> {
  const range = `${SHEET_TABS.PAIEMENT}!A${rowIndex + 2}:G${rowIndex + 2}`;
  const values = [[
    paiement.reference,
    paiement.client,
    paiement.total,
    paiement.date_encaissement || '',
    paiement.mode_encaissement || '',
    paiement.facture || '',
    paiement.recu || '',
  ]];
  await writeRange(range, values);
}

/**
 * Delete a paiement
 */
export async function deletePaiement(rowIndex: number): Promise<void> {
  const range = `${SHEET_TABS.PAIEMENT}!A${rowIndex + 2}:G${rowIndex + 2}`;
  const values = [['', '', '', '', '', '', '']];
  await writeRange(range, values);
}

// ==================== DEPENSES ====================

/**
 * Get all depenses
 */
export async function getDepenses(): Promise<GoogleSheetsResponse<Depense>> {
  try {
    const range = `${SHEET_TABS.DEPENSE}!A2:D`;
    const rows = await readRange(range);

    const depenses: Depense[] = [];

    rows.forEach((row, index) => {
      // Skip empty rows
      if (!(row[0] || row[1] || row[2])) {
        return;
      }

      depenses.push({
        date: String(row[0] || ''),
        compte: String(row[1] || ''),
        montant: parseFloat(String(row[2] || '0')),
        description: String(row[3] || ''),
        _rowNumber: index,
      });
    });

    return { data: depenses };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

/**
 * Add a new depense
 */
export async function addDepense(depense: Depense): Promise<void> {
  const range = `${SHEET_TABS.DEPENSE}!A:D`;
  const values = [[
    depense.date,
    depense.compte,
    depense.montant,
    depense.description,
  ]];
  await appendRange(range, values);
}

/**
 * Update a depense
 */
export async function updateDepense(rowIndex: number, depense: Depense): Promise<void> {
  const range = `${SHEET_TABS.DEPENSE}!A${rowIndex + 2}:D${rowIndex + 2}`;
  const values = [[
    depense.date,
    depense.compte,
    depense.montant,
    depense.description,
  ]];
  await writeRange(range, values);
}

/**
 * Delete a depense
 */
export async function deleteDepense(rowIndex: number): Promise<void> {
  const range = `${SHEET_TABS.DEPENSE}!A${rowIndex + 2}:D${rowIndex + 2}`;
  const values = [['', '', '', '']];
  await writeRange(range, values);
}

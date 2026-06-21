/**
 * Google Sheets Integration Service
 * Handles reading and writing data to Google Sheets
 *
 * Uses header-based column resolution: reads column names from the header row
 * to map data by name instead of position, ensuring forward/backward compatibility.
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
  JournalLogEntry,
  GoogleSheetsResponse,
} from '@/types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// ==================== COLUMN MAP INFRASTRUCTURE ====================

type ColumnMap = Record<string, number>;

/** Cache of column maps per sheet tab, populated on first read */
const columnMapCache: Record<string, ColumnMap> = {};

/**
 * Convert a 0-based column index to a letter (0=A, 1=B, ..., 25=Z)
 */
function columnLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Read a sheet including its header row, build a column map, and return data rows.
 * The column map is cached for subsequent write operations.
 */
async function readSheetWithHeaders(sheetTab: string): Promise<{
  columns: ColumnMap;
  rows: unknown[][];
}> {
  const allRows = await readRange(`${sheetTab}!A1:Z`);

  if (allRows.length === 0) {
    return { columns: {}, rows: [] };
  }

  const headers = allRows[0].map(h => String(h).trim().toLowerCase());
  const columns: ColumnMap = {};
  headers.forEach((h, i) => {
    if (h) columns[h] = i;
  });

  columnMapCache[sheetTab] = columns;

  return {
    columns,
    rows: allRows.slice(1),
  };
}

/**
 * Get the column map for a sheet tab.
 * Returns cached map if available, otherwise reads the header row.
 */
async function getColumnMap(sheetTab: string): Promise<ColumnMap> {
  if (columnMapCache[sheetTab]) {
    return columnMapCache[sheetTab];
  }

  const headerRows = await readRange(`${sheetTab}!1:1`);
  if (headerRows.length === 0 || headerRows[0].length === 0) {
    throw new Error(`Sheet "${sheetTab}" has no headers`);
  }

  const headers = headerRows[0].map(h => String(h).trim().toLowerCase());
  const columns: ColumnMap = {};
  headers.forEach((h, i) => {
    if (h) columns[h] = i;
  });

  columnMapCache[sheetTab] = columns;
  return columns;
}

/**
 * Clear the column map cache (e.g., after migrations modify sheet structure)
 */
export function clearColumnMapCache(): void {
  for (const key of Object.keys(columnMapCache)) {
    delete columnMapCache[key];
  }
}

// ---- Cell accessors ----

function getCellString(row: unknown[], columns: ColumnMap, colName: string, fallback = ''): string {
  const idx = columns[colName];
  if (idx === undefined) return fallback;
  const val = row[idx];
  return val !== undefined && val !== null && val !== '' ? String(val) : fallback;
}

function getCellOptionalString(row: unknown[], columns: ColumnMap, colName: string): string | undefined {
  const idx = columns[colName];
  if (idx === undefined) return undefined;
  const val = row[idx];
  return val !== undefined && val !== null && val !== '' ? String(val) : undefined;
}

function getCellNumber(row: unknown[], columns: ColumnMap, colName: string, fallback = 0): number {
  const idx = columns[colName];
  if (idx === undefined) return fallback;
  const num = parseFloat(String(row[idx] || '0'));
  return isNaN(num) ? fallback : num;
}

function getCellBoolean(row: unknown[], columns: ColumnMap, colName: string): boolean {
  const idx = columns[colName];
  if (idx === undefined) return false;
  const val = row[idx];
  if (val === undefined || val === null || val === '') return false;
  const str = String(val).trim().toUpperCase();
  return str === 'TRUE' || str === '1' || val === true;
}

// ---- Row builders for writes ----

/**
 * Build a row array that places values in the correct column positions
 * based on the column map. Unknown columns in `data` are silently ignored.
 */
function buildRow(columns: ColumnMap, data: Record<string, unknown>): unknown[] {
  const maxCol = Math.max(...Object.values(columns), -1);
  const row = new Array(maxCol + 1).fill('');
  for (const [colName, value] of Object.entries(data)) {
    const idx = columns[colName];
    if (idx !== undefined) {
      row[idx] = value ?? '';
    }
  }
  return row;
}

/**
 * Build an empty row (for deletion) matching the sheet's column count
 */
function buildEmptyRow(columns: ColumnMap): unknown[] {
  const maxCol = Math.max(...Object.values(columns), -1);
  return new Array(maxCol + 1).fill('');
}

/**
 * Append a row by writing it to an explicit, column-A-anchored range.
 *
 * We deliberately do NOT use the Sheets values.append endpoint here: its
 * table-detection can place appended rows starting at a column other than A
 * (observed in production as rows shifted ~5 columns right, leaving the row
 * unreadable by our header-based column map and invisible in the UI). Writing
 * to an explicit `A{n}:{lastCol}{n}` range makes placement deterministic.
 */
async function appendRowSafely(sheetTab: string, row: unknown[]): Promise<void> {
  const lastCol = columnLetter(Math.max(row.length - 1, 0));
  // Count existing rows (header + data; the API trims trailing empties).
  const existing = await readRange(`${sheetTab}!A1:Z`);
  const nextRow = existing.length + 1; // 1-based row number to write into
  await writeRange(`${sheetTab}!A${nextRow}:${lastCol}${nextRow}`, [row]);
}

/**
 * Get the range for a specific row (e.g., "Clients!A2:E2")
 */
function getRowRange(sheetTab: string, columns: ColumnMap, rowIndex: number): string {
  const maxCol = Math.max(...Object.values(columns), -1);
  return `${sheetTab}!A${rowIndex + 2}:${columnLetter(maxCol)}${rowIndex + 2}`;
}

/**
 * Get the cell reference for a specific column and row (e.g., "Prestation!E3")
 */
function getCellReference(sheetTab: string, columns: ColumnMap, colName: string, rowIndex: number): string {
  const idx = columns[colName];
  if (idx === undefined) {
    throw new Error(`Column "${colName}" not found in sheet "${sheetTab}"`);
  }
  return `${sheetTab}!${columnLetter(idx)}${rowIndex + 2}`;
}

// ==================== LOW-LEVEL API ====================

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

// ==================== JOURNAL ====================

type JournalAction = 'AJOUT' | 'MODIFICATION' | 'SUPPRESSION';

interface JournalEntry {
  action: JournalAction;
  entite: string;
  identifiant: string;
  description: string;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
}

/** Convert a raw row + column map to a plain key-value object */
function rowToObject(row: unknown[], columns: ColumnMap): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, idx] of Object.entries(columns)) {
    obj[key] = row[idx] ?? '';
  }
  return obj;
}

/** Read the current state of a data row as a plain object (for before-snapshots) */
async function readRowAsObject(sheetTab: string, rowIndex: number): Promise<Record<string, unknown>> {
  const columns = await getColumnMap(sheetTab);
  const range = getRowRange(sheetTab, columns, rowIndex);
  const rows = await readRange(range);
  if (rows.length === 0) return {};
  return rowToObject(rows[0], columns);
}

/**
 * Append an entry to the Journal sheet.
 * Failures are silently swallowed so a logging error never blocks a real operation.
 */
async function appendJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      entry.action,
      entry.entite,
      entry.identifiant,
      entry.description,
      entry.avant ? JSON.stringify(entry.avant) : '',
      entry.apres ? JSON.stringify(entry.apres) : '',
    ];
    await appendRowSafely(SHEET_TABS.JOURNAL, row);
  } catch {
    // Journal writes must never break normal operations
  }
}

/** Parse a JSON snapshot cell into an object, tolerating empty/invalid values */
function parseSnapshot(value: string): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Read all journal entries, most recent first.
 */
export async function getJournal(): Promise<GoogleSheetsResponse<JournalLogEntry>> {
  try {
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.JOURNAL);

    const entries: JournalLogEntry[] = [];

    rows.forEach((row) => {
      const timestamp = getCellString(row, columns, 'timestamp');
      const action = getCellString(row, columns, 'action');
      if (!timestamp && !action) return;

      entries.push({
        timestamp,
        action: (action || 'MODIFICATION') as JournalLogEntry['action'],
        entite: getCellString(row, columns, 'entite'),
        identifiant: getCellString(row, columns, 'identifiant'),
        description: getCellString(row, columns, 'description'),
        avant: parseSnapshot(getCellString(row, columns, 'avant')),
        apres: parseSnapshot(getCellString(row, columns, 'apres')),
      });
    });

    // Sheet stores entries chronologically (appended); show newest first
    return { data: entries.reverse() };
  } catch (error) {
    return { data: [], error: String(error) };
  }
}

// ==================== CLIENTS ====================

/**
 * Get all clients
 */
export async function getClients(): Promise<GoogleSheetsResponse<Client>> {
  try {
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.CLIENTS);

    const clients: Client[] = [];

    rows.forEach((row, index) => {
      if (!(getCellString(row, columns, 'nom') || getCellString(row, columns, 'email'))) {
        return;
      }

      clients.push({
        nom: getCellString(row, columns, 'nom'),
        email: getCellString(row, columns, 'email'),
        telephone: getCellOptionalString(row, columns, 'telephone'),
        adresse: getCellOptionalString(row, columns, 'adresse'),
        numero_siret: getCellOptionalString(row, columns, 'numero_siret'),
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
  const columns = await getColumnMap(SHEET_TABS.CLIENTS);
  const row = buildRow(columns, {
    nom: client.nom,
    email: client.email,
    telephone: client.telephone || '',
    adresse: client.adresse || '',
    numero_siret: client.numero_siret || '',
  });
  await appendRowSafely(SHEET_TABS.CLIENTS, row);
  await appendJournalEntry({
    action: 'AJOUT',
    entite: 'Client',
    identifiant: client.nom,
    description: `Ajout du client "${client.nom}"`,
    avant: null,
    apres: { nom: client.nom, email: client.email, telephone: client.telephone || '', adresse: client.adresse || '', numero_siret: client.numero_siret || '' },
  });
}

/**
 * Update a client (by row index, 0-based)
 */
export async function updateClient(rowIndex: number, client: Client): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.CLIENTS, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.CLIENTS);
  const row = buildRow(columns, {
    nom: client.nom,
    email: client.email,
    telephone: client.telephone || '',
    adresse: client.adresse || '',
    numero_siret: client.numero_siret || '',
  });
  await writeRange(getRowRange(SHEET_TABS.CLIENTS, columns, rowIndex), [row]);
  await appendJournalEntry({
    action: 'MODIFICATION',
    entite: 'Client',
    identifiant: client.nom,
    description: `Modification du client "${client.nom}"`,
    avant,
    apres: { nom: client.nom, email: client.email, telephone: client.telephone || '', adresse: client.adresse || '', numero_siret: client.numero_siret || '' },
  });
}

/**
 * Delete a client (by setting empty values)
 */
export async function deleteClient(rowIndex: number): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.CLIENTS, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.CLIENTS);
  await writeRange(getRowRange(SHEET_TABS.CLIENTS, columns, rowIndex), [buildEmptyRow(columns)]);
  await appendJournalEntry({
    action: 'SUPPRESSION',
    entite: 'Client',
    identifiant: String(avant['nom'] || rowIndex),
    description: `Suppression du client "${avant['nom'] || rowIndex}"`,
    avant,
    apres: null,
  });
}

// ==================== TYPE PRESTATION ====================

/**
 * Get all type prestations
 */
export async function getTypesPrestations(): Promise<GoogleSheetsResponse<TypePrestation>> {
  try {
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.TYPE_PRESTATION);

    const types: TypePrestation[] = [];

    rows.forEach((row, index) => {
      if (!getCellString(row, columns, 'nom')) {
        return;
      }

      types.push({
        nom: getCellString(row, columns, 'nom'),
        montant_suggere: getCellNumber(row, columns, 'montant_suggere'),
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
  const columns = await getColumnMap(SHEET_TABS.TYPE_PRESTATION);
  const row = buildRow(columns, {
    nom: type.nom,
    montant_suggere: type.montant_suggere,
  });
  await appendRowSafely(SHEET_TABS.TYPE_PRESTATION, row);
  await appendJournalEntry({
    action: 'AJOUT',
    entite: 'TypePrestation',
    identifiant: type.nom,
    description: `Ajout du type de prestation "${type.nom}"`,
    avant: null,
    apres: { nom: type.nom, montant_suggere: type.montant_suggere },
  });
}

/**
 * Update a type prestation
 */
export async function updateTypePrestation(
  rowIndex: number,
  type: TypePrestation
): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.TYPE_PRESTATION, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.TYPE_PRESTATION);
  const row = buildRow(columns, {
    nom: type.nom,
    montant_suggere: type.montant_suggere,
  });
  await writeRange(getRowRange(SHEET_TABS.TYPE_PRESTATION, columns, rowIndex), [row]);
  await appendJournalEntry({
    action: 'MODIFICATION',
    entite: 'TypePrestation',
    identifiant: type.nom,
    description: `Modification du type de prestation "${type.nom}"`,
    avant,
    apres: { nom: type.nom, montant_suggere: type.montant_suggere },
  });
}

/**
 * Delete a type prestation
 */
export async function deleteTypePrestation(rowIndex: number): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.TYPE_PRESTATION, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.TYPE_PRESTATION);
  await writeRange(getRowRange(SHEET_TABS.TYPE_PRESTATION, columns, rowIndex), [buildEmptyRow(columns)]);
  await appendJournalEntry({
    action: 'SUPPRESSION',
    entite: 'TypePrestation',
    identifiant: String(avant['nom'] || rowIndex),
    description: `Suppression du type de prestation "${avant['nom'] || rowIndex}"`,
    avant,
    apres: null,
  });
}

// ==================== PRESTATIONS ====================

/**
 * Get all prestations
 */
export async function getPrestations(): Promise<GoogleSheetsResponse<Prestation>> {
  try {
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.PRESTATION);

    const prestations: Prestation[] = [];

    rows.forEach((row, index) => {
      if (!(getCellString(row, columns, 'date') || getCellString(row, columns, 'nom_client') ||
            getCellString(row, columns, 'type_prestation') || getCellString(row, columns, 'montant'))) {
        return;
      }

      prestations.push({
        date: getCellString(row, columns, 'date'),
        nom_client: getCellString(row, columns, 'nom_client'),
        type_prestation: getCellString(row, columns, 'type_prestation'),
        montant: getCellNumber(row, columns, 'montant'),
        paiement_id: getCellOptionalString(row, columns, 'paiement_id'),
        associatif: getCellBoolean(row, columns, 'associatif'),
        notes: getCellOptionalString(row, columns, 'notes'),
        _rowNumber: index,
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
  const columns = await getColumnMap(SHEET_TABS.PRESTATION);
  const row = buildRow(columns, {
    date: prestation.date,
    nom_client: prestation.nom_client,
    type_prestation: prestation.type_prestation,
    montant: prestation.montant,
    paiement_id: prestation.paiement_id || '',
    associatif: prestation.associatif ? 'TRUE' : 'FALSE',
    notes: prestation.notes || '',
  });
  await appendRowSafely(SHEET_TABS.PRESTATION, row);
  await appendJournalEntry({
    action: 'AJOUT',
    entite: 'Prestation',
    identifiant: `${prestation.nom_client} - ${prestation.date}`,
    description: `Ajout d'une prestation "${prestation.type_prestation}" pour ${prestation.nom_client} le ${prestation.date}`,
    avant: null,
    apres: { date: prestation.date, nom_client: prestation.nom_client, type_prestation: prestation.type_prestation, montant: prestation.montant, paiement_id: prestation.paiement_id || '', associatif: prestation.associatif, notes: prestation.notes || '' },
  });
}

/**
 * Update a prestation
 */
export async function updatePrestation(
  rowIndex: number,
  prestation: Prestation
): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.PRESTATION, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.PRESTATION);
  const row = buildRow(columns, {
    date: prestation.date,
    nom_client: prestation.nom_client,
    type_prestation: prestation.type_prestation,
    montant: prestation.montant,
    paiement_id: prestation.paiement_id || '',
    associatif: prestation.associatif ? 'TRUE' : 'FALSE',
    notes: prestation.notes || '',
  });
  await writeRange(getRowRange(SHEET_TABS.PRESTATION, columns, rowIndex), [row]);
  await appendJournalEntry({
    action: 'MODIFICATION',
    entite: 'Prestation',
    identifiant: `${prestation.nom_client} - ${prestation.date}`,
    description: `Modification d'une prestation "${prestation.type_prestation}" pour ${prestation.nom_client} le ${prestation.date}`,
    avant,
    apres: { date: prestation.date, nom_client: prestation.nom_client, type_prestation: prestation.type_prestation, montant: prestation.montant, paiement_id: prestation.paiement_id || '', associatif: prestation.associatif, notes: prestation.notes || '' },
  });
}

/**
 * Delete a prestation
 */
export async function deletePrestation(rowIndex: number): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.PRESTATION, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.PRESTATION);
  await writeRange(getRowRange(SHEET_TABS.PRESTATION, columns, rowIndex), [buildEmptyRow(columns)]);
  await appendJournalEntry({
    action: 'SUPPRESSION',
    entite: 'Prestation',
    identifiant: `${avant['nom_client'] || ''} - ${avant['date'] || rowIndex}`,
    description: `Suppression d'une prestation "${avant['type_prestation'] || ''}" pour ${avant['nom_client'] || ''} le ${avant['date'] || ''}`,
    avant,
    apres: null,
  });
}

/**
 * Update payment ID for multiple prestations
 */
export async function updatePrestationsPaiementId(
  rowIndices: number[],
  paiementId: string
): Promise<void> {
  const columns = await getColumnMap(SHEET_TABS.PRESTATION);

  const requests = rowIndices.map((rowIndex) => ({
    range: getCellReference(SHEET_TABS.PRESTATION, columns, 'paiement_id', rowIndex),
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
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.PAIEMENT);

    const paiements: Paiement[] = [];

    rows.forEach((row, index) => {
      if (!(getCellString(row, columns, 'reference') || getCellString(row, columns, 'client'))) {
        return;
      }

      paiements.push({
        reference: getCellString(row, columns, 'reference'),
        client: getCellString(row, columns, 'client'),
        total: getCellNumber(row, columns, 'total'),
        date_encaissement: getCellOptionalString(row, columns, 'date_encaissement'),
        mode_encaissement: getCellOptionalString(row, columns, 'mode_encaissement') as Paiement['mode_encaissement'],
        facture: getCellOptionalString(row, columns, 'facture'),
        recu: getCellOptionalString(row, columns, 'recu'),
        notes: getCellOptionalString(row, columns, 'notes'),
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
  const columns = await getColumnMap(SHEET_TABS.PAIEMENT);
  const row = buildRow(columns, {
    reference: paiement.reference,
    client: paiement.client,
    total: paiement.total,
    date_encaissement: paiement.date_encaissement || '',
    mode_encaissement: paiement.mode_encaissement || '',
    facture: paiement.facture || '',
    recu: paiement.recu || '',
    notes: paiement.notes || '',
  });
  await appendRowSafely(SHEET_TABS.PAIEMENT, row);
  await appendJournalEntry({
    action: 'AJOUT',
    entite: 'Paiement',
    identifiant: paiement.reference,
    description: `Ajout du paiement ${paiement.reference} pour ${paiement.client} (${paiement.total} €)`,
    avant: null,
    apres: { reference: paiement.reference, client: paiement.client, total: paiement.total, date_encaissement: paiement.date_encaissement || '', mode_encaissement: paiement.mode_encaissement || '', facture: paiement.facture || '', recu: paiement.recu || '', notes: paiement.notes || '' },
  });
}

/**
 * Update a paiement
 */
export async function updatePaiement(rowIndex: number, paiement: Paiement): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.PAIEMENT, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.PAIEMENT);
  const row = buildRow(columns, {
    reference: paiement.reference,
    client: paiement.client,
    total: paiement.total,
    date_encaissement: paiement.date_encaissement || '',
    mode_encaissement: paiement.mode_encaissement || '',
    facture: paiement.facture || '',
    recu: paiement.recu || '',
    notes: paiement.notes || '',
  });
  await writeRange(getRowRange(SHEET_TABS.PAIEMENT, columns, rowIndex), [row]);
  await appendJournalEntry({
    action: 'MODIFICATION',
    entite: 'Paiement',
    identifiant: paiement.reference,
    description: `Modification du paiement ${paiement.reference} pour ${paiement.client}`,
    avant,
    apres: { reference: paiement.reference, client: paiement.client, total: paiement.total, date_encaissement: paiement.date_encaissement || '', mode_encaissement: paiement.mode_encaissement || '', facture: paiement.facture || '', recu: paiement.recu || '', notes: paiement.notes || '' },
  });
}

/**
 * Delete a paiement
 */
export async function deletePaiement(rowIndex: number): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.PAIEMENT, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.PAIEMENT);
  await writeRange(getRowRange(SHEET_TABS.PAIEMENT, columns, rowIndex), [buildEmptyRow(columns)]);
  await appendJournalEntry({
    action: 'SUPPRESSION',
    entite: 'Paiement',
    identifiant: String(avant['reference'] || rowIndex),
    description: `Suppression du paiement ${avant['reference'] || rowIndex} pour ${avant['client'] || ''}`,
    avant,
    apres: null,
  });
}

// ==================== DEPENSES ====================

/**
 * Get all depenses
 */
export async function getDepenses(): Promise<GoogleSheetsResponse<Depense>> {
  try {
    const { columns, rows } = await readSheetWithHeaders(SHEET_TABS.DEPENSE);

    const depenses: Depense[] = [];

    rows.forEach((row, index) => {
      if (!(getCellString(row, columns, 'date') || getCellString(row, columns, 'compte') ||
            getCellString(row, columns, 'montant'))) {
        return;
      }

      depenses.push({
        date: getCellString(row, columns, 'date'),
        compte: getCellString(row, columns, 'compte'),
        montant: getCellNumber(row, columns, 'montant'),
        description: getCellString(row, columns, 'description'),
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
  const columns = await getColumnMap(SHEET_TABS.DEPENSE);
  const row = buildRow(columns, {
    date: depense.date,
    compte: depense.compte,
    montant: depense.montant,
    description: depense.description,
  });
  await appendRowSafely(SHEET_TABS.DEPENSE, row);
  await appendJournalEntry({
    action: 'AJOUT',
    entite: 'Depense',
    identifiant: `${depense.compte} - ${depense.date}`,
    description: `Ajout d'une dépense "${depense.description}" sur le compte ${depense.compte} le ${depense.date} (${depense.montant} €)`,
    avant: null,
    apres: { date: depense.date, compte: depense.compte, montant: depense.montant, description: depense.description },
  });
}

/**
 * Update a depense
 */
export async function updateDepense(rowIndex: number, depense: Depense): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.DEPENSE, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.DEPENSE);
  const row = buildRow(columns, {
    date: depense.date,
    compte: depense.compte,
    montant: depense.montant,
    description: depense.description,
  });
  await writeRange(getRowRange(SHEET_TABS.DEPENSE, columns, rowIndex), [row]);
  await appendJournalEntry({
    action: 'MODIFICATION',
    entite: 'Depense',
    identifiant: `${depense.compte} - ${depense.date}`,
    description: `Modification d'une dépense "${depense.description}" sur le compte ${depense.compte}`,
    avant,
    apres: { date: depense.date, compte: depense.compte, montant: depense.montant, description: depense.description },
  });
}

/**
 * Delete a depense
 */
export async function deleteDepense(rowIndex: number): Promise<void> {
  const avant = await readRowAsObject(SHEET_TABS.DEPENSE, rowIndex);
  const columns = await getColumnMap(SHEET_TABS.DEPENSE);
  await writeRange(getRowRange(SHEET_TABS.DEPENSE, columns, rowIndex), [buildEmptyRow(columns)]);
  await appendJournalEntry({
    action: 'SUPPRESSION',
    entite: 'Depense',
    identifiant: `${avant['compte'] || ''} - ${avant['date'] || rowIndex}`,
    description: `Suppression d'une dépense "${avant['description'] || ''}" sur le compte ${avant['compte'] || ''}`,
    avant,
    apres: null,
  });
}

/**
 * Google Docs Service
 * Handles PDF generation for factures and reçus
 */

import { loadAuthData } from './googleAuth';
import { getConfigValue } from './googleSetup';
import type { Paiement, Client, Prestation } from '@/types';
import { TEMPLATE_PLACEHOLDERS } from '@/constants';
import { formatDateForDisplay } from '@/utils/dateFormatter';
import { formatCurrency } from '@/utils/currencyFormatter';

const DOCS_API_BASE = 'https://docs.googleapis.com/v1';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

interface DocumentRequest {
  method: string;
  body?: unknown;
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

  // Handle empty responses (like 204 No Content for DELETE)
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
 * Find or create a folder by name in a parent folder
 */
async function findOrCreateFolder(folderName: string, parentFolderId: string): Promise<string> {
  // Search for existing folder
  const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const response = await driveRequest(`/files?q=${encodeURIComponent(query)}&fields=files(id,name)`);

  if (response.files && response.files.length > 0) {
    // Folder exists, return its ID
    return response.files[0].id;
  }

  // Folder doesn't exist, create it
  const createResponse = await driveRequest(`/files`, 'POST', {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  });

  return createResponse.id;
}

/**
 * Copy a Google Doc template
 */
async function copyDocument(templateId: string, name: string, folderId: string): Promise<string> {
  const response = await driveRequest(`/files/${templateId}/copy`, 'POST', {
    name,
    parents: [folderId],
  });

  return response.id;
}

/**
 * Replace placeholders in a Google Doc
 */
async function replaceTextInDocument(documentId: string, replacements: Record<string, string>): Promise<void> {
  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: {
        text: placeholder,
        matchCase: true,
      },
      replaceText: value || '',
    },
  }));

  await docsRequest(`/documents/${documentId}:batchUpdate`, 'POST', {
    requests,
  });
}

/**
 * Export a Google Doc as PDF, save it to Drive, and return viewable URL
 */
async function exportAsPdf(documentId: string, pdfName: string, folderId: string): Promise<string> {
  const user = loadAuthData();
  if (!user) throw new Error('Not authenticated');

  // Step 1: Export the Google Doc as PDF binary
  const exportUrl = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`;
  const exportResponse = await fetch(exportUrl, {
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
    },
  });

  if (!exportResponse.ok) {
    throw new Error(`Failed to export PDF: ${exportResponse.status}`);
  }

  const pdfBlob = await exportResponse.blob();

  // Step 2: Upload the PDF to Drive
  const metadata = {
    name: pdfName,
    parents: [folderId],
    mimeType: 'application/pdf',
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', pdfBlob);

  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload PDF: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  const pdfId = uploadResult.id;

  // Step 3: Make the PDF shareable
  await driveRequest(`/files/${pdfId}/permissions`, 'POST', {
    role: 'reader',
    type: 'anyone',
  });

  // Step 4: Delete the temporary Google Doc
  await deleteDocument(documentId);

  // Step 5: Return the PDF view URL
  return `https://drive.google.com/file/d/${pdfId}/view`;
}

/**
 * Delete a document
 */
async function deleteDocument(documentId: string): Promise<void> {
  await driveRequest(`/files/${documentId}`, 'DELETE');
}

/**
 * Format prestations list as text table
 */
function formatPrestationsList(prestations: Prestation[]): string {
  if (prestations.length === 0) return 'Aucune prestation';

  let table = '';

  prestations.forEach((p) => {
    const date = formatDateForDisplay(p.date);
    const type = p.type_prestation;
    const montant = formatCurrency(p.montant);
    table += `${date}\t${type}\t${montant}\n`;
  });

  return table;
}

/**
 * Generate facture PDF for a paiement
 */
export async function generateFacture(
  paiement: Paiement,
  client: Client,
  prestations: Prestation[]
): Promise<string> {
  const templateId = getConfigValue('templateFactureId');
  const folderId = getConfigValue('folderFacturesId');

  try {
    // Get or create year subfolder
    const year = new Date().getFullYear();
    const yearFolderId = await findOrCreateFolder(year.toString(), folderId);

    // Create document name
    const documentName = `Facture_${paiement.reference}_${client.nom}`;

    // Copy template to year folder
    const documentId = await copyDocument(templateId, documentName, yearFolderId);

    // Prepare replacements - All variables available for factures
    const replacements: Record<string, string> = {
      [TEMPLATE_PLACEHOLDERS.FACTURE.REFERENCE_PAIEMENT]: paiement.reference,
      [TEMPLATE_PLACEHOLDERS.FACTURE.DATE_FACTURE]: formatDateForDisplay(new Date().toISOString().split('T')[0]),
      [TEMPLATE_PLACEHOLDERS.FACTURE.NOM_CLIENT]: client.nom,
      [TEMPLATE_PLACEHOLDERS.FACTURE.EMAIL_CLIENT]: client.email,
      [TEMPLATE_PLACEHOLDERS.FACTURE.TELEPHONE_CLIENT]: client.telephone || 'Non renseigné',
      [TEMPLATE_PLACEHOLDERS.FACTURE.ADRESSE_CLIENT]: client.adresse || 'Non renseignée',
      [TEMPLATE_PLACEHOLDERS.FACTURE.SIRET_CLIENT]: client.numero_siret || 'Non renseigné',
      [TEMPLATE_PLACEHOLDERS.FACTURE.LISTE_PRESTATIONS]: formatPrestationsList(prestations),
      [TEMPLATE_PLACEHOLDERS.FACTURE.TOTAL]: formatCurrency(paiement.total),
      [TEMPLATE_PLACEHOLDERS.FACTURE.DATE_ENCAISSEMENT]: paiement.date_encaissement
        ? formatDateForDisplay(paiement.date_encaissement)
        : 'Non encaissé',
      [TEMPLATE_PLACEHOLDERS.FACTURE.MODE_ENCAISSEMENT]: paiement.mode_encaissement
        ? paiement.mode_encaissement.charAt(0).toUpperCase() + paiement.mode_encaissement.slice(1)
        : 'Non spécifié',
    };

    // Replace text
    await replaceTextInDocument(documentId, replacements);

    // Export as PDF, save to Drive, and get URL (will delete the temporary Doc)
    const pdfName = `${documentName}.pdf`;
    const pdfUrl = await exportAsPdf(documentId, pdfName, yearFolderId);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating facture:', error);
    throw error;
  }
}

/**
 * Generate reçu PDF for a paiement
 */
export async function generateRecu(
  paiement: Paiement,
  client: Client,
  prestations: Prestation[]
): Promise<string> {
  if (!paiement.date_encaissement) {
    throw new Error('Cannot generate reçu: payment not yet encaissé');
  }

  const templateId = getConfigValue('templateRecuId');
  const folderId = getConfigValue('folderRecusId');

  try {
    // Get or create year subfolder
    const year = new Date().getFullYear();
    const yearFolderId = await findOrCreateFolder(year.toString(), folderId);

    // Create document name
    const documentName = `Recu_${paiement.reference}_${client.nom}`;

    // Copy template to year folder
    const documentId = await copyDocument(templateId, documentName, yearFolderId);

    // Prepare replacements - All variables available for reçus
    const replacements: Record<string, string> = {
      [TEMPLATE_PLACEHOLDERS.RECU.REFERENCE_PAIEMENT]: paiement.reference,
      [TEMPLATE_PLACEHOLDERS.RECU.DATE_FACTURE]: formatDateForDisplay(new Date().toISOString().split('T')[0]),
      [TEMPLATE_PLACEHOLDERS.RECU.DATE_ENCAISSEMENT]: formatDateForDisplay(paiement.date_encaissement),
      [TEMPLATE_PLACEHOLDERS.RECU.NOM_CLIENT]: client.nom,
      [TEMPLATE_PLACEHOLDERS.RECU.EMAIL_CLIENT]: client.email,
      [TEMPLATE_PLACEHOLDERS.RECU.TELEPHONE_CLIENT]: client.telephone || 'Non renseigné',
      [TEMPLATE_PLACEHOLDERS.RECU.ADRESSE_CLIENT]: client.adresse || 'Non renseignée',
      [TEMPLATE_PLACEHOLDERS.RECU.SIRET_CLIENT]: client.numero_siret || 'Non renseigné',
      [TEMPLATE_PLACEHOLDERS.RECU.MODE_ENCAISSEMENT]: paiement.mode_encaissement
        ? paiement.mode_encaissement.charAt(0).toUpperCase() + paiement.mode_encaissement.slice(1)
        : 'Non spécifié',
      [TEMPLATE_PLACEHOLDERS.RECU.TOTAL]: formatCurrency(paiement.total),
      [TEMPLATE_PLACEHOLDERS.RECU.LISTE_PRESTATIONS]: formatPrestationsList(prestations),
    };

    // Replace text
    await replaceTextInDocument(documentId, replacements);

    // Export as PDF, save to Drive, and get URL (will delete the temporary Doc)
    const pdfName = `${documentName}.pdf`;
    const pdfUrl = await exportAsPdf(documentId, pdfName, yearFolderId);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating reçu:', error);
    throw error;
  }
}

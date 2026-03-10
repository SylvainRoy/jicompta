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

/**
 * Generate annual tax report PDF
 */
export async function generateTaxReport(
  year: number,
  prestations: Prestation[],
  paiements: Paiement[],
  clients: Client[],
  typesPrestations: { nom: string; montant_suggere: number }[]
): Promise<string> {
  console.log(`Generating tax report for year ${year}`);

  try {
    const comptabiliteFolderId = getConfigValue('folderComptabiliteId');

    // Filter data for the year
    const yearPrestations = prestations.filter((p) => {
      if (!p.date) return false;
      const prestationYear = parseInt(p.date.split('-')[0], 10);
      return prestationYear === year;
    });

    const yearPaiements = paiements.filter((p) => {
      if (!p.date_encaissement) return false;
      const paiementYear = parseInt(p.date_encaissement.split('-')[0], 10);
      return paiementYear === year;
    });

    // Calculate statistics
    const totalRevenue = yearPaiements.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

    // Revenue by month
    const revenueByMonth: Record<string, number> = {};
    for (let month = 1; month <= 12; month++) {
      const monthKey = String(month).padStart(2, '0');
      revenueByMonth[monthKey] = 0;
    }
    yearPaiements.forEach((p) => {
      if (p.date_encaissement) {
        const month = p.date_encaissement.split('-')[1];
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (Number(p.total) || 0);
      }
    });

    // Revenue by client
    const revenueByClient: Record<string, number> = {};
    yearPaiements.forEach((p) => {
      revenueByClient[p.client] = (revenueByClient[p.client] || 0) + (Number(p.total) || 0);
    });
    const allClients = Object.entries(revenueByClient)
      .sort(([, a], [, b]) => b - a);

    // Revenue by service type
    // For each payment received this year, get ALL its prestations (regardless of year)
    const revenueByType: Record<string, number> = {};
    yearPaiements.forEach((pmt) => {
      // Find all prestations linked to this payment
      const linkedPrestations = prestations.filter((p) => p.paiement_id === pmt.reference);
      linkedPrestations.forEach((p) => {
        revenueByType[p.type_prestation] = (revenueByType[p.type_prestation] || 0) + (Number(p.montant) || 0);
      });
    });

    // Revenue by payment method
    const revenueByMethod: Record<string, number> = {};
    yearPaiements.forEach((p) => {
      const method = p.mode_encaissement || 'Non spécifié';
      revenueByMethod[method] = (revenueByMethod[method] || 0) + (Number(p.total) || 0);
    });

    // Create document title and name
    const documentName = `Rapport_Fiscal_${year}`;
    const documentTitle = `Rapport Fiscal ${year} - JiCompta`;

    // Create a new Google Doc
    const createResponse = await driveRequest('/files', 'POST', {
      name: documentName,
      mimeType: 'application/vnd.google-apps.document',
      parents: [comptabiliteFolderId],
    });
    const documentId = createResponse.id;

    // Build document content using Google Docs API
    const requests = [];

    // Add title
    requests.push({
      insertText: {
        location: { index: 1 },
        text: `${documentTitle}\n\n`,
      },
    });

    // Add summary section
    let currentIndex = documentTitle.length + 3;
    const summaryText = `RÉSUMÉ DE L'ANNÉE ${year}\n\n` +
      `Chiffre d'affaires encaissé: ${formatCurrency(totalRevenue)}\n` +
      `Nombre de clients: ${clients.length}\n` +
      `Nombre de prestations: ${yearPrestations.length}\n` +
      `Nombre de paiements encaissés: ${yearPaiements.length}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: summaryText,
      },
    });
    currentIndex += summaryText.length;

    // Add monthly breakdown
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    let monthlyText = 'REVENUS PAR MOIS\n\n';
    Object.entries(revenueByMonth).forEach(([month, revenue]) => {
      const monthName = monthNames[parseInt(month) - 1];
      monthlyText += `${monthName}: ${formatCurrency(revenue)}\n`;
    });
    // Add total to verify it matches CA
    const totalByMonth = Object.values(revenueByMonth).reduce((sum, revenue) => sum + revenue, 0);
    monthlyText += `\nTOTAL: ${formatCurrency(totalByMonth)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: monthlyText,
      },
    });
    currentIndex += monthlyText.length;

    // Add all clients with revenue
    let clientsText = 'REVENUS PAR CLIENT\n\n';
    allClients.forEach(([client, revenue]) => {
      clientsText += `${client}: ${formatCurrency(revenue)}\n`;
    });
    // Add total to verify it matches CA
    const totalByClient = allClients.reduce((sum, [, revenue]) => sum + revenue, 0);
    clientsText += `\nTOTAL: ${formatCurrency(totalByClient)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: clientsText,
      },
    });
    currentIndex += clientsText.length;

    // Add revenue by service type
    let typesText = 'REVENUS PAR TYPE DE PRESTATION\n\n';
    Object.entries(revenueByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, revenue]) => {
        typesText += `${type}: ${formatCurrency(revenue)}\n`;
      });
    // Add total to verify it matches CA
    const totalByType = Object.values(revenueByType).reduce((sum, revenue) => sum + revenue, 0);
    typesText += `\nTOTAL: ${formatCurrency(totalByType)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: typesText,
      },
    });
    currentIndex += typesText.length;

    // Add revenue by payment method
    let methodsText = 'REVENUS PAR MODE DE PAIEMENT\n\n';
    Object.entries(revenueByMethod)
      .sort(([, a], [, b]) => b - a)
      .forEach(([method, revenue]) => {
        const methodName = method.charAt(0).toUpperCase() + method.slice(1);
        methodsText += `${methodName}: ${formatCurrency(revenue)}\n`;
      });
    // Add total to verify it matches CA
    const totalByMethod = Object.values(revenueByMethod).reduce((sum, revenue) => sum + revenue, 0);
    methodsText += `\nTOTAL: ${formatCurrency(totalByMethod)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: methodsText,
      },
    });
    currentIndex += methodsText.length;

    // Add detailed prestations list (all prestations linked to payments received this year)
    const encaissedPrestations: Array<Prestation & { date_encaissement: string }> = [];
    yearPaiements.forEach((pmt) => {
      const linkedPrestations = prestations.filter((p) => p.paiement_id === pmt.reference);
      linkedPrestations.forEach((p) => {
        encaissedPrestations.push({
          ...p,
          date_encaissement: pmt.date_encaissement || '',
        });
      });
    });

    let prestationsText = 'DÉTAIL DES PRESTATIONS ENCAISSÉES\n\n';
    encaissedPrestations
      .sort((a, b) => a.date_encaissement.localeCompare(b.date_encaissement))
      .forEach((p) => {
        const datePrestation = formatDateForDisplay(p.date);
        const dateEncaissement = formatDateForDisplay(p.date_encaissement);
        prestationsText += `${datePrestation} - ${p.nom_client} - ${p.type_prestation} - ${formatCurrency(p.montant)} - Encaissé le ${dateEncaissement}\n`;
      });
    const totalPrestations = encaissedPrestations.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
    prestationsText += `\nTOTAL: ${formatCurrency(totalPrestations)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: prestationsText,
      },
    });
    currentIndex += prestationsText.length;

    // Add detailed payments list
    let paymentsText = 'DÉTAIL DES PAIEMENTS ENCAISSÉS\n\n';
    yearPaiements
      .sort((a, b) => (a.date_encaissement || '').localeCompare(b.date_encaissement || ''))
      .forEach((p) => {
        const date = p.date_encaissement ? formatDateForDisplay(p.date_encaissement) : 'Non renseigné';
        paymentsText += `${date} - ${p.client} - ${p.reference} - ${formatCurrency(p.total)} - ${p.mode_encaissement || 'Non spécifié'}\n`;
      });
    const totalPaiements = yearPaiements.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    paymentsText += `\nTOTAL: ${formatCurrency(totalPaiements)}\n\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: paymentsText,
      },
    });
    currentIndex += paymentsText.length;

    // Add notes
    const notesText = 'NOTES IMPORTANTES\n\n' +
      `- Ce rapport couvre la période du 01/01/${year} au 31/12/${year}\n` +
      `- Seuls les paiements effectivement encaissés sont comptabilisés\n` +
      `- Tous les totaux (par mois, par client, par type, par mode, prestations, paiements) doivent correspondre au chiffre d'affaires encaissé\n` +
      `- Montants en EUR\n` +
      `- Rapport généré le ${formatDateForDisplay(new Date().toISOString().split('T')[0])}\n`;

    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: notesText,
      },
    });

    // Apply formatting (make section headers bold)
    await docsRequest(`/documents/${documentId}:batchUpdate`, 'POST', { requests });

    // Export as PDF (download directly, don't save to Drive)
    const user = loadAuthData();
    if (!user) throw new Error('Not authenticated');

    const exportUrl = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`;
    const response = await fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export PDF: ${response.status}`);
    }

    // Get PDF as blob
    const pdfBlob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_Fiscal_${year}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Delete the temporary Google Doc
    await driveRequest(`/files/${documentId}`, 'DELETE');

    console.log('Tax report generated and downloaded, temporary doc deleted');

    return `Rapport_Fiscal_${year}.pdf`;
  } catch (error) {
    console.error('Error generating tax report:', error);
    throw error;
  }
}

import type { Client, TypePrestation, Prestation, Paiement, Depense, AuthUser } from '@/types'

// ============================================
// Auth fixtures
// ============================================

export const mockAuthUser: AuthUser = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
  accessToken: 'mock-access-token-123',
}

// ============================================
// Client fixtures
// ============================================

export const mockClients: Client[] = [
  {
    nom: 'Dupont SARL',
    email: 'dupont@example.fr',
    telephone: '0612345678',
    adresse: '1 rue de Paris, 75001 Paris',
    numero_siret: '12345678901234',
    _rowNumber: 0,
  },
  {
    nom: 'Martin & Co',
    email: 'martin@example.fr',
    telephone: '0698765432',
    adresse: '10 avenue des Champs, 69001 Lyon',
    _rowNumber: 1,
  },
  {
    nom: 'Association Locale',
    email: 'asso@example.fr',
    _rowNumber: 2,
  },
]

// ============================================
// TypePrestation fixtures
// ============================================

export const mockTypesPrestations: TypePrestation[] = [
  { nom: 'Conseil', montant_suggere: 500, _rowNumber: 0 },
  { nom: 'Formation', montant_suggere: 1200, _rowNumber: 1 },
  { nom: 'Développement', montant_suggere: 800, _rowNumber: 2 },
]

// ============================================
// Prestation fixtures
// ============================================

export const mockPrestations: Prestation[] = [
  {
    date: '2026-03-01',
    nom_client: 'Dupont SARL',
    type_prestation: 'Conseil',
    montant: 500,
    paiement_id: '',
    associatif: false,
    _rowNumber: 0,
  },
  {
    date: '2026-03-05',
    nom_client: 'Martin & Co',
    type_prestation: 'Formation',
    montant: 1200,
    paiement_id: '2603050001',
    associatif: false,
    _rowNumber: 1,
  },
  {
    date: '2026-03-10',
    nom_client: 'Association Locale',
    type_prestation: 'Conseil',
    montant: 300,
    paiement_id: '',
    associatif: true,
    _rowNumber: 2,
  },
]

// ============================================
// Paiement fixtures
// ============================================

export const mockPaiements: Paiement[] = [
  {
    reference: '2603050001',
    client: 'Martin & Co',
    total: 1200,
    date_encaissement: '2026-03-10',
    mode_encaissement: 'virement',
    facture: 'https://drive.google.com/file/facture1',
    recu: 'https://drive.google.com/file/recu1',
    _rowNumber: 0,
  },
  {
    reference: '2603150001',
    client: 'Dupont SARL',
    total: 500,
    _rowNumber: 1,
  },
]

// ============================================
// Depense fixtures
// ============================================

export const mockDepenses: Depense[] = [
  {
    date: '2026-03-02',
    compte: 'Mon compte',
    montant: 150,
    description: 'Fournitures de bureau',
    _rowNumber: 0,
  },
  {
    date: '2026-03-08',
    compte: 'Association Locale',
    montant: 50,
    description: 'Frais de déplacement',
    _rowNumber: 1,
  },
]

// ============================================
// Google Sheets raw row format (as returned by API)
// ============================================

export const mockSheetsRows = {
  clients: {
    headers: ['nom', 'email', 'telephone', 'adresse', 'numero_siret'],
    rows: [
      ['Dupont SARL', 'dupont@example.fr', '0612345678', '1 rue de Paris, 75001 Paris', '12345678901234'],
      ['Martin & Co', 'martin@example.fr', '0698765432', '10 avenue des Champs, 69001 Lyon', ''],
      ['Association Locale', 'asso@example.fr', '', '', ''],
    ],
  },
  typesPrestations: {
    headers: ['nom', 'montant_suggere'],
    rows: [
      ['Conseil', '500'],
      ['Formation', '1200'],
      ['Développement', '800'],
    ],
  },
  prestations: {
    headers: ['date', 'nom_client', 'type_prestation', 'montant', 'paiement_id', 'associatif'],
    rows: [
      ['2026-03-01', 'Dupont SARL', 'Conseil', '500', '', 'FALSE'],
      ['2026-03-05', 'Martin & Co', 'Formation', '1200', '2603050001', 'FALSE'],
      ['2026-03-10', 'Association Locale', 'Conseil', '300', '', 'TRUE'],
    ],
  },
  paiements: {
    headers: ['reference', 'client', 'total', 'date_encaissement', 'mode_encaissement', 'facture', 'recu'],
    rows: [
      ['2603050001', 'Martin & Co', '1200', '2026-03-10', 'virement', 'https://drive.google.com/file/facture1', 'https://drive.google.com/file/recu1'],
      ['2603150001', 'Dupont SARL', '500', '', '', '', ''],
    ],
  },
  depenses: {
    headers: ['date', 'compte', 'montant', 'description'],
    rows: [
      ['2026-03-02', 'Mon compte', '150', 'Fournitures de bureau'],
      ['2026-03-08', 'Association Locale', '50', 'Frais de déplacement'],
    ],
  },
}

// ============================================
// Config fixtures
// ============================================

export const mockConfig = {
  spreadsheetId: 'mock-spreadsheet-id',
  templateFactureId: 'mock-template-facture-id',
  templateRecuId: 'mock-template-recu-id',
  folderComptabiliteId: 'mock-folder-comptabilite-id',
  folderFacturesId: 'mock-folder-factures-id',
  folderRecusId: 'mock-folder-recus-id',
  setupDate: '2026-01-15',
  version: '2',
  folderName: 'Comptabilite',
}

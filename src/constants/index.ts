/**
 * Application constants
 */

// Google API Scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
];

// Google Sheets Tab Names
export const SHEET_TABS = {
  CLIENTS: 'Clients',
  TYPE_PRESTATION: 'TypeDePrestation',
  PRESTATION: 'Prestation',
  PAIEMENT: 'Paiement',
} as const;

// Google Sheets Column Mapping
export const SHEET_COLUMNS = {
  CLIENTS: {
    NOM: 'A',
    EMAIL: 'B',
    TELEPHONE: 'C',
    ADRESSE: 'D',
    NUMERO_SIRET: 'E',
  },
  TYPE_PRESTATION: {
    NOM: 'A',
    MONTANT_SUGGERE: 'B',
  },
  PRESTATION: {
    DATE: 'A',
    NOM_CLIENT: 'B',
    TYPE_PRESTATION: 'C',
    MONTANT: 'D',
    PAIEMENT_ID: 'E',
  },
  PAIEMENT: {
    REFERENCE: 'A',
    CLIENT: 'B',
    TOTAL: 'C',
    DATE_ENCAISSEMENT: 'D',
    MODE_ENCAISSEMENT: 'E',
    FACTURE: 'F',
    RECU: 'G',
  },
} as const;

// Mode d'encaissement options
export const MODES_ENCAISSEMENT = [
  { value: 'virement', label: 'Virement' },
  { value: 'espece', label: 'Espèce' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'autre', label: 'Autre' },
] as const;

// Notification durations (in milliseconds)
export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'comptaclaude_auth_token',
  AUTH_USER: 'comptaclaude_auth_user',
  REFRESH_TOKEN: 'comptaclaude_refresh_token',
} as const;

// Date formats
export const DATE_FORMAT = {
  DISPLAY: 'DD/MM/YYYY',
  STORAGE: 'YYYY-MM-DD',
  INPUT: 'YYYY-MM-DD',
} as const;

// Currency format
export const CURRENCY_FORMAT = {
  LOCALE: 'fr-FR',
  CURRENCY: 'EUR',
  SYMBOL: '€',
} as const;

// API Rate Limiting (Google APIs)
export const API_LIMITS = {
  SHEETS_PER_MINUTE: 300,
  DOCS_PER_MINUTE: 300,
  DRIVE_PER_100_SECONDS: 1000,
  RETRY_DELAY: 1000, // Initial retry delay in ms
  MAX_RETRIES: 3,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  CLIENTS_NEW: '/clients/new',
  CLIENTS_EDIT: '/clients/:id',
  TYPES_PRESTATION: '/types-prestation',
  TYPES_PRESTATION_NEW: '/types-prestation/new',
  TYPES_PRESTATION_EDIT: '/types-prestation/:id',
  PRESTATIONS: '/prestations',
  PRESTATIONS_NEW: '/prestations/new',
  PRESTATIONS_EDIT: '/prestations/:id',
  PAIEMENTS: '/paiements',
  PAIEMENTS_NEW: '/paiements/new',
  PAIEMENTS_EDIT: '/paiements/:id',
  SETTINGS: '/settings',
} as const;

// Template placeholders for PDF generation
export const TEMPLATE_PLACEHOLDERS = {
  FACTURE: {
    REFERENCE_PAIEMENT: '{{REFERENCE_PAIEMENT}}',
    DATE_FACTURE: '{{DATE_FACTURE}}',
    NOM_CLIENT: '{{NOM_CLIENT}}',
    EMAIL_CLIENT: '{{EMAIL_CLIENT}}',
    TELEPHONE_CLIENT: '{{TELEPHONE_CLIENT}}',
    ADRESSE_CLIENT: '{{ADRESSE_CLIENT}}',
    SIRET_CLIENT: '{{SIRET_CLIENT}}',
    LISTE_PRESTATIONS: '{{LISTE_PRESTATIONS}}',
    TOTAL: '{{TOTAL}}',
    DATE_ENCAISSEMENT: '{{DATE_ENCAISSEMENT}}',
    MODE_ENCAISSEMENT: '{{MODE_ENCAISSEMENT}}',
  },
  RECU: {
    REFERENCE_PAIEMENT: '{{REFERENCE_PAIEMENT}}',
    DATE_FACTURE: '{{DATE_FACTURE}}',
    DATE_ENCAISSEMENT: '{{DATE_ENCAISSEMENT}}',
    NOM_CLIENT: '{{NOM_CLIENT}}',
    EMAIL_CLIENT: '{{EMAIL_CLIENT}}',
    TELEPHONE_CLIENT: '{{TELEPHONE_CLIENT}}',
    ADRESSE_CLIENT: '{{ADRESSE_CLIENT}}',
    SIRET_CLIENT: '{{SIRET_CLIENT}}',
    MODE_ENCAISSEMENT: '{{MODE_ENCAISSEMENT}}',
    TOTAL: '{{TOTAL}}',
    LISTE_PRESTATIONS: '{{LISTE_PRESTATIONS}}',
  },
} as const;

// App metadata
export const APP_INFO = {
  NAME: 'ComptaClaude',
  DESCRIPTION: 'Application de gestion comptable',
  VERSION: '0.1.0',
} as const;

// ============================================
// Data Models - Matching Google Sheets structure
// ============================================

export interface Client {
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numero_siret?: string;
}

export interface TypePrestation {
  nom: string;
  montant_suggere: number;
}

export interface Prestation {
  date: string; // Format: YYYY-MM-DD
  nom_client: string;
  type_prestation: string;
  montant: number;
  paiement_id?: string;
}

export type ModeEncaissement = 'virement' | 'espece' | 'cheque' | 'paypal' | 'autre';

export interface Paiement {
  reference: string; // Format: yymmddnnnn
  client: string;
  total: number;
  date_encaissement?: string; // Format: YYYY-MM-DD
  mode_encaissement?: ModeEncaissement;
  facture?: string; // URL
  recu?: string; // URL
}

// ============================================
// UI State Models
// ============================================

export interface DashboardStats {
  totalPrestationsAnnee: number;
  totalPaiementsEncaisses: number;
  nombrePaiementsEnAttente: number;
  montantEnAttente: number;
}

export interface PrestationAvecStatut extends Prestation {
  estPaye: boolean;
}

export interface PaiementAvecStatut extends Paiement {
  estEncaisse: boolean;
  prestations: Prestation[];
}

// ============================================
// Form Models
// ============================================

export interface ClientFormData {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  numero_siret: string;
}

export interface TypePrestationFormData {
  nom: string;
  montant_suggere: string;
}

export interface PrestationFormData {
  date: string;
  nom_client: string;
  type_prestation: string;
  montant: string;
}

export interface PaiementFormData {
  prestationIds: string[];
  mode_encaissement?: ModeEncaissement;
  date_encaissement?: string;
}

// ============================================
// Auth Models
// ============================================

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// API Response Models
// ============================================

export interface GoogleSheetsResponse<T> {
  data: T[];
  error?: string;
}

export interface PDFGenerationResult {
  url: string;
  fileId: string;
  success: boolean;
  error?: string;
}

// ============================================
// Filter & Search Models
// ============================================

export interface PrestationFilters {
  annee?: number;
  client?: string;
  type?: string;
  statut?: 'tous' | 'paye' | 'non_paye';
}

export interface PaiementFilters {
  annee?: number;
  client?: string;
  statut?: 'tous' | 'encaisse' | 'non_encaisse';
}

// ============================================
// Notification Models
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

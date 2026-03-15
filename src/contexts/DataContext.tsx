/**
 * Data Context
 * Manages application data (Clients, Types, Prestations, Paiements)
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { Client, TypePrestation, Prestation, Paiement, Depense, Compte } from '@/types';
import * as sheetsService from '@/services/googleSheets';
import * as docsService from '@/services/googleDocs';
import * as setupService from '@/services/googleSetup';
import { generatePaiementID } from '@/utils/validators';
import { MON_COMPTE } from '@/constants';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';
import { useNotification } from './NotificationContext';

interface DataState {
  clients: Client[];
  typesPrestations: TypePrestation[];
  prestations: Prestation[];
  paiements: Paiement[];
  depenses: Depense[];
  isLoading: boolean;
  error: string | null;
}

interface DataContextValue extends DataState {
  // Clients
  refreshClients: () => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  updateClient: (index: number, client: Client) => Promise<void>;
  deleteClient: (index: number) => Promise<void>;
  getClientByName: (name: string) => Client | undefined;

  // Types Prestations
  refreshTypesPrestations: () => Promise<void>;
  addTypePrestation: (type: TypePrestation) => Promise<void>;
  updateTypePrestation: (index: number, type: TypePrestation) => Promise<void>;
  deleteTypePrestation: (index: number) => Promise<void>;

  // Prestations
  refreshPrestations: () => Promise<void>;
  addPrestation: (prestation: Prestation) => Promise<void>;
  updatePrestation: (index: number, prestation: Prestation) => Promise<void>;
  deletePrestation: (index: number) => Promise<void>;

  // Paiements
  refreshPaiements: () => Promise<void>;
  addPaiement: (paiement: Paiement, prestationIndices: number[]) => Promise<void>;
  updatePaiement: (index: number, paiement: Paiement) => Promise<void>;
  deletePaiement: (index: number) => Promise<void>;
  generateFactureForPaiement: (index: number) => Promise<string>;
  generateRecuForPaiement: (index: number) => Promise<string>;

  // Depenses
  refreshDepenses: () => Promise<void>;
  addDepense: (depense: Depense) => Promise<void>;
  updateDepense: (index: number, depense: Depense) => Promise<void>;
  deleteDepense: (index: number) => Promise<void>;

  // Comptes
  comptes: Compte[];

  // Global
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { isAuthenticated } = useAuth();
  const { isConfigured, config } = useConfig();
  const { error: notifyError, success: notifySuccess } = useNotification();
  const migrationsRunFor = useRef<string | null>(null);

  const [state, setState] = useState<DataState>({
    clients: [],
    typesPrestations: [],
    prestations: [],
    paiements: [],
    depenses: [],
    isLoading: false,
    error: null,
  });

  // Run migrations if needed (once per spreadsheet)
  const runMigrationsIfNeeded = useCallback(async () => {
    if (!config?.spreadsheetId || migrationsRunFor.current === config.spreadsheetId) {
      return;
    }

    try {
      console.log('Running database migrations...');
      await setupService.runMigrations(config.spreadsheetId);
      migrationsRunFor.current = config.spreadsheetId;
      console.log('Migrations completed');
    } catch (error) {
      console.error('Migration error:', error);
      // Don't throw - allow app to continue even if migrations fail
      // The error will be caught when trying to access the sheet
    }
  }, [config]);

  // Declare refreshAll first (hoisted for use in useEffect)
  const refreshAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Run migrations before first data load
      await runMigrationsIfNeeded();

      const [clientsRes, typesRes, prestationsRes, paiementsRes, depensesRes] = await Promise.all([
        sheetsService.getClients(),
        sheetsService.getTypesPrestations(),
        sheetsService.getPrestations(),
        sheetsService.getPaiements(),
        sheetsService.getDepenses(),
      ]);

      setState({
        clients: clientsRes.data,
        typesPrestations: typesRes.data,
        prestations: prestationsRes.data,
        paiements: paiementsRes.data,
        depenses: depensesRes.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError, runMigrationsIfNeeded]);

  // Load all data when authenticated and configured
  useEffect(() => {
    if (isAuthenticated && isConfigured) {
      console.log('🔄 DataContext: Chargement des données (auth + config OK)');
      refreshAll();
    }
  }, [isAuthenticated, isConfigured, refreshAll]);

  // Auto-refresh when app becomes visible (switching devices or tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && isConfigured) {
        console.log('👁️ DataContext: App became visible, refreshing data');
        refreshAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, isConfigured, refreshAll]);

  // ==================== CLIENTS ====================

  const refreshClients = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await sheetsService.getClients();

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        clients: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load clients';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

  const addClient = useCallback(async (client: Client) => {
    try {
      await sheetsService.addClient(client);
      await refreshClients();
      notifySuccess('Client ajouté avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add client';
      notifyError(message);
      throw error;
    }
  }, [refreshClients, notifyError, notifySuccess]);

  const updateClient = useCallback(async (index: number, client: Client) => {
    try {
      const actualRowNumber = state.clients[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Client missing _rowNumber metadata');
      }
      await sheetsService.updateClient(actualRowNumber, client);
      await refreshClients();
      notifySuccess('Client modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update client';
      notifyError(message);
      throw error;
    }
  }, [state.clients, refreshClients, notifyError, notifySuccess]);

  const deleteClient = useCallback(async (index: number) => {
    try {
      // Check if client has related prestations, paiements, or depenses (has account)
      const client = state.clients[index];
      const hasPrestations = state.prestations.some(p => p.nom_client === client.nom);
      const hasPaiements = state.paiements.some(p => p.client === client.nom);
      const hasDepenses = state.depenses.some(d => d.compte === client.nom);
      const hasPrestationsAssociatives = state.prestations.some(p => p.nom_client === client.nom && p.associatif);

      if (hasPrestations || hasPaiements) {
        throw new Error('Ce client a des prestations ou paiements associés. Suppression impossible.');
      }

      if (hasDepenses || hasPrestationsAssociatives) {
        throw new Error('Ce client a un compte avec des dépenses ou prestations associatives. Suppression impossible.');
      }

      const actualRowNumber = state.clients[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Client missing _rowNumber metadata');
      }

      await sheetsService.deleteClient(actualRowNumber);
      await refreshClients();
      notifySuccess('Client supprimé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client';
      notifyError(message);
      throw error;
    }
  }, [state.clients, state.prestations, state.paiements, state.depenses, refreshClients, notifyError, notifySuccess]);

  const getClientByName = useCallback((name: string) => {
    return state.clients.find(c => c.nom === name);
  }, [state.clients]);

  // ==================== TYPES PRESTATIONS ====================

  const refreshTypesPrestations = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await sheetsService.getTypesPrestations();

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        typesPrestations: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load types';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

  const addTypePrestation = useCallback(async (type: TypePrestation) => {
    try {
      await sheetsService.addTypePrestation(type);
      await refreshTypesPrestations();
      notifySuccess('Type de prestation ajouté avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add type';
      notifyError(message);
      throw error;
    }
  }, [refreshTypesPrestations, notifyError, notifySuccess]);

  const updateTypePrestation = useCallback(async (index: number, type: TypePrestation) => {
    try {
      const actualRowNumber = state.typesPrestations[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('TypePrestation missing _rowNumber metadata');
      }
      await sheetsService.updateTypePrestation(actualRowNumber, type);
      await refreshTypesPrestations();
      notifySuccess('Type de prestation modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update type';
      notifyError(message);
      throw error;
    }
  }, [state.typesPrestations, refreshTypesPrestations, notifyError, notifySuccess]);

  const deleteTypePrestation = useCallback(async (index: number) => {
    try {
      const type = state.typesPrestations[index];
      const hasPrestations = state.prestations.some(p => p.type_prestation === type.nom);

      if (hasPrestations) {
        throw new Error('Ce type a des prestations associées. Suppression impossible.');
      }

      const actualRowNumber = state.typesPrestations[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('TypePrestation missing _rowNumber metadata');
      }

      await sheetsService.deleteTypePrestation(actualRowNumber);
      await refreshTypesPrestations();
      notifySuccess('Type de prestation supprimé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete type';
      notifyError(message);
      throw error;
    }
  }, [state.typesPrestations, state.prestations, refreshTypesPrestations, notifyError, notifySuccess]);

  // ==================== PRESTATIONS ====================

  const refreshPrestations = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await sheetsService.getPrestations();

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        prestations: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load prestations';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

  const addPrestation = useCallback(async (prestation: Prestation) => {
    try {
      await sheetsService.addPrestation(prestation);
      await refreshPrestations();
      notifySuccess('Prestation ajoutée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add prestation';
      notifyError(message);
      throw error;
    }
  }, [refreshPrestations, notifyError, notifySuccess]);

  const updatePrestation = useCallback(async (index: number, prestation: Prestation) => {
    try {
      console.log('📝 DataContext.updatePrestation called:', { index, prestation });
      if (index < 0 || index >= state.prestations.length) {
        throw new Error(`Invalid prestation index: ${index} (total: ${state.prestations.length})`);
      }

      // Get the actual row number from the prestation being updated
      const actualRowNumber = state.prestations[index]._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Prestation missing _rowNumber metadata');
      }

      console.log(`📝 Updating prestation at array index ${index}, sheet row ${actualRowNumber + 2}`);
      await sheetsService.updatePrestation(actualRowNumber, prestation);
      await refreshPrestations();
      notifySuccess('Prestation modifiée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update prestation';
      notifyError(message);
      throw error;
    }
  }, [state.prestations, refreshPrestations, notifyError, notifySuccess]);

  const deletePrestation = useCallback(async (index: number) => {
    try {
      if (index < 0 || index >= state.prestations.length) {
        throw new Error(`Invalid prestation index: ${index} (total: ${state.prestations.length})`);
      }

      // Get the actual row number from the prestation being deleted
      const actualRowNumber = state.prestations[index]._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Prestation missing _rowNumber metadata');
      }

      console.log(`🗑️ Deleting prestation at array index ${index}, sheet row ${actualRowNumber + 2}`);
      await sheetsService.deletePrestation(actualRowNumber);
      await refreshPrestations();
      notifySuccess('Prestation supprimée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete prestation';
      notifyError(message);
      throw error;
    }
  }, [state.prestations, refreshPrestations, notifyError, notifySuccess]);

  // ==================== PAIEMENTS ====================

  const refreshPaiements = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await sheetsService.getPaiements();

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        paiements: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load paiements';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

  const addPaiement = useCallback(async (paiement: Paiement, prestationIndices: number[]) => {
    try {
      // Check if any prestation is associatif
      for (const index of prestationIndices) {
        const prestation = state.prestations[index];
        if (prestation?.associatif) {
          throw new Error('Impossible de créer un paiement pour des prestations associatives.');
        }
      }

      // Generate payment reference
      const existingRefs = state.paiements.map(p => p.reference);
      const reference = generatePaiementID(existingRefs);

      const paiementWithRef: Paiement = {
        ...paiement,
        reference,
      };

      // Add paiement to Google Sheets
      await sheetsService.addPaiement(paiementWithRef);

      // Update prestations with paiement_id
      for (const index of prestationIndices) {
        const prestation = state.prestations[index];
        if (prestation) {
          await sheetsService.updatePrestation(index, {
            ...prestation,
            paiement_id: reference,
          });
        }
      }

      // Refresh all data
      await Promise.all([refreshPaiements(), refreshPrestations()]);
      notifySuccess('Paiement créé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add paiement';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, state.prestations, refreshPaiements, refreshPrestations, notifyError, notifySuccess]);

  const updatePaiement = useCallback(async (index: number, paiement: Paiement) => {
    try {
      const actualRowNumber = state.paiements[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Paiement missing _rowNumber metadata');
      }
      await sheetsService.updatePaiement(actualRowNumber, paiement);
      await refreshPaiements();
      notifySuccess('Paiement modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update paiement';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, refreshPaiements, notifyError, notifySuccess]);

  const deletePaiement = useCallback(async (index: number) => {
    try {
      const actualRowNumber = state.paiements[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Paiement missing _rowNumber metadata');
      }
      await sheetsService.deletePaiement(actualRowNumber);
      await refreshPaiements();
      notifySuccess('Paiement supprimé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete paiement';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, refreshPaiements, notifyError, notifySuccess]);

  const generateFactureForPaiement = useCallback(async (index: number): Promise<string> => {
    try {
      const paiement = state.paiements[index];
      if (!paiement) {
        throw new Error('Paiement not found');
      }

      const actualRowNumber = paiement._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Paiement missing _rowNumber metadata');
      }

      // Get client
      const client = state.clients.find(c => c.nom === paiement.client);
      if (!client) {
        throw new Error('Client not found');
      }

      // Get prestations for this paiement
      const prestations = state.prestations.filter(p => p.paiement_id === paiement.reference);

      // Generate facture PDF
      const factureUrl = await docsService.generateFacture(paiement, client, prestations);

      // Update paiement with facture URL
      const updatedPaiement: Paiement = {
        ...paiement,
        facture: factureUrl,
      };

      await sheetsService.updatePaiement(actualRowNumber, updatedPaiement);
      await refreshPaiements();
      notifySuccess('Facture générée avec succès');

      return factureUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate facture';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, state.clients, state.prestations, refreshPaiements, notifyError, notifySuccess]);

  const generateRecuForPaiement = useCallback(async (index: number): Promise<string> => {
    try {
      const paiement = state.paiements[index];
      if (!paiement) {
        throw new Error('Paiement not found');
      }

      const actualRowNumber = paiement._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Paiement missing _rowNumber metadata');
      }

      if (!paiement.date_encaissement) {
        throw new Error('Cannot generate reçu: payment not yet encaissé');
      }

      // Get client
      const client = state.clients.find(c => c.nom === paiement.client);
      if (!client) {
        throw new Error('Client not found');
      }

      // Get prestations for this paiement
      const prestations = state.prestations.filter(p => p.paiement_id === paiement.reference);

      // Generate reçu PDF
      const recuUrl = await docsService.generateRecu(paiement, client, prestations);

      // Update paiement with reçu URL
      const updatedPaiement: Paiement = {
        ...paiement,
        recu: recuUrl,
      };

      await sheetsService.updatePaiement(actualRowNumber, updatedPaiement);
      await refreshPaiements();
      notifySuccess('Reçu généré avec succès');

      return recuUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate reçu';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, state.clients, state.prestations, refreshPaiements, notifyError, notifySuccess]);

  // ==================== DEPENSES ====================

  const refreshDepenses = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await sheetsService.getDepenses();

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        depenses: response.data,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load depenses';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

  const addDepense = useCallback(async (depense: Depense) => {
    try {
      await sheetsService.addDepense(depense);
      await refreshDepenses();
      notifySuccess('Dépense ajoutée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add depense';
      notifyError(message);
      throw error;
    }
  }, [refreshDepenses, notifyError, notifySuccess]);

  const updateDepense = useCallback(async (index: number, depense: Depense) => {
    try {
      const actualRowNumber = state.depenses[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Depense missing _rowNumber metadata');
      }
      await sheetsService.updateDepense(actualRowNumber, depense);
      await refreshDepenses();
      notifySuccess('Dépense modifiée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update depense';
      notifyError(message);
      throw error;
    }
  }, [state.depenses, refreshDepenses, notifyError, notifySuccess]);

  const deleteDepense = useCallback(async (index: number) => {
    try {
      const actualRowNumber = state.depenses[index]?._rowNumber;
      if (actualRowNumber === undefined) {
        throw new Error('Depense missing _rowNumber metadata');
      }
      await sheetsService.deleteDepense(actualRowNumber);
      await refreshDepenses();
      notifySuccess('Dépense supprimée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete depense';
      notifyError(message);
      throw error;
    }
  }, [state.depenses, refreshDepenses, notifyError, notifySuccess]);

  // ==================== COMPTES ====================

  const comptes = useMemo<Compte[]>(() => {
    const comptesMap = new Map<string, Compte>();

    // Create "Mon compte" for user's personal account
    const monCompte: Compte = {
      nom: MON_COMPTE,
      balance: 0,
      paiements: [],
      depenses: [],
    };

    // Credit: All encaissed payments (non-associatif)
    state.paiements.forEach((paiement) => {
      if (paiement.date_encaissement) {
        monCompte.balance += paiement.total;
        monCompte.paiements!.push(paiement);
      }
    });

    // Debit: All expenses on "Mon compte"
    state.depenses.forEach((depense) => {
      if (depense.compte === MON_COMPTE) {
        monCompte.balance -= depense.montant;
        monCompte.depenses!.push(depense);
      }
    });

    comptesMap.set(MON_COMPTE, monCompte);

    // Create accounts for clients with associative prestations or expenses
    state.clients.forEach((client) => {
      const clientPrestations = state.prestations.filter(
        (p) => p.nom_client === client.nom && p.associatif
      );
      const clientDepenses = state.depenses.filter((d) => d.compte === client.nom);

      if (clientPrestations.length > 0 || clientDepenses.length > 0) {
        let balance = 0;

        // Credit: Associative prestations
        clientPrestations.forEach((prestation) => {
          balance += prestation.montant;
        });

        // Debit: Expenses
        clientDepenses.forEach((depense) => {
          balance -= depense.montant;
        });

        // Debug logging for account calculation
        if (clientPrestations.length > 0 || clientDepenses.length > 0) {
          console.log(`📊 Compte "${client.nom}":`, {
            prestations: clientPrestations.length,
            totalPrestations: clientPrestations.reduce((sum, p) => sum + p.montant, 0),
            depenses: clientDepenses.length,
            totalDepenses: clientDepenses.reduce((sum, d) => sum + d.montant, 0),
            balance,
          });
        }

        comptesMap.set(client.nom, {
          nom: client.nom,
          balance,
          prestations: clientPrestations,
          depenses: clientDepenses,
        });
      }
    });

    return Array.from(comptesMap.values());
  }, [state.clients, state.prestations, state.paiements, state.depenses]);

  // ==================== GLOBAL ====================
  // refreshAll is defined earlier in the file before useEffect

  const value: DataContextValue = {
    ...state,
    refreshClients,
    addClient,
    updateClient,
    deleteClient,
    getClientByName,
    refreshTypesPrestations,
    addTypePrestation,
    updateTypePrestation,
    deleteTypePrestation,
    refreshPrestations,
    addPrestation,
    updatePrestation,
    deletePrestation,
    refreshPaiements,
    addPaiement,
    updatePaiement,
    deletePaiement,
    generateFactureForPaiement,
    generateRecuForPaiement,
    refreshDepenses,
    addDepense,
    updateDepense,
    deleteDepense,
    comptes,
    refreshAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
}

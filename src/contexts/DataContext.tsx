/**
 * Data Context
 * Manages application data (Clients, Types, Prestations, Paiements)
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Client, TypePrestation, Prestation, Paiement } from '@/types';
import * as sheetsService from '@/services/googleSheets';
import * as docsService from '@/services/googleDocs';
import { generatePaiementID } from '@/utils/validators';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface DataState {
  clients: Client[];
  typesPrestations: TypePrestation[];
  prestations: Prestation[];
  paiements: Paiement[];
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

  // Global
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { isAuthenticated } = useAuth();
  const { error: notifyError, success: notifySuccess } = useNotification();

  const [state, setState] = useState<DataState>({
    clients: [],
    typesPrestations: [],
    prestations: [],
    paiements: [],
    isLoading: false,
    error: null,
  });

  // Load all data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated]);

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
      await sheetsService.updateClient(index, client);
      await refreshClients();
      notifySuccess('Client modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update client';
      notifyError(message);
      throw error;
    }
  }, [refreshClients, notifyError, notifySuccess]);

  const deleteClient = useCallback(async (index: number) => {
    try {
      // Check if client has related prestations or paiements
      const client = state.clients[index];
      const hasPrestations = state.prestations.some(p => p.nom_client === client.nom);
      const hasPaiements = state.paiements.some(p => p.client === client.nom);

      if (hasPrestations || hasPaiements) {
        throw new Error('Ce client a des prestations ou paiements associés. Suppression impossible.');
      }

      await sheetsService.deleteClient(index);
      await refreshClients();
      notifySuccess('Client supprimé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete client';
      notifyError(message);
      throw error;
    }
  }, [state.clients, state.prestations, state.paiements, refreshClients, notifyError, notifySuccess]);

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
      await sheetsService.updateTypePrestation(index, type);
      await refreshTypesPrestations();
      notifySuccess('Type de prestation modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update type';
      notifyError(message);
      throw error;
    }
  }, [refreshTypesPrestations, notifyError, notifySuccess]);

  const deleteTypePrestation = useCallback(async (index: number) => {
    try {
      const type = state.typesPrestations[index];
      const hasPrestations = state.prestations.some(p => p.type_prestation === type.nom);

      if (hasPrestations) {
        throw new Error('Ce type a des prestations associées. Suppression impossible.');
      }

      await sheetsService.deleteTypePrestation(index);
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
      await sheetsService.updatePrestation(index, prestation);
      await refreshPrestations();
      notifySuccess('Prestation modifiée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update prestation';
      notifyError(message);
      throw error;
    }
  }, [refreshPrestations, notifyError, notifySuccess]);

  const deletePrestation = useCallback(async (index: number) => {
    try {
      await sheetsService.deletePrestation(index);
      await refreshPrestations();
      notifySuccess('Prestation supprimée avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete prestation';
      notifyError(message);
      throw error;
    }
  }, [refreshPrestations, notifyError, notifySuccess]);

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
      await sheetsService.updatePaiement(index, paiement);
      await refreshPaiements();
      notifySuccess('Paiement modifié avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update paiement';
      notifyError(message);
      throw error;
    }
  }, [refreshPaiements, notifyError, notifySuccess]);

  const deletePaiement = useCallback(async (index: number) => {
    try {
      await sheetsService.deletePaiement(index);
      await refreshPaiements();
      notifySuccess('Paiement supprimé avec succès');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete paiement';
      notifyError(message);
      throw error;
    }
  }, [refreshPaiements, notifyError, notifySuccess]);

  const generateFactureForPaiement = useCallback(async (index: number): Promise<string> => {
    try {
      const paiement = state.paiements[index];
      if (!paiement) {
        throw new Error('Paiement not found');
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

      await sheetsService.updatePaiement(index, updatedPaiement);
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

      await sheetsService.updatePaiement(index, updatedPaiement);
      await refreshPaiements();
      notifySuccess('Reçu généré avec succès');

      return recuUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate reçu';
      notifyError(message);
      throw error;
    }
  }, [state.paiements, state.clients, state.prestations, refreshPaiements, notifyError, notifySuccess]);

  // ==================== GLOBAL ====================

  const refreshAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [clientsRes, typesRes, prestationsRes, paiementsRes] = await Promise.all([
        sheetsService.getClients(),
        sheetsService.getTypesPrestations(),
        sheetsService.getPrestations(),
        sheetsService.getPaiements(),
      ]);

      setState({
        clients: clientsRes.data,
        typesPrestations: typesRes.data,
        prestations: prestationsRes.data,
        paiements: paiementsRes.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      notifyError(message);
    }
  }, [notifyError]);

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

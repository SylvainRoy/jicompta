import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { DataProvider, useData } from '@/contexts/DataContext'
import * as sheetsService from '@/services/googleSheets'
import * as docsService from '@/services/googleDocs'
import * as setupService from '@/services/googleSetup'
import {
  mockClients,
  mockTypesPrestations,
  mockPrestations,
  mockPaiements,
  mockDepenses,
} from '../../mocks/data'

// ============================================
// Mock setup — all values returned by mock hooks MUST be stable references
// to avoid infinite useCallback/useEffect loops in DataContext.
// ============================================

const hoisted = vi.hoisted(() => {
  const mockNotifyError = vi.fn()
  const mockNotifySuccess = vi.fn()
  const mockWarning = vi.fn()
  const mockInfo = vi.fn()
  const mockAddNotification = vi.fn()
  const mockRemoveNotification = vi.fn()
  const mockLogout = vi.fn()
  const mockHandleGoogleSuccess = vi.fn()
  const mockSaveConfig = vi.fn()
  const mockClearConfig = vi.fn()

  const stableConfig = {
    spreadsheetId: 'mock-spreadsheet-id',
    templateFactureId: 'mock-template-facture-id',
    templateRecuId: 'mock-template-recu-id',
    folderComptabiliteId: 'mock-folder-id',
    folderFacturesId: 'mock-folder-factures-id',
    folderRecusId: 'mock-folder-recus-id',
    setupDate: '2026-01-15',
    version: '2',
    folderName: 'Comptabilite',
  }

  const stableUser = {
    email: 'test@example.com',
    name: 'Test',
    accessToken: 'token',
  }

  // Pre-built stable return values for each hook
  const authValue = {
    isAuthenticated: true,
    user: stableUser,
    isLoading: false,
    error: null,
    logout: mockLogout,
    handleGoogleSuccess: mockHandleGoogleSuccess,
  }

  const configValue = {
    isConfigured: true,
    config: stableConfig,
    saveConfig: mockSaveConfig,
    clearConfig: mockClearConfig,
    getSpreadsheetId: () => 'mock-spreadsheet-id',
    getTemplateFactureId: () => 'mock-template-facture-id',
    getTemplateRecuId: () => 'mock-template-recu-id',
    getFolderFacturesId: () => 'mock-folder-factures-id',
    getFolderRecusId: () => 'mock-folder-recus-id',
  }

  const notificationValue = {
    notifications: [] as unknown[],
    addNotification: mockAddNotification,
    removeNotification: mockRemoveNotification,
    success: mockNotifySuccess,
    error: mockNotifyError,
    warning: mockWarning,
    info: mockInfo,
  }

  return {
    mockNotifyError,
    mockNotifySuccess,
    authValue,
    configValue,
    notificationValue,
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => hoisted.authValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => hoisted.configValue,
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => hoisted.notificationValue,
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/services/googleSheets')
vi.mock('@/services/googleDocs')
vi.mock('@/services/googleSetup')

const mockSheets = vi.mocked(sheetsService)
const mockDocs = vi.mocked(docsService)
const mockSetup = vi.mocked(setupService)

const { mockNotifyError, mockNotifySuccess } = hoisted

// ============================================
// Test helpers
// ============================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>{children}</DataProvider>
)

function setupDefaultMocks() {
  mockSheets.getClients.mockResolvedValue({ data: [...mockClients] })
  mockSheets.getTypesPrestations.mockResolvedValue({ data: [...mockTypesPrestations] })
  mockSheets.getPrestations.mockResolvedValue({ data: [...mockPrestations] })
  mockSheets.getPaiements.mockResolvedValue({ data: [...mockPaiements] })
  mockSheets.getDepenses.mockResolvedValue({ data: [...mockDepenses] })

  mockSheets.addClient.mockResolvedValue(undefined)
  mockSheets.updateClient.mockResolvedValue(undefined)
  mockSheets.deleteClient.mockResolvedValue(undefined)
  mockSheets.addTypePrestation.mockResolvedValue(undefined)
  mockSheets.updateTypePrestation.mockResolvedValue(undefined)
  mockSheets.deleteTypePrestation.mockResolvedValue(undefined)
  mockSheets.addPrestation.mockResolvedValue(undefined)
  mockSheets.updatePrestation.mockResolvedValue(undefined)
  mockSheets.deletePrestation.mockResolvedValue(undefined)
  mockSheets.addPaiement.mockResolvedValue(undefined)
  mockSheets.updatePaiement.mockResolvedValue(undefined)
  mockSheets.deletePaiement.mockResolvedValue(undefined)
  mockSheets.addDepense.mockResolvedValue(undefined)
  mockSheets.updateDepense.mockResolvedValue(undefined)
  mockSheets.deleteDepense.mockResolvedValue(undefined)

  mockSetup.runMigrations.mockResolvedValue(undefined)

  mockDocs.generateFacture.mockResolvedValue('https://drive.google.com/file/new-facture')
  mockDocs.generateRecu.mockResolvedValue('https://drive.google.com/file/new-recu')
}

async function renderDataHook() {
  const hook = renderHook(() => useData(), { wrapper })
  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false)
  })
  return hook
}

// ============================================
// Tests
// ============================================

describe('DataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==================== Initial Load ====================

  describe('refreshAll', () => {
    it('loads all entities on mount', async () => {
      const { result } = await renderDataHook()
      expect(result.current.clients).toHaveLength(3)
      expect(result.current.typesPrestations).toHaveLength(3)
      expect(result.current.prestations).toHaveLength(3)
      expect(result.current.paiements).toHaveLength(2)
      expect(result.current.depenses).toHaveLength(2)
    })

    it('runs migrations before loading data', async () => {
      await renderDataHook()
      expect(mockSetup.runMigrations).toHaveBeenCalledWith('mock-spreadsheet-id')
    })

    it('calls all 5 getters', async () => {
      await renderDataHook()
      expect(mockSheets.getClients).toHaveBeenCalledTimes(1)
      expect(mockSheets.getTypesPrestations).toHaveBeenCalledTimes(1)
      expect(mockSheets.getPrestations).toHaveBeenCalledTimes(1)
      expect(mockSheets.getPaiements).toHaveBeenCalledTimes(1)
      expect(mockSheets.getDepenses).toHaveBeenCalledTimes(1)
    })

    it('sets error state and notifies on failure', async () => {
      mockSheets.getClients.mockRejectedValue(new Error('Network error'))
      const { result } = renderHook(() => useData(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Network error')
      expect(mockNotifyError).toHaveBeenCalledWith('Network error')
    })
  })

  // ==================== Clients ====================

  describe('clients', () => {
    it('addClient calls service, refreshes, and notifies', async () => {
      const { result } = await renderDataHook()
      const newClient = { nom: 'New Client', email: 'new@example.fr' }
      await act(async () => {
        await result.current.addClient(newClient)
      })
      expect(mockSheets.addClient).toHaveBeenCalledWith(newClient)
      expect(mockSheets.getClients).toHaveBeenCalledTimes(2) // initial + refresh
      expect(mockNotifySuccess).toHaveBeenCalledWith('Client ajouté avec succès')
    })

    it('updateClient calls service with actual _rowNumber', async () => {
      const { result } = await renderDataHook()
      const updated = { ...mockClients[1], email: 'updated@example.fr' }
      await act(async () => {
        await result.current.updateClient(1, updated)
      })
      // mockClients[1]._rowNumber = 1
      expect(mockSheets.updateClient).toHaveBeenCalledWith(1, updated)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Client modifié avec succès')
    })

    it('getClientByName returns matching client', async () => {
      const { result } = await renderDataHook()
      const client = result.current.getClientByName('Dupont SARL')
      expect(client).toBeDefined()
      expect(client?.email).toBe('dupont@example.fr')
    })

    it('getClientByName returns undefined for unknown name', async () => {
      const { result } = await renderDataHook()
      expect(result.current.getClientByName('Unknown')).toBeUndefined()
    })

    it('deleteClient succeeds for client with no relations', async () => {
      const isolatedClients = [
        ...mockClients,
        { nom: 'Isolated Client', email: 'isolated@example.fr', _rowNumber: 3 },
      ]
      mockSheets.getClients.mockResolvedValue({ data: isolatedClients })

      const { result } = await renderDataHook()
      await act(async () => {
        await result.current.deleteClient(3)
      })
      expect(mockSheets.deleteClient).toHaveBeenCalledWith(3)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Client supprimé avec succès')
    })

    it('deleteClient rejects client with prestations', async () => {
      const { result } = await renderDataHook()
      // mockClients[0] = 'Dupont SARL' has prestations
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deleteClient(0) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('prestations ou paiements associés')
      expect(mockSheets.deleteClient).not.toHaveBeenCalled()
      expect(mockNotifyError).toHaveBeenCalledWith(
        expect.stringContaining('prestations ou paiements')
      )
    })

    it('deleteClient rejects client with paiements', async () => {
      const { result } = await renderDataHook()
      // mockClients[1] = 'Martin & Co' has paiements
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deleteClient(1) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('prestations ou paiements associés')
      expect(mockSheets.deleteClient).not.toHaveBeenCalled()
    })

    it('deleteClient rejects client with depenses only', async () => {
      const clientsWithDepenseOnly = [
        { nom: 'Depense Client', email: 'dep@example.fr', _rowNumber: 0 },
      ]
      const depensesForClient = [
        { date: '2026-03-01', compte: 'Depense Client', montant: 100, description: 'test', _rowNumber: 0 },
      ]
      mockSheets.getClients.mockResolvedValue({ data: clientsWithDepenseOnly })
      mockSheets.getPrestations.mockResolvedValue({ data: [] })
      mockSheets.getPaiements.mockResolvedValue({ data: [] })
      mockSheets.getDepenses.mockResolvedValue({ data: depensesForClient })

      const { result } = await renderDataHook()
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deleteClient(0) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('dépenses ou prestations associatives')
      expect(mockSheets.deleteClient).not.toHaveBeenCalled()
    })

    it('addClient propagates service errors', async () => {
      mockSheets.addClient.mockRejectedValue(new Error('API quota exceeded'))
      const { result } = await renderDataHook()
      let error: Error | undefined
      await act(async () => {
        try { await result.current.addClient({ nom: 'X', email: 'x@x.fr' }) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toBe('API quota exceeded')
      expect(mockNotifyError).toHaveBeenCalledWith('API quota exceeded')
    })
  })

  // ==================== Types Prestations ====================

  describe('typesPrestations', () => {
    it('addTypePrestation calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      const newType = { nom: 'Audit', montant_suggere: 750 }
      await act(async () => {
        await result.current.addTypePrestation(newType)
      })
      expect(mockSheets.addTypePrestation).toHaveBeenCalledWith(newType)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Type de prestation ajouté avec succès')
    })

    it('updateTypePrestation calls service with actual _rowNumber', async () => {
      const { result } = await renderDataHook()
      const updated = { ...mockTypesPrestations[2], montant_suggere: 900 }
      await act(async () => {
        await result.current.updateTypePrestation(2, updated)
      })
      expect(mockSheets.updateTypePrestation).toHaveBeenCalledWith(2, updated)
    })

    it('deleteTypePrestation succeeds for type with no prestations', async () => {
      // 'Développement' (index 2) has no prestations in mock data
      const { result } = await renderDataHook()
      await act(async () => {
        await result.current.deleteTypePrestation(2)
      })
      expect(mockSheets.deleteTypePrestation).toHaveBeenCalledWith(2)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Type de prestation supprimé avec succès')
    })

    it('deleteTypePrestation rejects type with linked prestations', async () => {
      const { result } = await renderDataHook()
      // mockTypesPrestations[0] = 'Conseil' used by prestations[0] and prestations[2]
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deleteTypePrestation(0) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('prestations associées')
      expect(mockSheets.deleteTypePrestation).not.toHaveBeenCalled()
    })

    it('deleteTypePrestation rejects "Formation" with linked prestation', async () => {
      const { result } = await renderDataHook()
      // mockTypesPrestations[1] = 'Formation' used by prestations[1]
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deleteTypePrestation(1) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('prestations associées')
    })
  })

  // ==================== Prestations ====================

  describe('prestations', () => {
    it('addPrestation calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      const newPrestation = {
        date: '2026-03-20',
        nom_client: 'Dupont SARL',
        type_prestation: 'Conseil',
        montant: 600,
      }
      await act(async () => {
        await result.current.addPrestation(newPrestation)
      })
      expect(mockSheets.addPrestation).toHaveBeenCalledWith(newPrestation)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Prestation ajoutée avec succès')
    })

    it('updatePrestation calls service with actual _rowNumber', async () => {
      const { result } = await renderDataHook()
      const updated = { ...mockPrestations[0], montant: 750 }
      await act(async () => {
        await result.current.updatePrestation(0, updated)
      })
      expect(mockSheets.updatePrestation).toHaveBeenCalledWith(0, updated)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Prestation modifiée avec succès')
    })

    it('updatePrestation rejects invalid index', async () => {
      const { result } = await renderDataHook()
      let error: Error | undefined
      await act(async () => {
        try { await result.current.updatePrestation(99, mockPrestations[0]) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('Invalid prestation index: 99')
    })

    it('deletePrestation calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      await act(async () => {
        await result.current.deletePrestation(0)
      })
      expect(mockSheets.deletePrestation).toHaveBeenCalledWith(0)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Prestation supprimée avec succès')
    })

    it('deletePrestation rejects invalid index', async () => {
      const { result } = await renderDataHook()
      let error: Error | undefined
      await act(async () => {
        try { await result.current.deletePrestation(-1) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('Invalid prestation index: -1')
    })
  })

  // ==================== Paiements ====================

  describe('paiements', () => {
    it('addPaiement generates reference, adds, and links prestations', async () => {
      const { result } = await renderDataHook()

      // Set fake timers AFTER render so waitFor works, but before the
      // mutation so generatePaiementID uses the controlled date.
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 2, 20)) // March 20, 2026

      const newPaiement = {
        reference: '',
        client: 'Dupont SARL',
        total: 500,
      }
      await act(async () => {
        await result.current.addPaiement(newPaiement, [0])
      })

      expect(mockSheets.addPaiement).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: expect.stringMatching(/^260320\d{4}$/),
          client: 'Dupont SARL',
          total: 500,
        })
      )

      // Should update the linked prestation with paiement_id
      expect(mockSheets.updatePrestation).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          paiement_id: expect.stringMatching(/^260320\d{4}$/),
        })
      )

      expect(mockNotifySuccess).toHaveBeenCalledWith('Paiement créé avec succès')
      vi.useRealTimers()
    })

    it('addPaiement rejects associative prestations', async () => {
      const { result } = await renderDataHook()
      const paiement = { reference: '', client: 'Association Locale', total: 300 }

      let error: Error | undefined
      await act(async () => {
        try { await result.current.addPaiement(paiement, [2]) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('prestations associatives')
      expect(mockSheets.addPaiement).not.toHaveBeenCalled()
    })

    it('updatePaiement calls service with actual _rowNumber', async () => {
      const { result } = await renderDataHook()
      const updated = { ...mockPaiements[1], mode_encaissement: 'cheque' as const }
      await act(async () => {
        await result.current.updatePaiement(1, updated)
      })
      expect(mockSheets.updatePaiement).toHaveBeenCalledWith(1, updated)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Paiement modifié avec succès')
    })

    it('deletePaiement calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      await act(async () => {
        await result.current.deletePaiement(0)
      })
      expect(mockSheets.deletePaiement).toHaveBeenCalledWith(0)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Paiement supprimé avec succès')
    })
  })

  // ==================== PDF Generation ====================

  describe('generateFactureForPaiement', () => {
    it('generates facture, updates paiement, and returns URL', async () => {
      const { result } = await renderDataHook()
      let url: string = ''
      await act(async () => {
        url = await result.current.generateFactureForPaiement(0)
      })
      expect(url).toBe('https://drive.google.com/file/new-facture')
      expect(mockDocs.generateFacture).toHaveBeenCalledWith(
        mockPaiements[0],
        expect.objectContaining({ nom: 'Martin & Co' }),
        expect.arrayContaining([expect.objectContaining({ paiement_id: '2603050001' })])
      )
      expect(mockSheets.updatePaiement).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ facture: 'https://drive.google.com/file/new-facture' })
      )
      expect(mockNotifySuccess).toHaveBeenCalledWith('Facture générée avec succès')
    })

    it('throws when paiement not found', async () => {
      const { result } = await renderDataHook()
      let error: Error | undefined
      await act(async () => {
        try { await result.current.generateFactureForPaiement(99) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toBe('Paiement not found')
    })

    it('throws when client not found for paiement', async () => {
      const orphanPaiements = [
        { reference: '2603200001', client: 'Ghost Client', total: 100, _rowNumber: 0 },
      ]
      mockSheets.getPaiements.mockResolvedValue({ data: orphanPaiements })
      const { result } = await renderDataHook()

      let error: Error | undefined
      await act(async () => {
        try { await result.current.generateFactureForPaiement(0) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toBe('Client not found')
    })
  })

  describe('generateRecuForPaiement', () => {
    it('generates recu for encaissé paiement', async () => {
      const { result } = await renderDataHook()
      let url: string = ''
      await act(async () => {
        url = await result.current.generateRecuForPaiement(0)
      })
      expect(url).toBe('https://drive.google.com/file/new-recu')
      expect(mockDocs.generateRecu).toHaveBeenCalled()
      expect(mockSheets.updatePaiement).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ recu: 'https://drive.google.com/file/new-recu' })
      )
      expect(mockNotifySuccess).toHaveBeenCalledWith('Reçu généré avec succès')
    })

    it('rejects non-encaissé paiement', async () => {
      const { result } = await renderDataHook()
      // mockPaiements[1] has no date_encaissement
      let error: Error | undefined
      await act(async () => {
        try { await result.current.generateRecuForPaiement(1) }
        catch (e) { error = e as Error }
      })
      expect(error?.message).toContain('not yet encaissé')
      expect(mockDocs.generateRecu).not.toHaveBeenCalled()
    })
  })

  // ==================== Depenses ====================

  describe('depenses', () => {
    it('addDepense calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      const newDepense = {
        date: '2026-03-20',
        compte: 'Mon compte',
        montant: 200,
        description: 'New expense',
      }
      await act(async () => {
        await result.current.addDepense(newDepense)
      })
      expect(mockSheets.addDepense).toHaveBeenCalledWith(newDepense)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Dépense ajoutée avec succès')
    })

    it('updateDepense calls service with actual _rowNumber', async () => {
      const { result } = await renderDataHook()
      const updated = { ...mockDepenses[0], montant: 200 }
      await act(async () => {
        await result.current.updateDepense(0, updated)
      })
      expect(mockSheets.updateDepense).toHaveBeenCalledWith(0, updated)
    })

    it('deleteDepense calls service and refreshes', async () => {
      const { result } = await renderDataHook()
      await act(async () => {
        await result.current.deleteDepense(1)
      })
      expect(mockSheets.deleteDepense).toHaveBeenCalledWith(1)
      expect(mockNotifySuccess).toHaveBeenCalledWith('Dépense supprimée avec succès')
    })
  })

  // ==================== Comptes ====================

  describe('comptes', () => {
    it('calculates Mon compte balance from encaissed paiements minus depenses', async () => {
      const { result } = await renderDataHook()
      const monCompte = result.current.comptes.find(c => c.nom === 'Mon compte')
      expect(monCompte).toBeDefined()
      // Encaissed: mockPaiements[0].total = 1200
      // Depenses Mon compte: mockDepenses[0].montant = 150
      // Balance = 1200 - 150 = 1050
      expect(monCompte!.balance).toBe(1050)
    })

    it('calculates client account from associatif prestations minus depenses', async () => {
      const { result } = await renderDataHook()
      const assoCompte = result.current.comptes.find(c => c.nom === 'Association Locale')
      expect(assoCompte).toBeDefined()
      // Associatif prestations: mockPrestations[2].montant = 300
      // Depenses: mockDepenses[1].montant = 50
      // Balance = 300 - 50 = 250
      expect(assoCompte!.balance).toBe(250)
    })

    it('does not create account for client without associatif or depenses', async () => {
      const { result } = await renderDataHook()
      const dupontCompte = result.current.comptes.find(c => c.nom === 'Dupont SARL')
      expect(dupontCompte).toBeUndefined()
    })

    it('Mon compte only counts encaissed paiements', async () => {
      const { result } = await renderDataHook()
      const monCompte = result.current.comptes.find(c => c.nom === 'Mon compte')
      // Only mockPaiements[0] is encaissé
      expect(monCompte!.paiements).toHaveLength(1)
      expect(monCompte!.paiements![0].reference).toBe('2603050001')
    })

    it('Mon compte depenses only include "Mon compte" entries', async () => {
      const { result } = await renderDataHook()
      const monCompte = result.current.comptes.find(c => c.nom === 'Mon compte')
      expect(monCompte!.depenses).toHaveLength(1)
      expect(monCompte!.depenses![0].description).toBe('Fournitures de bureau')
    })
  })
})

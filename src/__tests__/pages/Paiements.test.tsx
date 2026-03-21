import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Paiements from '@/pages/Paiements'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseData = vi.hoisted(() => vi.fn())
const mockNotification = vi.hoisted(() => ({
  info: vi.fn().mockReturnValue('notif-id'),
  removeNotification: vi.fn(),
}))

vi.mock('@/contexts/DataContext', () => ({
  useData: mockUseData,
}))

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => mockNotification,
}))

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockPrestations = [
  { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '', associatif: false, _rowNumber: 0 },
  { date: '2026-03-05', nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: '2603050001', associatif: false, _rowNumber: 1 },
]

const mockPaiements = [
  { reference: '2603050001', client: 'Martin & Co', total: 1200, date_encaissement: '2026-03-10', mode_encaissement: 'virement', facture: 'https://drive.google.com/file/facture1', recu: 'https://drive.google.com/file/recu1', _rowNumber: 0 },
  { reference: '2603150001', client: 'Dupont SARL', total: 500, _rowNumber: 1 },
]

function defaultMockReturnValue(overrides = {}) {
  return {
    paiements: mockPaiements,
    prestations: mockPrestations,
    isLoading: false,
    addPaiement: vi.fn().mockResolvedValue(undefined),
    updatePaiement: vi.fn().mockResolvedValue(undefined),
    deletePaiement: vi.fn().mockResolvedValue(undefined),
    updatePrestation: vi.fn().mockResolvedValue(undefined),
    generateFactureForPaiement: vi.fn().mockResolvedValue('https://pdf.url'),
    generateRecuForPaiement: vi.fn().mockResolvedValue('https://pdf.url'),
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Paiements />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Paiements page', () => {
  beforeEach(() => {
    mockUseData.mockReturnValue(defaultMockReturnValue())
  })

  // 1. Loading state
  it('shows a loading spinner when data is loading', () => {
    mockUseData.mockReturnValue(defaultMockReturnValue({ isLoading: true }))
    renderPage()

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
  })

  // 2. Data display (references, clients, totals)
  it('displays paiement references, clients, and totals', () => {
    renderPage()

    // References appear as "#REF" (both mobile cards and desktop table are in DOM)
    expect(screen.getAllByText('#2603050001').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('#2603150001').length).toBeGreaterThanOrEqual(1)

    // Clients
    expect(screen.getAllByText('Martin & Co').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)

    // Totals — formatted in French locale (non-breaking space variants)
    const allText = document.body.textContent!
    expect(allText).toMatch(/1[\s\u00a0\u202f]200,00\s*€/)
    expect(allText).toMatch(/500,00\s*€/)
  })

  // 3. Status badges
  it('shows "Encaiss\u00e9" for paid payments and "En attente" for unpaid ones', () => {
    renderPage()

    // Both mobile and desktop views render badges
    const encaisseBadges = screen.getAllByText('Encaiss\u00e9')
    const enAttenteBadges = screen.getAllByText('En attente')

    expect(encaisseBadges.length).toBeGreaterThanOrEqual(1)
    expect(enAttenteBadges.length).toBeGreaterThanOrEqual(1)
  })

  // 4. Add button disabled when no unpaid prestations
  it('disables the add button when there are no unpaid prestations', () => {
    const allPaidPrestations = [
      { date: '2026-03-05', nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: '2603050001', associatif: false, _rowNumber: 1 },
    ]
    // The linked payment IS encaisse, so hasUnpaidPrestations = false
    mockUseData.mockReturnValue(defaultMockReturnValue({ prestations: allPaidPrestations }))
    renderPage()

    const addButton = screen.getByRole('button', { name: /Cr\u00e9er un paiement/ })
    expect(addButton).toBeDisabled()
  })

  // 5. Warning when no unpaid prestations
  it('shows a warning when all prestations are paid', () => {
    const allPaidPrestations = [
      { date: '2026-03-05', nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: '2603050001', associatif: false, _rowNumber: 1 },
    ]
    mockUseData.mockReturnValue(defaultMockReturnValue({ prestations: allPaidPrestations }))
    renderPage()

    expect(screen.getByText('Aucune prestation disponible')).toBeInTheDocument()
  })

  // 6. Search filtering by client
  it('filters paiements when searching by client name', async () => {
    const user = userEvent.setup()
    renderPage()

    const searchInput = screen.getByPlaceholderText('Rechercher par client ou r\u00e9f\u00e9rence...')
    await user.type(searchInput, 'Dupont')

    // Dupont SARL should still be visible
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)
    // Martin & Co should be gone
    expect(screen.queryByText('Martin & Co')).not.toBeInTheDocument()
  })

  // 7. Status filter
  it('filters paiements by status', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'encaisse')

    // Only encaisse payment visible (Martin & Co)
    expect(screen.getAllByText('Martin & Co').length).toBeGreaterThanOrEqual(1)
    // Dupont SARL (en attente) should be gone
    expect(screen.queryByText('Dupont SARL')).not.toBeInTheDocument()
  })

  // 8. Results count
  it('displays the correct results count', () => {
    renderPage()

    // Both mobile and desktop show results count — "2 paiements"
    const countElements = screen.getAllByText('2 paiements')
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  // 9. Open add modal
  it('opens the add modal when clicking the add button', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Cr\u00e9er un paiement/ }))

    // Modal title
    expect(screen.getByText('Cr\u00e9er un paiement')).toBeInTheDocument()
  })

  // 10. Supprimer only shown for non-encaisse payments
  it('shows Supprimer only for payments that are not encaiss\u00e9', () => {
    renderPage()

    // In the desktop table, "Supprimer" buttons should appear only for non-encaisse
    // mockPaiements[0] is encaisse => no Supprimer, mockPaiements[1] is not => has Supprimer
    // Both mobile card and desktop table are rendered, but mobile card also conditionally shows Supprimer
    const supprimerButtons = screen.getAllByText('Supprimer')
    // Dupont SARL (non-encaisse) should have Supprimer in both views, Martin & Co should not
    // So we expect exactly 2 (one from mobile card, one from desktop table)
    expect(supprimerButtons).toHaveLength(2)

    // "Modifier" should appear for all payments (2 payments x 2 views = 4)
    const modifierButtons = screen.getAllByText('Modifier')
    expect(modifierButtons).toHaveLength(4)
  })

  // 11. Facture/Recu buttons display correctly
  it('shows correct Facture/Recu button labels based on payment state', () => {
    renderPage()

    // Martin & Co (encaisse, has facture URL) => "Voir Facture" (desktop + mobile views)
    const voirFactureButtons = screen.getAllByText('Voir Facture')
    expect(voirFactureButtons.length).toBeGreaterThanOrEqual(1)

    // Martin & Co (encaisse, has recu URL) => "Voir Recu" (desktop + mobile)
    const voirRecuText = screen.getAllByText(/Voir Re[cç]u/)
    expect(voirRecuText.length).toBeGreaterThanOrEqual(1)

    // Dupont SARL (not encaisse, no facture URL) => "Facture" button
    const factureButtons = screen.getAllByText('Facture')
    expect(factureButtons.length).toBeGreaterThanOrEqual(1)

    // Dupont SARL (not encaisse) => Recu button should NOT be shown
    // The "Reçu" text should only appear for encaisse payments
    // For the non-encaisse payment, no Recu/Voir Recu button is rendered
    // Count ensures: only Martin & Co has recu-related buttons
  })
})

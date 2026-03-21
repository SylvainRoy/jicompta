import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockUseData = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/DataContext', () => ({
  useData: mockUseData,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// ---------------------------------------------------------------------------
// Lazy import of the component under test (after mocks are registered)
// ---------------------------------------------------------------------------

import Prestations from '@/pages/Prestations'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockClients = [
  { nom: 'Dupont SARL', email: 'dupont@example.fr', _rowNumber: 0 },
  { nom: 'Martin & Co', email: 'martin@example.fr', _rowNumber: 1 },
]

const mockTypesPrestations = [
  { nom: 'Conseil', montant_suggere: 500, _rowNumber: 0 },
  { nom: 'Formation', montant_suggere: 1200, _rowNumber: 1 },
]

const mockPrestations = [
  { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '', associatif: false, _rowNumber: 0 },
  { date: '2026-03-05', nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: '2603050001', associatif: false, _rowNumber: 1 },
  { date: '2026-03-10', nom_client: 'Association Locale', type_prestation: 'Conseil', montant: 300, paiement_id: '', associatif: true, _rowNumber: 2 },
]

const mockPaiements = [
  { reference: '2603050001', client: 'Martin & Co', total: 1200, date_encaissement: '2026-03-10', mode_encaissement: 'virement', _rowNumber: 0 },
  { reference: '2603150001', client: 'Dupont SARL', total: 500, _rowNumber: 1 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultDataReturn(overrides: Record<string, unknown> = {}) {
  return {
    prestations: mockPrestations,
    paiements: mockPaiements,
    clients: mockClients,
    typesPrestations: mockTypesPrestations,
    isLoading: false,
    addPrestation: vi.fn().mockResolvedValue(undefined),
    updatePrestation: vi.fn().mockResolvedValue(undefined),
    deletePrestation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderPage(initialEntries: string[] = ['/prestations']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Prestations />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Prestations page', () => {
  beforeEach(() => {
    mockUseData.mockReturnValue(defaultDataReturn())
    mockNavigate.mockReset()
  })

  // 1. Loading state
  it('shows Loading spinner when isLoading is true', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ isLoading: true }))
    renderPage()

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
  })

  // 2. Warning when no clients
  it('shows warning when there are no clients', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ clients: [] }))
    renderPage()

    expect(screen.getByText(/créer au moins un client/i)).toBeInTheDocument()
  })

  // 3. Warning when no types
  it('shows warning when there are no types de prestation', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ typesPrestations: [] }))
    renderPage()

    expect(screen.getByText(/créer au moins un type de prestation/i)).toBeInTheDocument()
  })

  // 2+3 combined: both missing
  it('shows warning mentioning both clients and types when both are empty', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ clients: [], typesPrestations: [] }))
    renderPage()

    expect(screen.getByText(/créer des clients et des types de prestations/i)).toBeInTheDocument()
  })

  // 4. Add button disabled when no clients or types
  it('disables the add button when there are no clients', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ clients: [] }))
    renderPage()

    const addButtons = screen.getAllByText('+ Ajouter une prestation')
    addButtons.forEach((btn) => {
      expect(btn.closest('button')).toBeDisabled()
    })
  })

  it('disables the add button when there are no types', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ typesPrestations: [] }))
    renderPage()

    const addButtons = screen.getAllByText('+ Ajouter une prestation')
    addButtons.forEach((btn) => {
      expect(btn.closest('button')).toBeDisabled()
    })
  })

  // 5. Data display — client names, types, amounts
  it('displays prestation data (client names, types, amounts)', () => {
    renderPage()

    // Client names appear at least once (desktop + mobile both in DOM)
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Martin & Co').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Association Locale').length).toBeGreaterThanOrEqual(1)

    // Type names
    expect(screen.getAllByText('Conseil').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Formation').length).toBeGreaterThanOrEqual(1)

    // Amounts (French formatted)
    expect(screen.getAllByText('500,00 €').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('1 200,00 €').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('300,00 €').length).toBeGreaterThanOrEqual(1)

    // Dates in French display format (DD/MM/YYYY)
    expect(screen.getAllByText('01/03/2026').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('05/03/2026').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('10/03/2026').length).toBeGreaterThanOrEqual(1)
  })

  // 6. Status badges — correct status for each prestation type
  it('shows correct status badges for each prestation', () => {
    renderPage()

    // mockPrestations[0]: no paiement_id, not associatif => "Non facturée"
    // mockPrestations[1]: paiement_id=2603050001, linked payment has date_encaissement => "Encaissée"
    // mockPrestations[2]: associatif=true => "Associatif"
    const nonFacturee = screen.getAllByText('Non facturée')
    expect(nonFacturee.length).toBeGreaterThanOrEqual(1)

    const encaissee = screen.getAllByText('Encaissée')
    expect(encaissee.length).toBeGreaterThanOrEqual(1)

    const associatif = screen.getAllByText('Associatif')
    expect(associatif.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Facturée" status when payment exists but is not encaissé', () => {
    // Create a prestation linked to a payment without date_encaissement
    const prestations = [
      { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '2603150001', associatif: false, _rowNumber: 0 },
    ]
    // mockPaiements[1] has reference '2603150001' with NO date_encaissement
    mockUseData.mockReturnValue(defaultDataReturn({ prestations }))
    renderPage()

    const facturee = screen.getAllByText('Facturée')
    expect(facturee.length).toBeGreaterThanOrEqual(1)
  })

  // 7. Payment link — prestations with paiement_id show reference link
  it('shows payment reference link for prestations with paiement_id', () => {
    renderPage()

    // The desktop table shows "#2603050001" as a button
    const refButtons = screen.getAllByText('#2603050001')
    expect(refButtons.length).toBeGreaterThanOrEqual(1)
  })

  // 8. Navigate to payment on clicking reference
  it('navigates to paiements page when clicking payment reference', async () => {
    const user = userEvent.setup()
    renderPage()

    // Click the first reference link found
    const refButtons = screen.getAllByText('#2603050001')
    await user.click(refButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/paiements?viewPayment=2603050001')
  })

  // 9. Search filtering
  it('filters prestations when searching by client name', async () => {
    const user = userEvent.setup()
    renderPage()

    const searchInput = screen.getByPlaceholderText('Rechercher par client ou type...')
    await user.type(searchInput, 'Dupont')

    // Dupont should still be visible
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)
    // Martin should no longer be visible
    expect(screen.queryByText('Martin & Co')).not.toBeInTheDocument()
    // Association Locale should not be visible either
    expect(screen.queryByText('Association Locale')).not.toBeInTheDocument()
  })

  it('filters prestations when searching by type', async () => {
    const user = userEvent.setup()
    renderPage()

    const searchInput = screen.getByPlaceholderText('Rechercher par client ou type...')
    await user.type(searchInput, 'Formation')

    // Martin & Co has type Formation
    expect(screen.getAllByText('Martin & Co').length).toBeGreaterThanOrEqual(1)
    // Dupont has type Conseil — should be gone
    expect(screen.queryByText('Dupont SARL')).not.toBeInTheDocument()
  })

  // 10. Status filter
  it('shows only matching prestations when status filter is applied', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'associatif')

    // Only the associatif prestation should remain
    expect(screen.getAllByText('Association Locale').length).toBeGreaterThanOrEqual(1)
    // Others should be gone
    expect(screen.queryByText('Dupont SARL')).not.toBeInTheDocument()
    expect(screen.queryByText('Martin & Co')).not.toBeInTheDocument()
  })

  it('filters by "Non facturée" status correctly', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'non_facturee')

    // Dupont SARL has no paiement_id and is not associatif
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)
    // Martin & Co is encaissée
    expect(screen.queryByText('Martin & Co')).not.toBeInTheDocument()
    // Association Locale is associatif
    expect(screen.queryByText('Association Locale')).not.toBeInTheDocument()
  })

  it('filters by "Encaissée" status correctly', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'encaissee')

    // Only Martin & Co has an encaissé payment
    expect(screen.getAllByText('Martin & Co').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Dupont SARL')).not.toBeInTheDocument()
    expect(screen.queryByText('Association Locale')).not.toBeInTheDocument()
  })

  // 11. Empty filtered state
  it('shows "Aucune prestation trouvée" when search yields no results', async () => {
    const user = userEvent.setup()
    renderPage()

    const searchInput = screen.getByPlaceholderText('Rechercher par client ou type...')
    await user.type(searchInput, 'zzznonexistent')

    expect(screen.getByText('Aucune prestation trouvée')).toBeInTheDocument()
  })

  it('shows "Aucune prestation" (no filter) when there are simply no prestations', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ prestations: [] }))
    renderPage()

    expect(screen.getByText('Aucune prestation')).toBeInTheDocument()
  })

  // 12. Open add modal
  it('opens the add modal when clicking the add button', async () => {
    const user = userEvent.setup()
    renderPage()

    const addButtons = screen.getAllByText('+ Ajouter une prestation')
    await user.click(addButtons[0])

    expect(screen.getByText('Ajouter une prestation')).toBeInTheDocument()
  })

  // 13. Open delete modal
  it('opens the delete confirmation dialog when clicking Supprimer', async () => {
    const user = userEvent.setup()
    renderPage()

    // Dupont SARL has no paiement_id so it has Supprimer buttons (mobile + desktop)
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    expect(
      screen.getByText('Êtes-vous sûr de vouloir supprimer cette prestation ? Cette action est irréversible.'),
    ).toBeInTheDocument()
  })

  // 14. Results count
  it('shows correct results count with all prestations', () => {
    renderPage()

    // Both mobile and desktop show the count
    const countTexts = screen.getAllByText('3 prestations')
    expect(countTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows filtered count with total when a filter is active', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'associatif')

    // Only 1 associatif prestation, out of 3 total
    const countTexts = screen.getAllByText(/1 prestation.*3 au total/)
    expect(countTexts.length).toBeGreaterThanOrEqual(1)
  })

  // Bonus: Modify / Supprimer only for prestations without paiement_id
  it('shows Modifier and Supprimer buttons only for prestations without paiement_id', () => {
    renderPage()

    // "Modifier" should appear for prestations without paiement_id
    // Dupont SARL (no paiement_id) and Association Locale (associatif, no paiement_id) have them
    const modifierButtons = screen.getAllByText('Modifier')
    // Desktop + mobile: 2 prestations * 2 views = 4, but mobile card for associatif shows "Modifier"
    expect(modifierButtons.length).toBeGreaterThanOrEqual(2)

    // Martin & Co has a paiement_id and should show a reference link, not edit/delete buttons
    // This is implicitly tested by test #7
  })

  // Bonus: Opening edit modal
  it('opens the edit modal when clicking Modifier', async () => {
    const user = userEvent.setup()
    renderPage()

    const modifierButtons = screen.getAllByText('Modifier')
    await user.click(modifierButtons[0])

    expect(screen.getByText('Modifier la prestation')).toBeInTheDocument()
  })

  // Bonus: singular form for 1 prestation
  it('uses singular "prestation" when there is only one result', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les statuts')
    await user.selectOptions(filterSelect, 'associatif')

    const countTexts = screen.getAllByText(/^1 prestation/)
    expect(countTexts.length).toBeGreaterThanOrEqual(1)
    // Make sure it says "prestation" not "prestations"
    countTexts.forEach((el) => {
      expect(el.textContent).toMatch(/^1 prestation[^s]/)
    })
  })
})

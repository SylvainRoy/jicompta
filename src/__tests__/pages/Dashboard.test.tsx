import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const mockUseData = vi.hoisted(() => vi.fn())
const mockNavigate = vi.hoisted(() => vi.fn())
const mockNotification = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
const mockGenerateTaxReport = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/DataContext', () => ({
  useData: mockUseData,
}))

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => mockNotification,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/services/googleDocs', () => ({
  generateTaxReport: mockGenerateTaxReport,
}))

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks are wired
// ---------------------------------------------------------------------------
import Dashboard from '@/pages/Dashboard'

// ---------------------------------------------------------------------------
// Test data - uses current year so the year selector defaults to it
// ---------------------------------------------------------------------------
const YEAR = new Date().getFullYear()
const Y = String(YEAR)
const YY = Y.slice(2)

const mockClients = [
  { nom: 'Dupont SARL', email: 'dupont@example.fr', _rowNumber: 0 },
  { nom: 'Martin & Co', email: 'martin@example.fr', _rowNumber: 1 },
  { nom: 'Association Locale', email: 'asso@example.fr', _rowNumber: 2 },
]

const mockTypesPrestations = [
  { nom: 'Conseil', montant_suggere: 500, _rowNumber: 0 },
]

const mockPrestations = [
  { date: `${Y}-03-01`, nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '', associatif: false, _rowNumber: 0 },
  { date: `${Y}-03-05`, nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: `${YY}03050001`, associatif: false, _rowNumber: 1 },
  { date: `${Y}-03-10`, nom_client: 'Association Locale', type_prestation: 'Conseil', montant: 300, paiement_id: '', associatif: true, _rowNumber: 2 },
]

const mockPaiements = [
  { reference: `${YY}03050001`, client: 'Martin & Co', total: 1200, date_encaissement: `${Y}-03-10`, mode_encaissement: 'virement', _rowNumber: 0 },
  { reference: `${YY}03150001`, client: 'Dupont SARL', total: 500, _rowNumber: 1 },
]

const mockDepenses = [
  { date: `${Y}-03-02`, compte: 'Mon compte', montant: 150, description: 'Fournitures', _rowNumber: 0 },
]

const mockComptes = [
  { nom: 'Mon compte', balance: 1050, paiements: [mockPaiements[0]], depenses: mockDepenses },
  { nom: 'Association Locale', balance: 250, prestations: [mockPrestations[2]], depenses: [] },
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
    depenses: mockDepenses,
    comptes: mockComptes,
    isLoading: false,
    ...overrides,
  }
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

/**
 * Find the Prestations stats section (the blue section with h2 "Prestations").
 * Returns the section container element.
 */
function getPrestationsSection(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Prestations' })
  // Walk up to the section-level div (has class bg-gradient-to-br)
  return heading.closest('.bg-gradient-to-br')! as HTMLElement
}

function getPaiementsSection(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Paiements' })
  return heading.closest('.bg-gradient-to-br')! as HTMLElement
}

function getClientsSection(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Clients' })
  return heading.closest('.bg-gradient-to-br')! as HTMLElement
}

function getComptesSection(): HTMLElement {
  const heading = screen.getByRole('heading', { name: 'Comptes' })
  return heading.closest('.bg-gradient-to-br')! as HTMLElement
}

/** Helper to find a bottom-list panel by its heading text. */
function getBottomList(headingText: string): HTMLElement {
  const heading = screen.getByText(headingText, { selector: 'h3' })
  // The panel is the closest rounded-lg shadow-md ancestor
  return heading.closest('.rounded-lg.shadow-md')! as HTMLElement
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseData.mockReturnValue(defaultDataReturn())
  })

  // 1. Loading state
  it('shows loading spinner when isLoading is true', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ isLoading: true }))
    renderDashboard()

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
    expect(screen.queryByText('Tableau de bord')).not.toBeInTheDocument()
  })

  // 2. Page title
  it('shows page title and subtitle', () => {
    renderDashboard()

    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument()
    expect(screen.getByText("Vue d'ensemble de votre activité")).toBeInTheDocument()
  })

  // 3. Year selector
  it('shows year selector with available years and "Toutes" option', () => {
    renderDashboard()

    const select = screen.getByLabelText(/Année/i)
    expect(select).toBeInTheDocument()

    const options = within(select as HTMLElement).getAllByRole('option')
    const optionTexts = options.map((o) => o.textContent)
    expect(optionTexts).toContain('Toutes')
    expect(optionTexts).toContain(Y)
  })

  // 4. Prestations stats (excluding associatif)
  it('shows correct prestation count and total amount (excluding associatif)', () => {
    renderDashboard()
    const section = getPrestationsSection()

    // "2 prestations (1 700,00 EUR) sur l'annee YEAR."
    const summaryP = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return t.includes('2') && t.includes('prestations') && /1[\s\u202f\u00a0]700,00/.test(t) && t.includes(Y)
    })
    expect(summaryP).toBeInTheDocument()
  })

  // 5. Prestations sans paiement
  it('shows correct count of prestations without payment', () => {
    renderDashboard()
    const section = getPrestationsSection()

    // "dont 1 prestation (500,00 EUR) n'a pas de paiement"
    const text = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return t.includes('dont') && t.includes('pas de paiement') && /500,00/.test(t)
    })
    expect(text).toBeInTheDocument()
  })

  // 6. Paiements encaisses
  it('shows correct encaisse count and amount', () => {
    renderDashboard()
    const section = getPaiementsSection()

    // "1 paiement (1 200,00 EUR) encaisse sur l'annee YEAR"
    const text = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return /1[\s\u202f\u00a0]200,00/.test(t) && t.includes('encaissé')
    })
    expect(text).toBeInTheDocument()
  })

  // 7. Paiements en attente
  it('shows correct pending paiement count and amount', () => {
    renderDashboard()
    const section = getPaiementsSection()

    // "1 paiement (500,00 EUR) en attente de reglement"
    const text = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return t.includes('en attente de règlement') && /500,00/.test(t)
    })
    expect(text).toBeInTheDocument()
  })

  // 8. Total potentiel
  it('shows correct total potentiel (encaisse + en attente)', () => {
    renderDashboard()
    const section = getPaiementsSection()

    // "Total potentiel: 1 700,00 EUR"
    const text = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return t.includes('Total potentiel') && /1[\s\u202f\u00a0]700,00/.test(t)
    })
    expect(text).toBeInTheDocument()
  })

  // 9. Clients count
  it('shows correct number of clients', () => {
    renderDashboard()
    const section = getClientsSection()

    const text = within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      const t = el.textContent ?? ''
      return t.includes('3') && t.includes('clients enregistrés')
    })
    expect(text).toBeInTheDocument()
  })

  // 10. Comptes section
  it('shows comptes with names and balances', () => {
    renderDashboard()
    const section = getComptesSection()

    expect(within(section).getByText('Mon compte')).toBeInTheDocument()
    expect(within(section).getByText('Association Locale')).toBeInTheDocument()

    // Mon compte balance: 1 050,00 EUR
    expect(within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      return /1[\s\u202f\u00a0]050,00\s*€/.test(el.textContent ?? '')
    })).toBeInTheDocument()

    // Association Locale balance: 250,00 EUR
    expect(within(section).getByText((_content, el) => {
      if (!el || el.tagName !== 'P') return false
      return /^250,00\s*€$/.test((el.textContent ?? '').trim())
    })).toBeInTheDocument()
  })

  // 10b. Comptes section hidden when empty
  it('hides comptes section when comptes array is empty', () => {
    mockUseData.mockReturnValue(defaultDataReturn({ comptes: [] }))
    renderDashboard()

    expect(screen.queryByRole('heading', { name: 'Comptes' })).not.toBeInTheDocument()
  })

  // 11. Recent prestations list
  it('shows recent prestations in the bottom list', () => {
    renderDashboard()
    const list = getBottomList('5 dernières prestations')

    // All 3 prestations should appear (fewer than 5)
    expect(within(list).getByText('Dupont SARL')).toBeInTheDocument()
    expect(within(list).getByText('Martin & Co')).toBeInTheDocument()
    expect(within(list).getByText('Association Locale')).toBeInTheDocument()
    // Type labels
    expect(within(list).getAllByText('Conseil').length).toBe(2)
    expect(within(list).getByText('Formation')).toBeInTheDocument()
  })

  // 12. Recent paiements list
  it('shows recent paiements with references', () => {
    renderDashboard()
    const list = getBottomList('5 derniers paiements')

    expect(within(list).getByText(`#${mockPaiements[0].reference}`)).toBeInTheDocument()
    expect(within(list).getByText(`#${mockPaiements[1].reference}`)).toBeInTheDocument()
  })

  // 13. Unpaid paiements list
  it('shows non-encaisse paiements in the unpaid list', () => {
    renderDashboard()
    const list = getBottomList('Paiements non encaissés')

    // mockPaiements[1] has no date_encaissement — appears in the unpaid list
    expect(within(list).getByText(`#${mockPaiements[1].reference}`)).toBeInTheDocument()
    expect(within(list).getByText('Dupont SARL')).toBeInTheDocument()
  })

  // 13b. All paiements encaisses message
  it('shows "all encaisse" message when no unpaid paiements', () => {
    const allPaid = mockPaiements.map((p) => ({
      ...p,
      date_encaissement: p.date_encaissement || `${Y}-03-20`,
    }))
    mockUseData.mockReturnValue(defaultDataReturn({ paiements: allPaid }))
    renderDashboard()

    expect(screen.getByText('Tous les paiements sont encaissés')).toBeInTheDocument()
  })

  // 14. Navigate to prestations filter
  it('navigates to /prestations?filter=non_facturee when clicking sans paiement', async () => {
    const user = userEvent.setup()
    renderDashboard()
    const section = getPrestationsSection()

    // The clickable button contains "pas de paiement"
    const buttons = within(section).getAllByRole('button')
    const sansPaiementBtn = buttons.find((btn) =>
      (btn.textContent ?? '').includes('pas de paiement'),
    )!
    await user.click(sansPaiementBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/prestations?filter=non_facturee')
  })

  // 15. Navigate to paiements filter
  it('navigates to /paiements?filter=en_attente when clicking en attente', async () => {
    const user = userEvent.setup()
    renderDashboard()
    const section = getPaiementsSection()

    const buttons = within(section).getAllByRole('button')
    const enAttenteBtn = buttons.find((btn) =>
      (btn.textContent ?? '').includes('en attente de règlement'),
    )!
    await user.click(enAttenteBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/paiements?filter=en_attente')
  })

  // 16. Tax report button disabled when year is "all"
  it('disables the "Rapport fiscal" button when year is "Toutes"', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Default year is current year (matching our data), so the button should be enabled
    const reportButton = screen.getByRole('button', { name: /Rapport fiscal/i })
    expect(reportButton).not.toBeDisabled()

    // Switch to "Toutes"
    const select = screen.getByLabelText(/Année/i)
    await user.selectOptions(select, 'all')

    expect(reportButton).toBeDisabled()
  })

  // 16b. Tax report button enabled for a specific year
  it('enables the "Rapport fiscal" button when a specific year is selected', () => {
    renderDashboard()

    const reportButton = screen.getByRole('button', { name: /Rapport fiscal/i })
    expect(reportButton).not.toBeDisabled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Depenses from '@/pages/Depenses'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseData = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/DataContext', () => ({
  useData: mockUseData,
}))

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockDepenses = [
  { date: '2026-03-02', compte: 'Mon compte', montant: 150, description: 'Fournitures de bureau', _rowNumber: 0 },
  { date: '2026-03-08', compte: 'Association Locale', montant: 50, description: 'Frais de d\u00e9placement', _rowNumber: 1 },
]

function defaultMockReturnValue(overrides = {}) {
  return {
    depenses: mockDepenses,
    clients: [{ nom: 'Mon compte' }, { nom: 'Association Locale' }],
    prestations: [],
    isLoading: false,
    addDepense: vi.fn().mockResolvedValue(undefined),
    updateDepense: vi.fn().mockResolvedValue(undefined),
    deleteDepense: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderPage() {
  return render(<Depenses />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Depenses page', () => {
  beforeEach(() => {
    mockUseData.mockReturnValue(defaultMockReturnValue())
  })

  // 1. Loading state
  it('shows a loading spinner when data is loading', () => {
    mockUseData.mockReturnValue(defaultMockReturnValue({ isLoading: true }))
    renderPage()

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
  })

  // 2. Empty state with CTA
  it('shows empty state with a CTA button when there are no depenses', () => {
    mockUseData.mockReturnValue(defaultMockReturnValue({ depenses: [] }))
    renderPage()

    // Both desktop and mobile views render EmptyState
    const emptyTitles = screen.getAllByText('Aucune d\u00e9pense')
    expect(emptyTitles.length).toBeGreaterThanOrEqual(1)

    // CTA button
    const ctaButtons = screen.getAllByRole('button', { name: 'Nouvelle d\u00e9pense' })
    // Top action bar button + empty state CTA(s)
    expect(ctaButtons.length).toBeGreaterThanOrEqual(2)
  })

  // 3. Data display (dates, comptes, descriptions, amounts)
  it('displays depense dates, comptes, descriptions, and amounts', () => {
    renderPage()

    // Dates in French display format
    expect(screen.getAllByText('02/03/2026').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('08/03/2026').length).toBeGreaterThanOrEqual(1)

    // Comptes
    expect(screen.getAllByText('Mon compte').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Association Locale').length).toBeGreaterThanOrEqual(1)

    // Descriptions
    expect(screen.getAllByText('Fournitures de bureau').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Frais de d\u00e9placement').length).toBeGreaterThanOrEqual(1)

    // Amounts — formatted in French locale
    const allText = document.body.textContent!
    expect(allText).toMatch(/150,00\s*€/)
    expect(allText).toMatch(/50,00\s*€/)
  })

  // 4. Total calculation in stats bar
  it('shows the correct total amount in the stats bar', () => {
    renderPage()

    // Total = 150 + 50 = 200
    const allText = document.body.textContent!
    expect(allText).toMatch(/Total/)
    expect(allText).toMatch(/200,00\s*€/)
  })

  // 5. Search filtering
  it('filters depenses when searching by description', async () => {
    const user = userEvent.setup()
    renderPage()

    const searchInput = screen.getByPlaceholderText('Rechercher par compte ou description...')
    await user.type(searchInput, 'Fournitures')

    // "Fournitures de bureau" should still be visible
    expect(screen.getAllByText('Fournitures de bureau').length).toBeGreaterThanOrEqual(1)
    // "Frais de deplacement" should be gone
    expect(screen.queryByText('Frais de d\u00e9placement')).not.toBeInTheDocument()
  })

  // 6. Compte filter
  it('filters depenses by compte', async () => {
    const user = userEvent.setup()
    renderPage()

    const filterSelect = screen.getByDisplayValue('Tous les comptes')
    await user.selectOptions(filterSelect, 'Mon compte')

    // Mon compte depense should remain
    expect(screen.getAllByText('Fournitures de bureau').length).toBeGreaterThanOrEqual(1)
    // Association Locale depense should be gone
    expect(screen.queryByText('Frais de d\u00e9placement')).not.toBeInTheDocument()
  })

  // 7. Results count
  it('displays the correct depenses count in the stats bar', () => {
    renderPage()

    // "2 depenses" (plural)
    const allText = document.body.textContent!
    expect(allText).toMatch(/2 d\u00e9penses/)
  })

  // 8. Open add modal
  it('opens the add modal when clicking the add button', async () => {
    const user = userEvent.setup()
    renderPage()

    // Click the action bar "Nouvelle depense" button
    const addButtons = screen.getAllByRole('button', { name: 'Nouvelle d\u00e9pense' })
    await user.click(addButtons[0])

    // Modal title is rendered as an h3 inside the Modal component
    const modalTitle = screen.getByRole('heading', { name: 'Nouvelle d\u00e9pense', level: 3 })
    expect(modalTitle).toBeInTheDocument()

    // The modal should also contain the close button
    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
  })

  // 9. Open delete modal with depense details
  it('opens the delete modal showing depense details', async () => {
    const user = userEvent.setup()
    renderPage()

    // Click a "Supprimer" button — both mobile and desktop are in the DOM
    const supprimerButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    await user.click(supprimerButtons[0])

    // Modal title
    expect(screen.getByText('Supprimer la d\u00e9pense')).toBeInTheDocument()

    // Depense details should be displayed in the modal
    // The delete modal shows Date, Compte, Description, Montant
    const modal = screen.getByText('Supprimer la d\u00e9pense').closest('.fixed')!
    expect(within(modal).getByText(/Date:/)).toBeInTheDocument()
    expect(within(modal).getByText(/Compte:/)).toBeInTheDocument()
    expect(within(modal).getByText(/Description:/)).toBeInTheDocument()
    expect(within(modal).getByText(/Montant:/)).toBeInTheDocument()
  })

  // 10. Confirm delete calls deleteDepense
  it('calls deleteDepense when confirming deletion', async () => {
    const mockDeleteDepense = vi.fn().mockResolvedValue(undefined)
    mockUseData.mockReturnValue(defaultMockReturnValue({ deleteDepense: mockDeleteDepense }))

    const user = userEvent.setup()
    renderPage()

    // Open delete modal for the first depense (sorted by date desc, index 1 in original = "Association Locale" 2026-03-08 comes first)
    const supprimerButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    await user.click(supprimerButtons[0])

    // Confirm deletion — there are now multiple "Supprimer" buttons: the ones in the list + the modal confirm
    // The modal confirm button is a danger-variant Button
    const modalConfirmButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    // The last one is the modal's confirm button
    const confirmButton = modalConfirmButtons[modalConfirmButtons.length - 1]
    await user.click(confirmButton)

    expect(mockDeleteDepense).toHaveBeenCalled()
  })
})

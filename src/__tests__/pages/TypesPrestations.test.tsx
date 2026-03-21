import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TypesPrestations from '@/pages/TypesPrestations'
import { mockTypesPrestations } from '../mocks/data'

// ---------------------------------------------------------------------------
// Mock DataContext
// ---------------------------------------------------------------------------

const mockUseData = vi.hoisted(() => vi.fn())
vi.mock('@/contexts/DataContext', () => ({
  useData: mockUseData,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default mock return value with data loaded */
function withTypes(overrides: Record<string, unknown> = {}) {
  mockUseData.mockReturnValue({
    typesPrestations: mockTypesPrestations,
    isLoading: false,
    addTypePrestation: vi.fn().mockResolvedValue(undefined),
    updateTypePrestation: vi.fn().mockResolvedValue(undefined),
    deleteTypePrestation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })
}

/** Mock return value for loading state */
function withLoading() {
  mockUseData.mockReturnValue({
    typesPrestations: [],
    isLoading: true,
    addTypePrestation: vi.fn(),
    updateTypePrestation: vi.fn(),
    deleteTypePrestation: vi.fn(),
  })
}

/** Mock return value with no types */
function withEmpty() {
  mockUseData.mockReturnValue({
    typesPrestations: [],
    isLoading: false,
    addTypePrestation: vi.fn().mockResolvedValue(undefined),
    updateTypePrestation: vi.fn().mockResolvedValue(undefined),
    deleteTypePrestation: vi.fn().mockResolvedValue(undefined),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TypesPrestations page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Loading state
  it('shows Loading spinner when isLoading is true', () => {
    withLoading()
    render(<TypesPrestations />)

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
  })

  // 2. Empty state (no data)
  it('shows empty state with title and CTA when there are no types', () => {
    withEmpty()
    render(<TypesPrestations />)

    expect(screen.getByText('Aucun type de prestation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter un type' })).toBeInTheDocument()
  })

  // 3. Data display
  it('displays type data in the table including formatted currency', () => {
    withTypes()
    render(<TypesPrestations />)

    // Type names appear (twice each: mobile card + desktop table row)
    for (const type of mockTypesPrestations) {
      expect(screen.getAllByText(type.nom).length).toBeGreaterThanOrEqual(1)
    }

    // Formatted currency amounts (French locale: "500,00 €", "1 200,00 €", "800,00 €")
    // The non-breaking space before the euro sign and as thousands separator
    // means we use a regex to be resilient to whitespace variations.
    expect(screen.getAllByText(/500,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/1.*200,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/800,00/).length).toBeGreaterThanOrEqual(1)
  })

  // 4. Results count
  it('shows correct results count in footer', () => {
    withTypes()
    render(<TypesPrestations />)

    // Both mobile and desktop footers show "3 types"
    const counts = screen.getAllByText('3 types')
    expect(counts.length).toBeGreaterThanOrEqual(1)
  })

  // 5. Search filtering
  it('filters types when typing in search bar', async () => {
    withTypes()
    const user = userEvent.setup()
    render(<TypesPrestations />)

    const searchInput = screen.getByPlaceholderText('Rechercher un type de prestation...')
    await user.type(searchInput, 'Conseil')

    // Conseil should still be visible
    expect(screen.getAllByText('Conseil').length).toBeGreaterThanOrEqual(1)

    // Formation should be filtered out
    expect(screen.queryByText('Formation')).not.toBeInTheDocument()

    // Count should update
    expect(screen.getAllByText(/1 type(?!s)/).length).toBeGreaterThanOrEqual(1)
  })

  // 6. Search no results
  it('shows "Aucun type trouvé" when search matches nothing', async () => {
    withTypes()
    const user = userEvent.setup()
    render(<TypesPrestations />)

    const searchInput = screen.getByPlaceholderText('Rechercher un type de prestation...')
    await user.type(searchInput, 'zzzznonexistent')

    expect(screen.getByText('Aucun type trouvé')).toBeInTheDocument()
  })

  // 7. Open add modal
  it('opens add modal with correct title when clicking add button', async () => {
    withTypes()
    const user = userEvent.setup()
    render(<TypesPrestations />)

    await user.click(screen.getByRole('button', { name: '+ Ajouter un type' }))

    // Modal title rendered as h3
    expect(screen.getByText('Ajouter un type de prestation')).toBeInTheDocument()
  })

  // 8. Open delete modal
  it('opens delete confirmation modal when clicking Supprimer', async () => {
    withTypes()
    const user = userEvent.setup()
    render(<TypesPrestations />)

    // Both mobile and desktop render Supprimer buttons; click the first one
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    expect(screen.getByText('Supprimer le type de prestation')).toBeInTheDocument()
    expect(
      screen.getByText(/Êtes-vous sûr de vouloir supprimer le type/),
    ).toBeInTheDocument()
  })

  // 9. Confirm delete calls deleteTypePrestation
  it('calls deleteTypePrestation when confirming deletion', async () => {
    const deleteTypePrestation = vi.fn().mockResolvedValue(undefined)
    withTypes({ deleteTypePrestation })
    const user = userEvent.setup()
    render(<TypesPrestations />)

    // Click the first Supprimer button to open the confirm modal
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    // The confirm modal now has its own "Supprimer" confirm button
    // Find the confirm modal and click its Supprimer button
    const modal = screen.getByText('Supprimer le type de prestation').closest('.fixed')!
    const confirmButton = within(modal as HTMLElement).getAllByText('Supprimer')
    // The last one is the confirm button in the footer
    await user.click(confirmButton[confirmButton.length - 1])

    expect(deleteTypePrestation).toHaveBeenCalledTimes(1)
  })

  // 10. Cancel button in delete modal
  it('closes delete modal when clicking Annuler', async () => {
    withTypes()
    const user = userEvent.setup()
    render(<TypesPrestations />)

    // Open delete modal
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    // Confirm modal is visible
    expect(screen.getByText('Supprimer le type de prestation')).toBeInTheDocument()

    // Click Annuler
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    // Modal title should no longer be visible
    expect(screen.queryByText('Supprimer le type de prestation')).not.toBeInTheDocument()
  })
})

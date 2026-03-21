import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Clients from '@/pages/Clients'
import { mockClients } from '../mocks/data'

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
function withClients(overrides: Record<string, unknown> = {}) {
  mockUseData.mockReturnValue({
    clients: mockClients,
    isLoading: false,
    addClient: vi.fn().mockResolvedValue(undefined),
    updateClient: vi.fn().mockResolvedValue(undefined),
    deleteClient: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })
}

/** Mock return value for loading state */
function withLoading() {
  mockUseData.mockReturnValue({
    clients: [],
    isLoading: true,
    addClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
  })
}

/** Mock return value with no clients */
function withEmpty() {
  mockUseData.mockReturnValue({
    clients: [],
    isLoading: false,
    addClient: vi.fn().mockResolvedValue(undefined),
    updateClient: vi.fn().mockResolvedValue(undefined),
    deleteClient: vi.fn().mockResolvedValue(undefined),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Clients page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Loading state
  it('shows Loading spinner when isLoading is true', () => {
    withLoading()
    render(<Clients />)

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument()
  })

  // 2. Empty state (no data)
  it('shows empty state with title and CTA when there are no clients', () => {
    withEmpty()
    render(<Clients />)

    expect(screen.getByText('Aucun client')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter un client' })).toBeInTheDocument()
  })

  // 3. Data display
  it('displays client data in the table', () => {
    withClients()
    render(<Clients />)

    // Client names appear (twice each: mobile card + desktop table row)
    for (const client of mockClients) {
      expect(screen.getAllByText(client.nom).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(client.email).length).toBeGreaterThanOrEqual(1)
    }

    // Telephone appears for those that have one
    expect(screen.getAllByText('0612345678').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('0698765432').length).toBeGreaterThanOrEqual(1)

    // SIRET appears for the one client that has it
    expect(screen.getAllByText('12345678901234').length).toBeGreaterThanOrEqual(1)
  })

  // 4. Results count
  it('shows correct results count in footer', () => {
    withClients()
    render(<Clients />)

    // Both mobile and desktop footers show "3 clients"
    const counts = screen.getAllByText('3 clients')
    expect(counts.length).toBeGreaterThanOrEqual(1)
  })

  // 5. Search filtering
  it('filters clients when typing in search bar', async () => {
    withClients()
    const user = userEvent.setup()
    render(<Clients />)

    const searchInput = screen.getByPlaceholderText(
      'Rechercher par nom, email, téléphone ou SIRET...',
    )
    await user.type(searchInput, 'Dupont')

    // Dupont should still be visible
    expect(screen.getAllByText('Dupont SARL').length).toBeGreaterThanOrEqual(1)

    // Martin & Co should be filtered out
    expect(screen.queryByText('Martin & Co')).not.toBeInTheDocument()

    // Count should update
    expect(screen.getAllByText(/1 client/).length).toBeGreaterThanOrEqual(1)
  })

  // 6. Search no results
  it('shows "Aucun client trouvé" when search matches nothing', async () => {
    withClients()
    const user = userEvent.setup()
    render(<Clients />)

    const searchInput = screen.getByPlaceholderText(
      'Rechercher par nom, email, téléphone ou SIRET...',
    )
    await user.type(searchInput, 'zzzznonexistent')

    expect(screen.getByText('Aucun client trouvé')).toBeInTheDocument()
  })

  // 7. Open add modal
  it('opens add modal with correct title when clicking add button', async () => {
    withClients()
    const user = userEvent.setup()
    render(<Clients />)

    await user.click(screen.getByRole('button', { name: '+ Ajouter un client' }))

    // Modal title rendered as h3
    expect(screen.getByText('Ajouter un client')).toBeInTheDocument()
  })

  // 8. Open delete modal
  it('opens delete confirmation modal when clicking Supprimer', async () => {
    withClients()
    const user = userEvent.setup()
    render(<Clients />)

    // Both mobile and desktop render Supprimer buttons; click the first one
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    expect(screen.getByText('Supprimer le client')).toBeInTheDocument()
    // The list is reversed, so the first Supprimer button corresponds to
    // the last client in the original array (Association Locale)
    expect(
      screen.getByText(/Êtes-vous sûr de vouloir supprimer le client/),
    ).toBeInTheDocument()
  })

  // 9. Confirm delete calls deleteClient
  it('calls deleteClient when confirming deletion', async () => {
    const deleteClient = vi.fn().mockResolvedValue(undefined)
    withClients({ deleteClient })
    const user = userEvent.setup()
    render(<Clients />)

    // Click the first Supprimer button to open the confirm modal
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    // The confirm modal now has its own "Supprimer" confirm button
    // Find the confirm modal and click its Supprimer button
    const modal = screen.getByText('Supprimer le client').closest('.fixed')!
    const confirmButton = within(modal as HTMLElement).getAllByText('Supprimer')
    // The last one is the confirm button in the footer
    await user.click(confirmButton[confirmButton.length - 1])

    expect(deleteClient).toHaveBeenCalledTimes(1)
  })

  // 10. Cancel button in delete modal
  it('closes delete modal when clicking Annuler', async () => {
    withClients()
    const user = userEvent.setup()
    render(<Clients />)

    // Open delete modal
    const deleteButtons = screen.getAllByText('Supprimer')
    await user.click(deleteButtons[0])

    // Confirm modal is visible
    expect(screen.getByText('Supprimer le client')).toBeInTheDocument()

    // Click Annuler
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    // Modal title should no longer be visible
    expect(screen.queryByText('Supprimer le client')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PaiementDetailModal from '@/components/common/PaiementDetailModal'
import type { Paiement, Prestation } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const paiement: Paiement = {
  reference: '2603050001',
  client: 'Martin & Co',
  total: 1200,
  date_encaissement: '2026-03-10',
  mode_encaissement: 'virement',
  facture: 'https://example.com/facture',
  recu: 'https://example.com/recu',
  _rowNumber: 0,
}

const prestations: Prestation[] = [
  { date: '2026-03-05', nom_client: 'Martin & Co', type_prestation: 'Formation', montant: 1200, paiement_id: '2603050001', associatif: false, _rowNumber: 1 },
  { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '', associatif: false, _rowNumber: 0 },
]

const onClose = vi.fn()

function renderModal(props: Partial<Parameters<typeof PaiementDetailModal>[0]> = {}) {
  return render(
    <MemoryRouter>
      <PaiementDetailModal
        paiement={paiement}
        prestations={prestations}
        isOpen={true}
        onClose={onClose}
        {...props}
      />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PaiementDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByText('Détails du paiement')).not.toBeInTheDocument()
  })

  it('shows modal title "Détails du paiement" when open', () => {
    renderModal()
    expect(screen.getByText('Détails du paiement')).toBeInTheDocument()
  })

  it('shows the payment reference #2603050001', () => {
    renderModal()
    expect(screen.getByText('#2603050001')).toBeInTheDocument()
  })

  it('shows client name "Martin & Co"', () => {
    renderModal()
    // Client name appears in the header and also inside the associated prestation
    const label = screen.getByText('Client:')
    const clientValue = label.nextElementSibling!
    expect(clientValue.textContent).toBe('Martin & Co')
  })

  it('shows formatted total amount', () => {
    renderModal()
    // French format: 1 200,00 € (uses narrow no-break space \u202f)
    // Amount appears both in the header and in the prestation row, so use getAllByText
    const matches = screen.getAllByText(/1[\s\u202f]200,00\s*€/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Encaissé" status for encaissé paiement', () => {
    renderModal()
    expect(screen.getByText('Encaissé')).toBeInTheDocument()
  })

  it('shows "En attente" for pending paiement without date_encaissement', () => {
    const pendingPaiement: Paiement = {
      ...paiement,
      date_encaissement: undefined,
      mode_encaissement: undefined,
    }
    renderModal({ paiement: pendingPaiement })
    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('shows date d\'encaissement when set', () => {
    renderModal()
    // 2026-03-10 → 10/03/2026
    expect(screen.getByText('10/03/2026')).toBeInTheDocument()
  })

  it('shows mode capitalized (virement)', () => {
    renderModal()
    // The CSS class "capitalize" transforms display; in the DOM it is lowercase
    expect(screen.getByText('virement')).toBeInTheDocument()
  })

  it('shows facture link with target _blank', () => {
    renderModal()
    const factureLink = screen.getByText('Voir la facture').closest('a')!
    expect(factureLink).toHaveAttribute('href', 'https://example.com/facture')
    expect(factureLink).toHaveAttribute('target', '_blank')
  })

  it('shows reçu link with target _blank', () => {
    renderModal()
    const recuLink = screen.getByText('Voir le reçu').closest('a')!
    expect(recuLink).toHaveAttribute('href', 'https://example.com/recu')
    expect(recuLink).toHaveAttribute('target', '_blank')
  })

  it('shows notes when paiement has notes', () => {
    const paiementWithNotes: Paiement = {
      ...paiement,
      notes: 'Commentaire sur le paiement',
    }
    renderModal({ paiement: paiementWithNotes })
    expect(screen.getByText('Notes:')).toBeInTheDocument()
    expect(screen.getByText('Commentaire sur le paiement')).toBeInTheDocument()
  })

  it('does not show notes section when paiement has no notes', () => {
    renderModal()
    expect(screen.queryByText('Notes:')).not.toBeInTheDocument()
  })

  it('does not show PDF links when paiement has no facture/recu', () => {
    const noPdfPaiement: Paiement = {
      ...paiement,
      facture: undefined,
      recu: undefined,
    }
    renderModal({ paiement: noPdfPaiement })
    expect(screen.queryByText('Voir la facture')).not.toBeInTheDocument()
    expect(screen.queryByText('Voir le reçu')).not.toBeInTheDocument()
  })

  it('shows associated prestations count (1 matching)', () => {
    renderModal()
    // Only one prestation has paiement_id matching '2603050001'
    expect(screen.getByText('Prestations associées (1)')).toBeInTheDocument()
  })

  it('shows prestation details (type, date, client, amount)', () => {
    renderModal()
    expect(screen.getByText('Formation')).toBeInTheDocument()
    // Date: 2026-03-05 → 05/03/2026
    expect(screen.getByText('05/03/2026')).toBeInTheDocument()
    // Amount: 1 200,00 € appears in the prestation too
    // Client name inside the prestation button
    const prestationButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.includes('Formation')
    )
    expect(prestationButtons.length).toBeGreaterThan(0)
    expect(prestationButtons[0].textContent).toContain('Martin & Co')
  })

  it('shows "Aucune prestation associée" when no matching prestations', () => {
    const noMatchPrestations: Prestation[] = [
      { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, paiement_id: '', associatif: false, _rowNumber: 0 },
    ]
    renderModal({ prestations: noMatchPrestations })
    expect(screen.getByText('Aucune prestation associée à ce paiement')).toBeInTheDocument()
  })

  it('clicking a prestation calls onClose then navigate', async () => {
    const user = userEvent.setup()
    renderModal()

    // Find the prestation button (the one containing "Formation")
    const prestationButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('Formation')
    )!
    expect(prestationButton).toBeDefined()

    await user.click(prestationButton)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/prestations?highlight=1')
    )
  })

  it('Fermer button calls onClose', async () => {
    const user = userEvent.setup()
    renderModal()

    const fermerButton = screen.getByRole('button', { name: /Fermer/ })
    await user.click(fermerButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

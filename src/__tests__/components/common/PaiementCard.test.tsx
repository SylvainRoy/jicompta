import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaiementCard from '@/components/common/PaiementCard'
import type { Paiement } from '@/types'

describe('PaiementCard', () => {
  const encaissePaiement: Paiement = {
    reference: '2603050001',
    client: 'Martin & Co',
    total: 1200,
    date_encaissement: '2026-03-10',
    mode_encaissement: 'virement',
    facture: 'https://example.com/facture',
    recu: 'https://example.com/recu',
    _rowNumber: 0,
  }

  const pendingPaiement: Paiement = {
    reference: '2603150001',
    client: 'Dupont SARL',
    total: 500,
    _rowNumber: 1,
  }

  const onViewDetails = vi.fn()
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onGenerateFacture = vi.fn()
  const onGenerateRecu = vi.fn()

  beforeEach(() => {
    onViewDetails.mockClear()
    onEdit.mockClear()
    onDelete.mockClear()
    onGenerateFacture.mockClear()
    onGenerateRecu.mockClear()
  })

  it('renders reference and client name', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('#2603050001')
    expect(screen.getByText('Martin & Co')).toBeInTheDocument()
  })

  it('shows "Encaissé" for encaissé payment', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    const badge = screen.getByText('Encaissé')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-green-100')
  })

  it('shows "En attente" for pending payment', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    const badge = screen.getByText('En attente')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('shows formatted date for encaissé', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('10/03/2026')).toBeInTheDocument()
  })

  it('shows "Non encaissé" for pending', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Non encaissé')).toBeInTheDocument()
  })

  it('shows formatted amount', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText(/1.*200,00/)).toBeInTheDocument()
  })

  it('shows prestations count', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('2 prestations')).toBeInTheDocument()
  })

  it('shows singular prestation for count of 1', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('1 prestation')).toBeInTheDocument()
  })

  it('reference click calls onViewDetails', async () => {
    const user = userEvent.setup()
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    await user.click(screen.getByRole('heading', { level: 3 }))

    expect(onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('Modifier button calls onEdit', async () => {
    const user = userEvent.setup()
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('Supprimer button shown for pending, calls onDelete', async () => {
    const user = userEvent.setup()
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    const deleteButton = screen.getByRole('button', { name: 'Supprimer' })
    expect(deleteButton).toBeInTheDocument()

    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('no Supprimer for encaissé', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument()
  })

  it('"Voir facture" when facture URL exists', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Voir facture')).toBeInTheDocument()
  })

  it('"Générer facture" when no facture URL', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Générer facture')).toBeInTheDocument()
  })

  it('"Génération..." when isGeneratingFacture', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
        isGeneratingFacture={true}
      />
    )

    expect(screen.getByText('Génération...')).toBeInTheDocument()
    expect(screen.queryByText('Générer facture')).not.toBeInTheDocument()
  })

  it('reçu button shown only for encaissé', () => {
    const { rerender } = render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    // Pending payment should not show any reçu button
    expect(screen.queryByText(/reçu/i)).not.toBeInTheDocument()

    // Re-render with encaissé payment
    rerender(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Voir reçu')).toBeInTheDocument()
  })

  it('shows notes indicator when paiement has notes', () => {
    const paiementWithNotes: Paiement = {
      ...encaissePaiement,
      notes: 'Note sur le paiement',
    }
    render(
      <PaiementCard
        paiement={paiementWithNotes}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Note sur le paiement')).toBeInTheDocument()
  })

  it('does not show notes indicator when no notes', () => {
    render(
      <PaiementCard
        paiement={pendingPaiement}
        prestationsCount={1}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.queryByText(/Note sur/)).not.toBeInTheDocument()
  })

  it('"Voir reçu" when recu URL exists', () => {
    render(
      <PaiementCard
        paiement={encaissePaiement}
        prestationsCount={2}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onGenerateFacture={onGenerateFacture}
        onGenerateRecu={onGenerateRecu}
      />
    )

    expect(screen.getByText('Voir reçu')).toBeInTheDocument()
  })
})

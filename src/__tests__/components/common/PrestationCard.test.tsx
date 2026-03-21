import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrestationCard from '@/components/common/PrestationCard'
import type { Prestation } from '@/types'

describe('PrestationCard', () => {
  const prestation: Prestation = {
    date: '2026-03-01',
    nom_client: 'Dupont SARL',
    type_prestation: 'Consultation',
    montant: 750,
    _rowNumber: 0,
  }

  const linkedPrestation: Prestation = {
    ...prestation,
    paiement_id: '2603010001',
  }

  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onViewPayment = vi.fn()

  beforeEach(() => {
    onEdit.mockClear()
    onDelete.mockClear()
    onViewPayment.mockClear()
  })

  it('renders client name and type', () => {
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Dupont SARL')
    expect(screen.getByText('Consultation')).toBeInTheDocument()
  })

  it('shows formatted date and amount', () => {
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText('01/03/2026')).toBeInTheDocument()
    expect(screen.getByText(/750,00/)).toBeInTheDocument()
  })

  it('shows status badge with label', () => {
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    const badge = screen.getByText('Non payé')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-yellow-100')
    expect(badge.className).toContain('text-yellow-800')
  })

  it('shows Modifier/Supprimer when canModify=true', () => {
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
  })

  it('Modifier calls onEdit', async () => {
    const user = userEvent.setup()
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('Supprimer calls onDelete', async () => {
    const user = userEvent.setup()
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows "Liée à un paiement" when canModify=false', () => {
    render(
      <PrestationCard
        prestation={linkedPrestation}
        statusLabel="Payé"
        statusColor="bg-green-100 text-green-800"
        canModify={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText('Liée à un paiement')).toBeInTheDocument()
  })

  it('no Modifier/Supprimer when canModify=false', () => {
    render(
      <PrestationCard
        prestation={linkedPrestation}
        statusLabel="Payé"
        statusColor="bg-green-100 text-green-800"
        canModify={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument()
  })

  it('shows payment link when paiement_id + onViewPayment', () => {
    render(
      <PrestationCard
        prestation={linkedPrestation}
        statusLabel="Payé"
        statusColor="bg-green-100 text-green-800"
        canModify={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewPayment={onViewPayment}
      />
    )

    expect(screen.getByText('Paiement #2603010001')).toBeInTheDocument()
  })

  it('payment link calls onViewPayment with correct reference', async () => {
    const user = userEvent.setup()
    render(
      <PrestationCard
        prestation={linkedPrestation}
        statusLabel="Payé"
        statusColor="bg-green-100 text-green-800"
        canModify={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewPayment={onViewPayment}
      />
    )

    await user.click(screen.getByText('Paiement #2603010001'))

    expect(onViewPayment).toHaveBeenCalledWith('2603010001')
  })

  it('no payment link when no paiement_id', () => {
    render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewPayment={onViewPayment}
      />
    )

    expect(screen.queryByText(/Paiement #/)).not.toBeInTheDocument()
  })

  it('highlighted card has ring classes', () => {
    const { container } = render(
      <PrestationCard
        prestation={prestation}
        statusLabel="Non payé"
        statusColor="bg-yellow-100 text-yellow-800"
        canModify={true}
        isHighlighted={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('ring-2')
    expect(card.className).toContain('ring-blue-400')
    expect(card.className).toContain('bg-blue-50')
  })
})

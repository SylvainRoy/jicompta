import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PaiementForm from '@/components/forms/PaiementForm'
import type { Prestation, Paiement } from '@/types'

const unpaidPrestations: Prestation[] = [
  { date: '2026-03-01', nom_client: 'Dupont SARL', type_prestation: 'Conseil', montant: 500, _rowNumber: 0, associatif: false },
  { date: '2026-03-05', nom_client: 'Dupont SARL', type_prestation: 'Formation', montant: 1200, _rowNumber: 1, associatif: false },
  { date: '2026-03-10', nom_client: 'Martin & Co', type_prestation: 'Conseil', montant: 300, _rowNumber: 2, associatif: false },
]

const paidPrestation: Prestation = {
  date: '2026-02-01', nom_client: 'Dupont SARL', type_prestation: 'Audit', montant: 800,
  paiement_id: 'PAY001', _rowNumber: 3, associatif: false,
}

const existingPaiement: Paiement = {
  reference: '2603050001',
  client: 'Dupont SARL',
  total: 500,
  date_encaissement: '2026-03-15',
  mode_encaissement: 'virement',
  _rowNumber: 0,
}

describe('PaiementForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()

  it('shows "no unpaid prestations" when none available', () => {
    render(
      <PaiementForm
        prestations={[paidPrestation]}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText(/Aucune prestation non payée/)).toBeInTheDocument()
  })

  it('renders client dropdown with clients having unpaid prestations', () => {
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    const select = screen.getByLabelText(/Client/)
    expect(select).toBeInTheDocument()
    const options = within(select).getAllByRole('option')
    // "Sélectionner un client" + Dupont SARL + Martin & Co
    expect(options).toHaveLength(3)
    expect(options[1].textContent).toContain('Dupont SARL')
    expect(options[2].textContent).toContain('Martin & Co')
  })

  it('shows prestations for the selected client', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.selectOptions(screen.getByLabelText(/Client/), 'Dupont SARL')
    // Dupont SARL has 2 unpaid prestations
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(screen.getByText('Conseil')).toBeInTheDocument()
    expect(screen.getByText('Formation')).toBeInTheDocument()
  })

  it('calculates total from selected prestations', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.selectOptions(screen.getByLabelText(/Client/), 'Dupont SARL')
    const checkboxes = screen.getAllByRole('checkbox')

    // Select first prestation (500€)
    await user.click(checkboxes[0])
    // Total displayed in the blue summary box
    const totalBox = screen.getByText(/Total du paiement/).closest('div')!
    expect(totalBox.textContent).toMatch(/500/)

    // Select second prestation (1200€) → total 1700€
    await user.click(checkboxes[1])
    expect(totalBox.textContent).toMatch(/1[\s\u202f]700/)
  })

  it('shows validation error when no client selected', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.click(screen.getByRole('button', { name: /Créer le paiement/ }))
    expect(screen.getByText('Sélectionnez un client')).toBeInTheDocument()
  })

  it('shows validation error when no prestations selected', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.selectOptions(screen.getByLabelText(/Client/), 'Martin & Co')
    await user.click(screen.getByRole('button', { name: /Créer le paiement/ }))
    expect(screen.getByText('Sélectionnez au moins une prestation')).toBeInTheDocument()
  })

  it('calls onSubmit with correct data on valid form', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.selectOptions(screen.getByLabelText(/Client/), 'Martin & Co')
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: /Créer le paiement/ }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        client: 'Martin & Co',
        total: 300,
        reference: '',
      }),
      [2] // index of the prestation in the original array
    )
  })

  it('renders read-only info in edit mode', () => {
    render(
      <PaiementForm
        paiement={existingPaiement}
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText('Dupont SARL')).toBeInTheDocument()
    // Total is in the formatted display
    const totalEl = screen.getByText(/Montant total/).closest('div')!
    expect(totalEl.textContent).toMatch(/500/)
    expect(screen.getByRole('button', { name: /Mettre à jour/ })).toBeInTheDocument()
    // No client dropdown in edit mode
    expect(screen.queryByLabelText(/Client/)).not.toBeInTheDocument()
  })

  it('pre-fills encaissement fields in edit mode', () => {
    render(
      <PaiementForm
        paiement={existingPaiement}
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    // Input component doesn't set htmlFor, so find by value
    expect(screen.getByDisplayValue('2026-03-15')).toBeInTheDocument()
    const modeSelect = screen.getByLabelText(/Mode d'encaissement/)
    expect(modeSelect).toHaveValue('virement')
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.click(screen.getByRole('button', { name: /Annuler/ }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('clears client error when user selects a client', async () => {
    const user = userEvent.setup()
    render(
      <PaiementForm
        prestations={unpaidPrestations}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )
    await user.click(screen.getByRole('button', { name: /Créer le paiement/ }))
    expect(screen.getByText('Sélectionnez un client')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Client/), 'Dupont SARL')
    expect(screen.queryByText('Sélectionnez un client')).not.toBeInTheDocument()
  })
})

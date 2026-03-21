import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DepenseForm from '@/components/forms/DepenseForm'
import type { Depense } from '@/types'

vi.mock('@/contexts/DataContext', () => ({
  useData: () => ({
    clients: [
      { nom: 'Dupont SARL', email: 'dupont@test.fr', _rowNumber: 0 },
      { nom: 'Association Locale', email: 'asso@test.fr', _rowNumber: 1 },
    ],
    prestations: [
      { date: '2026-03-10', nom_client: 'Association Locale', type_prestation: 'Conseil', montant: 300, associatif: true, _rowNumber: 0 },
    ],
  }),
}))

const existingDepense: Depense = {
  date: '2026-03-01',
  compte: 'Association Locale',
  montant: 50,
  description: 'Frais de déplacement',
  _rowNumber: 0,
}

describe('DepenseForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()

  it('renders form with compte dropdown including "Mon compte" first', () => {
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)
    const select = screen.getByRole('combobox')
    const options = within(select).getAllByRole('option')
    expect(options.length).toBeGreaterThanOrEqual(3)
    expect(select).toHaveValue('Mon compte')
  })

  it('shows "Ajouter" button in create mode', () => {
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByRole('button', { name: /Ajouter/ })).toBeInTheDocument()
  })

  it('pre-fills form in edit mode with "Modifier" button', () => {
    render(<DepenseForm depense={existingDepense} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('Association Locale')
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Frais de déplacement')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modifier/ })).toBeInTheDocument()
  })

  it('shows validation errors when submitting with empty montant and description', () => {
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)
    // Use fireEvent.submit to bypass HTML5 required constraint validation
    const form = screen.getByRole('button', { name: /Ajouter/ }).closest('form')!
    fireEvent.submit(form)

    expect(screen.getByText('Le montant est obligatoire')).toBeInTheDocument()
    expect(screen.getByText('La description est obligatoire')).toBeInTheDocument()
  })

  it('shows error for invalid amount (zero)', async () => {
    const user = userEvent.setup()
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)
    const montantInput = screen.getByPlaceholderText('0.00')
    await user.type(montantInput, '0')
    const descriptionInput = screen.getByPlaceholderText(/Description/)
    await user.type(descriptionInput, 'Test')
    await user.click(screen.getByRole('button', { name: /Ajouter/ }))

    expect(screen.getByText(/Montant invalide/)).toBeInTheDocument()
  })

  it('calls onSubmit with correct data on valid form', async () => {
    const user = userEvent.setup()
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)

    const montantInput = screen.getByPlaceholderText('0.00')
    await user.type(montantInput, '150')

    const descriptionInput = screen.getByPlaceholderText(/Description/)
    await user.type(descriptionInput, 'Achat de matériel')

    await user.click(screen.getByRole('button', { name: /Ajouter/ }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      compte: 'Mon compte',
      montant: 150,
      description: 'Achat de matériel',
    }))
  })

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: /Annuler/ }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('clears error when user fills a field', async () => {
    const user = userEvent.setup()
    render(<DepenseForm onSubmit={onSubmit} onCancel={onCancel} />)

    // Trigger validation via fireEvent to bypass HTML5 required
    const form = screen.getByRole('button', { name: /Ajouter/ }).closest('form')!
    fireEvent.submit(form)
    expect(screen.getByText('Le montant est obligatoire')).toBeInTheDocument()

    const montantInput = screen.getByPlaceholderText('0.00')
    await user.type(montantInput, '100')
    expect(screen.queryByText('Le montant est obligatoire')).not.toBeInTheDocument()
  })
})

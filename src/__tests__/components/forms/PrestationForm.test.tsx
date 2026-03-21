import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrestationForm from '@/components/forms/PrestationForm'
import type { Prestation, Client, TypePrestation } from '@/types'

const mockClients: Client[] = [
  { nom: 'Dupont SARL', email: 'dupont@test.fr', _rowNumber: 0 },
  { nom: 'Martin & Co', email: 'martin@test.fr', _rowNumber: 1 },
]

const mockTypesPrestations: TypePrestation[] = [
  { nom: 'Conseil', montant_suggere: 500, _rowNumber: 0 },
  { nom: 'Formation', montant_suggere: 1200, _rowNumber: 1 },
]

function renderForm(props: Partial<Parameters<typeof PrestationForm>[0]> = {}) {
  const defaultProps = {
    clients: mockClients,
    typesPrestations: mockTypesPrestations,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  }
  return render(<PrestationForm {...defaultProps} {...props} />)
}

/** The Input component does not link label to input via for/id, so we query by role. */
function getDateInput(): HTMLInputElement {
  return document.querySelector('input[type="date"]') as HTMLInputElement
}

function getMontantInput(): HTMLInputElement {
  return screen.getByPlaceholderText('Ex: 50.00') as HTMLInputElement
}

describe('PrestationForm', () => {
  it('renders empty form with client and type dropdowns populated', () => {
    renderForm()

    // Client dropdown has the placeholder plus two clients
    const clientSelect = screen.getByLabelText(/Client/i) as HTMLSelectElement
    expect(clientSelect).toBeInTheDocument()
    expect(clientSelect.value).toBe('')
    expect(screen.getByText('Dupont SARL')).toBeInTheDocument()
    expect(screen.getByText('Martin & Co')).toBeInTheDocument()

    // Type dropdown has the placeholder plus two types
    const typeSelect = screen.getByLabelText(/Type de prestation/i) as HTMLSelectElement
    expect(typeSelect).toBeInTheDocument()
    expect(typeSelect.value).toBe('')
    expect(screen.getByText('Conseil')).toBeInTheDocument()
    expect(screen.getByText('Formation')).toBeInTheDocument()

    // Submit button says "Ajouter" in create mode
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('pre-fills form in edit mode', () => {
    const existing: Prestation = {
      date: '2026-03-10',
      nom_client: 'Dupont SARL',
      type_prestation: 'Conseil',
      montant: 750,
      paiement_id: 'PAY001',
      associatif: true,
    }

    renderForm({ prestation: existing })

    const clientSelect = screen.getByLabelText(/Client/i) as HTMLSelectElement
    expect(clientSelect.value).toBe('Dupont SARL')

    const typeSelect = screen.getByLabelText(/Type de prestation/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('Conseil')

    // Date input should have the prestation's date
    const dateInput = getDateInput()
    expect(dateInput.value).toBe('2026-03-10')

    // Montant should be the prestation's montant, not the suggested one
    const montantInput = getMontantInput()
    expect(montantInput.value).toBe('750')

    // Associatif checkbox should be checked
    const associatifCheckbox = screen.getByLabelText(/Prestation associative/i) as HTMLInputElement
    expect(associatifCheckbox.checked).toBe(true)

    // Submit button says "Modifier" in edit mode
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    renderForm()

    // Use fireEvent.submit to bypass native HTML5 constraint validation in jsdom
    const form = document.querySelector('form')!
    fireEvent.submit(form)

    expect(screen.getByText('Le client est obligatoire')).toBeInTheDocument()
    expect(screen.getByText('Le type de prestation est obligatoire')).toBeInTheDocument()
    expect(screen.getByText('La date est obligatoire')).toBeInTheDocument()
    expect(screen.getByText('Le montant est obligatoire')).toBeInTheDocument()
  })

  it('auto-fills montant when selecting a type in create mode', async () => {
    const user = userEvent.setup()
    renderForm()

    const typeSelect = screen.getByLabelText(/Type de prestation/i)
    await user.selectOptions(typeSelect, 'Formation')

    const montantInput = getMontantInput()
    expect(montantInput.value).toBe('1200')
  })

  it('does NOT auto-fill montant in edit mode', async () => {
    const user = userEvent.setup()
    const existing: Prestation = {
      date: '2026-03-10',
      nom_client: 'Dupont SARL',
      type_prestation: 'Conseil',
      montant: 750,
    }

    renderForm({ prestation: existing })

    // Change the type to Formation
    const typeSelect = screen.getByLabelText(/Type de prestation/i)
    await user.selectOptions(typeSelect, 'Formation')

    // Montant should still be 750, not auto-filled to 1200
    const montantInput = getMontantInput()
    expect(montantInput.value).toBe('750')
  })

  it('validates montant must be greater than 0', async () => {
    const user = userEvent.setup()
    renderForm()

    // Fill required fields except montant is 0
    await user.selectOptions(screen.getByLabelText(/Client/i), 'Dupont SARL')
    await user.selectOptions(screen.getByLabelText(/Type de prestation/i), 'Conseil')

    // Clear the auto-filled montant and type 0
    const montantInput = getMontantInput()
    await user.clear(montantInput)
    await user.type(montantInput, '0')

    const dateInput = getDateInput()
    await user.type(dateInput, '2026-03-15')

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Le montant doit être supérieur à 0')).toBeInTheDocument()
  })

  it('calls onSubmit with correct data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm({ onSubmit })

    await user.selectOptions(screen.getByLabelText(/Client/i), 'Martin & Co')
    await user.selectOptions(screen.getByLabelText(/Type de prestation/i), 'Formation')

    // Montant is auto-filled to 1200 from type selection; clear and set custom value
    const montantInput = getMontantInput()
    await user.clear(montantInput)
    await user.type(montantInput, '999.50')

    const dateInput = getDateInput()
    await user.type(dateInput, '2026-03-20')

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      date: '2026-03-20',
      nom_client: 'Martin & Co',
      type_prestation: 'Formation',
      montant: 999.50,
      paiement_id: undefined,
      associatif: false,
      notes: undefined,
    })
  })

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderForm({ onCancel })

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('associatif checkbox can be toggled', async () => {
    const user = userEvent.setup()
    renderForm()

    const checkbox = screen.getByLabelText(/Prestation associative/i) as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    await user.click(checkbox)
    expect(checkbox.checked).toBe(true)

    await user.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  it('renders notes textarea', () => {
    renderForm()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Commentaires optionnels...')).toBeInTheDocument()
  })

  it('pre-fills notes in edit mode', () => {
    const existing: Prestation = {
      date: '2026-03-10',
      nom_client: 'Dupont SARL',
      type_prestation: 'Conseil',
      montant: 500,
      notes: 'Une note importante',
    }
    renderForm({ prestation: existing })
    expect(screen.getByDisplayValue('Une note importante')).toBeInTheDocument()
  })

  it('submits notes when provided', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm({ onSubmit })

    await user.selectOptions(screen.getByLabelText(/Client/i), 'Martin & Co')
    await user.selectOptions(screen.getByLabelText(/Type de prestation/i), 'Formation')

    const montantInput = getMontantInput()
    await user.clear(montantInput)
    await user.type(montantInput, '100')

    const dateInput = getDateInput()
    await user.type(dateInput, '2026-03-20')

    await user.type(screen.getByLabelText('Notes'), 'Test note')

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Test note' })
    )
  })

  it('submits undefined notes when empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm({ onSubmit })

    await user.selectOptions(screen.getByLabelText(/Client/i), 'Martin & Co')
    await user.selectOptions(screen.getByLabelText(/Type de prestation/i), 'Formation')

    const montantInput = getMontantInput()
    await user.clear(montantInput)
    await user.type(montantInput, '100')

    const dateInput = getDateInput()
    await user.type(dateInput, '2026-03-20')

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ notes: undefined })
    )
  })

  it('associatif checkbox is disabled when prestation has paiement_id in edit mode', () => {
    const existing: Prestation = {
      date: '2026-03-10',
      nom_client: 'Dupont SARL',
      type_prestation: 'Conseil',
      montant: 500,
      paiement_id: 'PAY001',
      associatif: false,
    }

    renderForm({ prestation: existing })

    const checkbox = screen.getByLabelText(/Prestation associative/i) as HTMLInputElement
    expect(checkbox.disabled).toBe(true)
  })
})

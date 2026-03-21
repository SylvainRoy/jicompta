import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TypePrestationForm from '@/components/forms/TypePrestationForm'

/**
 * Helper to retrieve the two form inputs by their roles.
 * The nom input is a textbox; the montant input is a spinbutton (type="number").
 */
function getNomInput() {
  return screen.getByRole('textbox')
}

function getMontantInput() {
  return screen.getByRole('spinbutton')
}

/**
 * Submit the form programmatically.
 *
 * The component's inputs carry the HTML `required` attribute.  In jsdom +
 * userEvent v14, clicking the submit button invokes `requestSubmit()` which
 * runs native constraint validation and silently aborts when a required field
 * is empty — the React `onSubmit` handler never fires.  To test the
 * component's *own* validation logic we therefore dispatch a submit event
 * directly on the <form>, which bypasses native constraint validation.
 */
function submitForm() {
  // The <form> is the only one in the document.
  fireEvent.submit(screen.getByRole('textbox').closest('form')!)
}

describe('TypePrestationForm', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  }

  it('renders empty form with "Ajouter" button in create mode', () => {
    render(<TypePrestationForm {...defaultProps} />)

    expect(getNomInput()).toHaveValue('')
    expect(getMontantInput()).toHaveValue(null)
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('pre-fills form and shows "Modifier" button in edit mode', () => {
    render(
      <TypePrestationForm
        {...defaultProps}
        typePrestation={{ nom: 'Cours collectif', montant_suggere: 35.5 }}
      />
    )

    expect(getNomInput()).toHaveValue('Cours collectif')
    expect(getMontantInput()).toHaveValue(35.5)
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  it('shows error when nom is empty on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TypePrestationForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    const user = userEvent.setup()
    await user.type(getMontantInput(), '50')
    submitForm()

    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error when montant_suggere is empty on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TypePrestationForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    const user = userEvent.setup()
    await user.type(getNomInput(), 'Cours')
    submitForm()

    expect(screen.getByText('Le montant suggéré est obligatoire')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error for invalid amount (0 or negative)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TypePrestationForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    const user = userEvent.setup()
    await user.type(getNomInput(), 'Cours')
    await user.type(getMontantInput(), '0')
    submitForm()

    expect(screen.getByText('Le montant doit être supérieur à 0')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data (nom trimmed, montant as number)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TypePrestationForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.type(getNomInput(), '  Cours individuel  ')
    await user.type(getMontantInput(), '42.50')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledWith({
      nom: 'Cours individuel',
      montant_suggere: 42.5,
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<TypePrestationForm onSubmit={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('clears field error when user types in the errored field', async () => {
    const user = userEvent.setup()
    render(<TypePrestationForm {...defaultProps} />)

    // Submit empty form to trigger both errors
    submitForm()

    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
    expect(screen.getByText('Le montant suggéré est obligatoire')).toBeInTheDocument()

    // Type in the nom field — its error should clear, but montant error remains
    await user.type(getNomInput(), 'A')

    expect(screen.queryByText('Le nom est obligatoire')).not.toBeInTheDocument()
    expect(screen.getByText('Le montant suggéré est obligatoire')).toBeInTheDocument()
  })
})

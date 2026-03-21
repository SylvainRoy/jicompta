import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientForm from '@/components/forms/ClientForm'
import type { Client } from '@/types'

describe('ClientForm', () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onCancel = vi.fn()

  const validClient: Client = {
    nom: 'Dupont SARL',
    email: 'contact@dupont.fr',
    telephone: '0612345678',
    adresse: '12 rue de Paris\n75001 Paris',
    numero_siret: '12345678901234',
  }

  // The Input component does not use htmlFor, so getByLabelText cannot
  // associate labels with inputs. Use placeholders to target them instead.
  const nomInput = () => screen.getByPlaceholderText('Nom du client')
  const emailInput = () => screen.getByPlaceholderText('email@exemple.com')
  const telephoneInput = () => screen.getByPlaceholderText('06 12 34 56 78')
  const siretInput = () => screen.getByPlaceholderText('12345678901234')
  const adresseInput = () =>
    screen.getByPlaceholderText('Adresse complète du client (multi-lignes)')

  /** Submit the form bypassing native HTML5 constraint validation. */
  const submitForm = () => fireEvent.submit(screen.getByRole('button', { name: 'Ajouter' }).closest('form')!)

  beforeEach(() => {
    onSubmit.mockClear()
    onCancel.mockClear()
  })

  it('renders empty form for creation with "Ajouter" button', () => {
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    expect(nomInput()).toHaveValue('')
    expect(emailInput()).toHaveValue('')
    expect(telephoneInput()).toHaveValue('')
    expect(siretInput()).toHaveValue('')
    expect(adresseInput()).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
    // Required labels display asterisks
    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('pre-fills all fields in edit mode and shows "Modifier" button', () => {
    render(<ClientForm client={validClient} onSubmit={onSubmit} onCancel={onCancel} />)

    expect(nomInput()).toHaveValue('Dupont SARL')
    expect(emailInput()).toHaveValue('contact@dupont.fr')
    expect(telephoneInput()).toHaveValue('0612345678')
    expect(siretInput()).toHaveValue('12345678901234')
    expect(adresseInput()).toHaveValue('12 rue de Paris\n75001 Paris')
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
  })

  // NOTE on native HTML5 validation:
  // The nom input has `required` and the email input has both `required` and
  // `type="email"`. jsdom enforces native constraint validation, which can
  // block the submit event before the component's own validateForm() runs.
  // For tests that exercise the component-level validation on empty /
  // malformed values, we use fireEvent.submit() on the <form> directly,
  // which dispatches the "submit" event without triggering checkValidity().

  it('shows required error for empty nom on submit', async () => {
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    // Leave nom empty, put a valid email
    fireEvent.change(emailInput(), { target: { value: 'test@example.com' } })
    submitForm()

    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows required error for empty email on submit', async () => {
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    fireEvent.change(nomInput(), { target: { value: 'Test Client' } })
    // Leave email empty
    submitForm()

    expect(screen.getByText("L'email est obligatoire")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid email format', async () => {
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    fireEvent.change(nomInput(), { target: { value: 'Test Client' } })
    // "test@localhost" passes isRequired but fails the email regex (no dot after @)
    fireEvent.change(emailInput(), { target: { value: 'test@localhost' } })
    submitForm()

    expect(screen.getByText("Format d'email invalide")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid phone', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.type(nomInput(), 'Test Client')
    await user.type(emailInput(), 'test@example.com')
    await user.type(telephoneInput(), 'abc')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Format de téléphone invalide')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid SIRET', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.type(nomInput(), 'Test Client')
    await user.type(emailInput(), 'test@example.com')
    await user.type(siretInput(), '123')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('SIRET invalide (14 chiffres requis)')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('accepts valid optional fields (valid phone and valid SIRET)', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.type(nomInput(), 'Test Client')
    await user.type(emailInput(), 'test@example.com')
    await user.type(telephoneInput(), '0612345678')
    await user.type(siretInput(), '12345678901234')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.queryByText('Format de téléphone invalide')).not.toBeInTheDocument()
    expect(screen.queryByText('SIRET invalide (14 chiffres requis)')).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalled()
  })

  it('clears field error when user types in that field', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    // Submit empty form via fireEvent.submit to bypass native validation
    // and trigger the component's own error messages.
    submitForm()
    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument()
    expect(screen.getByText("L'email est obligatoire")).toBeInTheDocument()

    // Type in nom field — its error should clear, email error should remain
    await user.type(nomInput(), 'A')
    expect(screen.queryByText('Le nom est obligatoire')).not.toBeInTheDocument()
    expect(screen.getByText("L'email est obligatoire")).toBeInTheDocument()

    // Type in email field — its error should clear
    await user.type(emailInput(), 'a')
    expect(screen.queryByText("L'email est obligatoire")).not.toBeInTheDocument()
  })

  it('calls onSubmit with correct trimmed data on valid form', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.type(nomInput(), '  Dupont SARL  ')
    await user.type(emailInput(), '  contact@dupont.fr  ')
    await user.type(telephoneInput(), '0612345678')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(onSubmit).toHaveBeenCalledWith({
      nom: 'Dupont SARL',
      email: 'contact@dupont.fr',
      telephone: '0612345678',
      adresse: undefined,
      numero_siret: undefined,
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ClientForm onSubmit={onSubmit} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows "Enregistrement..." during async submission', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void
    const slowSubmit = vi.fn(() => new Promise<void>((resolve) => {
      resolveSubmit = resolve
    }))

    render(<ClientForm onSubmit={slowSubmit} onCancel={onCancel} />)

    await user.type(nomInput(), 'Test Client')
    await user.type(emailInput(), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    // While submitting, the button text should change
    expect(screen.getByText('Enregistrement...')).toBeInTheDocument()
    expect(screen.queryByText('Ajouter')).not.toBeInTheDocument()

    // Resolve the submission
    resolveSubmit!()

    // After submission completes, button text should revert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
    })
    expect(screen.queryByText('Enregistrement...')).not.toBeInTheDocument()
  })
})

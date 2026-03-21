import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientCard from '@/components/common/ClientCard'
import type { Client } from '@/types'

describe('ClientCard', () => {
  const fullClient: Client = {
    nom: 'Dupont SARL',
    email: 'contact@dupont.fr',
    telephone: '0612345678',
    adresse: '12 rue de Paris\n75001 Paris',
    numero_siret: '12345678901234',
  }

  const minimalClient: Client = {
    nom: 'Martin & Co',
    email: 'info@martin.fr',
  }

  const onEdit = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    onEdit.mockClear()
    onDelete.mockClear()
  })

  it('renders client name', () => {
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Dupont SARL')
  })

  it('renders email', () => {
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('contact@dupont.fr')).toBeInTheDocument()
  })

  it('renders phone when present', () => {
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('0612345678')).toBeInTheDocument()
  })

  it('hides phone when not present', () => {
    render(<ClientCard client={minimalClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.queryByText('0612345678')).not.toBeInTheDocument()
  })

  it('renders address when present', () => {
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText((_, element) => {
      return element?.tagName === 'SPAN' && element?.textContent === '12 rue de Paris\n75001 Paris'
    })).toBeInTheDocument()
  })

  it('hides address when not present', () => {
    render(<ClientCard client={minimalClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.queryByText(/rue de Paris/)).not.toBeInTheDocument()
  })

  it('renders SIRET when present', () => {
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    const siretElement = screen.getByText('12345678901234')
    expect(siretElement).toBeInTheDocument()
    expect(siretElement.className).toContain('font-mono')
    expect(siretElement.className).toContain('text-xs')
  })

  it('hides SIRET when not present', () => {
    render(<ClientCard client={minimalClient} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.queryByText('12345678901234')).not.toBeInTheDocument()
  })

  it('Modifier button calls onEdit', async () => {
    const user = userEvent.setup()
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('Supprimer button calls onDelete', async () => {
    const user = userEvent.setup()
    render(<ClientCard client={fullClient} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

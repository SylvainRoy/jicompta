import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TypePrestationCard from '@/components/common/TypePrestationCard'
import type { TypePrestation } from '@/types'

describe('TypePrestationCard', () => {
  const typePrestation: TypePrestation = {
    nom: 'Consultation',
    montant_suggere: 500,
  }

  const onEdit = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    onEdit.mockClear()
    onDelete.mockClear()
  })

  it('renders type name', () => {
    render(<TypePrestationCard typePrestation={typePrestation} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Consultation')
  })

  it('shows "Montant suggéré" label', () => {
    render(<TypePrestationCard typePrestation={typePrestation} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('Montant suggéré')).toBeInTheDocument()
  })

  it('shows formatted amount', () => {
    render(<TypePrestationCard typePrestation={typePrestation} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText(/500,00/)).toBeInTheDocument()
  })

  it('Modifier button calls onEdit', async () => {
    const user = userEvent.setup()
    render(<TypePrestationCard typePrestation={typePrestation} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('Supprimer button calls onDelete', async () => {
    const user = userEvent.setup()
    render(<TypePrestationCard typePrestation={typePrestation} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

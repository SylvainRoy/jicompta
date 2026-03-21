import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DepenseCard from '@/components/common/DepenseCard'
import type { Depense } from '@/types'

describe('DepenseCard', () => {
  const depense: Depense = {
    date: '2026-03-15',
    compte: 'Mon compte',
    montant: 250.5,
    description: 'Achat de fournitures de bureau',
    _rowNumber: 0,
  }

  const onEdit = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    onEdit.mockClear()
    onDelete.mockClear()
  })

  it('renders compte name', () => {
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Mon compte')
  })

  it('shows formatted date', () => {
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('15/03/2026')).toBeInTheDocument()
  })

  it('shows formatted amount', () => {
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText(/250,50/)).toBeInTheDocument()
  })

  it('shows description', () => {
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('Achat de fournitures de bureau')).toBeInTheDocument()
  })

  it('Modifier button calls onEdit', async () => {
    const user = userEvent.setup()
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Modifier' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('Supprimer button calls onDelete', async () => {
    const user = userEvent.setup()
    render(<DepenseCard depense={depense} onEdit={onEdit} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

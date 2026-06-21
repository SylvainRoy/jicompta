/**
 * Reproduction of the production defect: the real Sheets values.append places
 * appended rows shifted to the right (observed: ~5 empty leading columns), so
 * the row is physically present but reads back blank in the header columns and
 * disappears from the app's list.
 *
 * With the current append-based write path this test FAILS (reproduces the bug).
 * It should PASS once the write no longer relies on append's column placement.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { SheetsEmulator } from '../mocks/sheetsEmulator'
import { STORAGE_KEYS } from '@/constants'
import { mockConfig } from '../mocks/data'
import { getPrestations, addPrestation, clearColumnMapCache } from '@/services/googleSheets'

const PRESTATION_HEADERS = [
  'date', 'nom_client', 'type_prestation', 'montant', 'paiement_id', 'associatif', 'notes',
]

beforeEach(() => {
  clearColumnMapCache()
  localStorage.setItem(
    STORAGE_KEYS.AUTH_USER,
    JSON.stringify({ email: 'test@example.com', name: 'Test', accessToken: 'tok-123' })
  )
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'tok-123')
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3_600_000))
  localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
})

describe('append column-shift bug', () => {
  it('a new prestation stays in column A and remains visible (production parity)', async () => {
    const emu = new SheetsEmulator()
    emu.setSheet('Prestation', PRESTATION_HEADERS, [
      ['2026-01-10', 'Client A', 'Conseil', 300, '', 'FALSE', ''],
    ])
    emu.setSheet('Journal', ['timestamp', 'action', 'entite', 'identifiant', 'description', 'avant', 'apres'])
    emu.setAppendColumnShift(5) // reproduce the real API placing rows 5 cols right
    server.use(...emu.handlers())

    await addPrestation({
      date: '2026-02-15', nom_client: 'Client B', type_prestation: 'Audit',
      montant: 750, associatif: false, notes: 'x', _rowNumber: -1,
    })

    // Physical placement: the new row must start at column A.
    const grid = emu.raw('Prestation')
    const newRow = grid[grid.length - 1]
    expect(newRow[0]).toBe('2026-02-15')

    // And it must therefore read back into the app's list.
    const after = await getPrestations()
    expect(after.data.find((p) => p.nom_client === 'Client B')).toBeDefined()
  })
})

/**
 * Round-trip integration tests for prestations against a STATEFUL Sheets backend.
 *
 * The default mocks stub append as a no-op, so a row that never reaches the
 * sheet still "passes". These tests use a stateful emulator instead, so the
 * invariant under test is the real one: a prestation written by addPrestation()
 * must be readable by getPrestations().
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { SheetsEmulator } from '../mocks/sheetsEmulator'
import { STORAGE_KEYS } from '@/constants'
import { mockConfig } from '../mocks/data'
import {
  getPrestations,
  addPrestation,
  deletePrestation,
  clearColumnMapCache,
} from '@/services/googleSheets'

const PRESTATION_HEADERS = [
  'date',
  'nom_client',
  'type_prestation',
  'montant',
  'paiement_id',
  'associatif',
  'notes',
]

function seedAuthAndConfig() {
  localStorage.setItem(
    STORAGE_KEYS.AUTH_USER,
    JSON.stringify({ email: 'test@example.com', name: 'Test', accessToken: 'tok-123' })
  )
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'tok-123')
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3_600_000))
  localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
}

let emu: SheetsEmulator

beforeEach(() => {
  clearColumnMapCache()
  seedAuthAndConfig()
  emu = new SheetsEmulator()
  emu.setSheet('Prestation', PRESTATION_HEADERS, [
    ['2026-01-10', 'Client A', 'Conseil', 300, '', 'FALSE', ''],
  ])
  emu.setSheet('Journal', [
    'timestamp',
    'action',
    'entite',
    'identifiant',
    'description',
    'avant',
    'apres',
  ])
  server.use(...emu.handlers())
})

describe('prestation add round-trip (stateful backend)', () => {
  it('a newly added prestation is readable afterwards', async () => {
    const before = await getPrestations()
    expect(before.data).toHaveLength(1)

    await addPrestation({
      date: '2026-02-15',
      nom_client: 'Client B',
      type_prestation: 'Audit',
      montant: 750,
      associatif: false,
      notes: 'première mission',
      _rowNumber: -1,
    })

    const after = await getPrestations()
    expect(after.data).toHaveLength(2)
    const added = after.data.find((p) => p.nom_client === 'Client B')
    expect(added).toBeDefined()
    // Fields must land in the right columns, not just "somewhere".
    expect(added).toMatchObject({
      date: '2026-02-15',
      type_prestation: 'Audit',
      montant: 750,
      associatif: false,
      notes: 'première mission',
    })
  })

  it('writes the prestation row to column A onward, not misaligned', async () => {
    await addPrestation({
      date: '2026-03-01',
      nom_client: 'Client C',
      type_prestation: 'Formation',
      montant: 500,
      associatif: true,
      _rowNumber: -1,
    })
    const grid = emu.raw('Prestation')
    const newRow = grid[grid.length - 1]
    expect(newRow[0]).toBe('2026-03-01') // date in col A
    expect(newRow[1]).toBe('Client C') // nom_client in col B
    expect(newRow[5]).toBe('TRUE') // associatif serialized
  })

  it('two sequential adds both survive', async () => {
    await addPrestation({
      date: '2026-04-01', nom_client: 'D1', type_prestation: 'X', montant: 100, _rowNumber: -1,
    })
    await addPrestation({
      date: '2026-04-02', nom_client: 'D2', type_prestation: 'Y', montant: 200, _rowNumber: -1,
    })
    const after = await getPrestations()
    expect(after.data.map((p) => p.nom_client)).toEqual(
      expect.arrayContaining(['Client A', 'D1', 'D2'])
    )
    expect(after.data).toHaveLength(3)
  })

  it('the prestation is persisted even when the Journal sheet is missing', async () => {
    // Reproduce an existing user whose migration v4 has not added the Journal tab.
    emu = new SheetsEmulator()
    emu.setSheet('Prestation', PRESTATION_HEADERS, [])
    clearColumnMapCache()
    server.use(...emu.handlers())

    // Journal append will 400; addPrestation must swallow it and still succeed.
    await expect(
      addPrestation({
        date: '2026-05-01', nom_client: 'No Journal', type_prestation: 'Z', montant: 42, _rowNumber: -1,
      })
    ).resolves.toBeUndefined()

    const after = await getPrestations()
    expect(after.data.find((p) => p.nom_client === 'No Journal')).toBeDefined()
  })

  it('adding after a soft-delete keeps the new row readable', async () => {
    // Soft-delete the only data row (the app blanks the row in place).
    await deletePrestation(0)
    await addPrestation({
      date: '2026-06-01', nom_client: 'After Delete', type_prestation: 'W', montant: 99, _rowNumber: -1,
    })
    const after = await getPrestations()
    expect(after.data.find((p) => p.nom_client === 'After Delete')).toBeDefined()
  })
})

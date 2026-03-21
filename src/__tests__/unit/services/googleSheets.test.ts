import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants'
import { mockConfig, mockSheetsRows } from '../../mocks/data'
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
  getTypesPrestations,
  addTypePrestation,
  deleteTypePrestation,
  getPrestations,
  addPrestation,
  updatePrestationsPaiementId,
  getPaiements,
  addPaiement,
  getDepenses,
  addDepense,
  clearColumnMapCache,
} from '@/services/googleSheets'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

function seedAuthAndConfig() {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({
    email: 'test@example.com', name: 'Test', accessToken: 'tok-123',
  }))
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'tok-123')
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
  localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
}

function sheetsValuesResponse(headers: string[], rows: string[][]) {
  return { values: [headers, ...rows] }
}

/** Dispatch GET /values/<encoded-range> to the correct mock data by sheet tab name */
function sheetsGetHandler(overrides?: Record<string, () => ReturnType<typeof HttpResponse.json>>) {
  return http.get(`${SHEETS_BASE}/:id/values/:range*`, ({ request }) => {
    const url = new URL(request.url)
    const path = decodeURIComponent(url.pathname)

    for (const [tab, data] of Object.entries({
      Clients: () => HttpResponse.json(sheetsValuesResponse(mockSheetsRows.clients.headers, mockSheetsRows.clients.rows)),
      TypeDePrestation: () => HttpResponse.json(sheetsValuesResponse(mockSheetsRows.typesPrestations.headers, mockSheetsRows.typesPrestations.rows)),
      Prestation: () => HttpResponse.json(sheetsValuesResponse(mockSheetsRows.prestations.headers, mockSheetsRows.prestations.rows)),
      Paiement: () => HttpResponse.json(sheetsValuesResponse(mockSheetsRows.paiements.headers, mockSheetsRows.paiements.rows)),
      Depense: () => HttpResponse.json(sheetsValuesResponse(mockSheetsRows.depenses.headers, mockSheetsRows.depenses.rows)),
      ...overrides,
    })) {
      if (path.includes(`/values/${tab}`)) {
        return data()
      }
    }

    return new HttpResponse(null, { status: 404 })
  })
}

describe('googleSheets service', () => {
  beforeEach(() => {
    clearColumnMapCache()
    seedAuthAndConfig()
    // Override default handlers with range-aware handler
    server.use(sheetsGetHandler())
  })

  // ==================== GET operations ====================

  describe('getClients', () => {
    it('parses clients from sheet data', async () => {
      const result = await getClients()
      expect(result.data).toHaveLength(3)
      expect(result.data[0].nom).toBe('Dupont SARL')
      expect(result.data[0].email).toBe('dupont@example.fr')
      expect(result.data[0].telephone).toBe('0612345678')
      expect(result.data[0]._rowNumber).toBe(0)
      expect(result.data[2].nom).toBe('Association Locale')
      expect(result.data[2].telephone).toBeUndefined()
    })

    it('skips empty rows', async () => {
      server.use(sheetsGetHandler({
        Clients: () => HttpResponse.json(sheetsValuesResponse(
          mockSheetsRows.clients.headers,
          [['', '', '', '', ''], ...mockSheetsRows.clients.rows]
        )),
      }))
      clearColumnMapCache()
      const result = await getClients()
      expect(result.data).toHaveLength(3)
      expect(result.data[0]._rowNumber).toBe(1)
    })

    it('returns empty array with error on API failure', async () => {
      server.use(sheetsGetHandler({
        Clients: () => { throw HttpResponse.json({ error: { message: 'Server error' } }, { status: 500 }) },
      }))
      clearColumnMapCache()
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await getClients()
      expect(result.data).toEqual([])
      expect(result.error).toBeDefined()
      spy.mockRestore()
    })

    it('handles empty sheet (no data rows)', async () => {
      server.use(sheetsGetHandler({
        Clients: () => HttpResponse.json({ values: [mockSheetsRows.clients.headers] }),
      }))
      clearColumnMapCache()
      const result = await getClients()
      expect(result.data).toEqual([])
    })
  })

  describe('getTypesPrestations', () => {
    it('parses types with numeric montant_suggere', async () => {
      const result = await getTypesPrestations()
      expect(result.data).toHaveLength(3)
      expect(result.data[0].nom).toBe('Conseil')
      expect(result.data[0].montant_suggere).toBe(500)
      expect(result.data[1].montant_suggere).toBe(1200)
    })
  })

  describe('getPrestations', () => {
    it('parses prestations with boolean associatif', async () => {
      const result = await getPrestations()
      expect(result.data).toHaveLength(3)
      expect(result.data[0].associatif).toBe(false)
      expect(result.data[2].associatif).toBe(true)
    })

    it('parses paiement_id as optional string', async () => {
      const result = await getPrestations()
      expect(result.data[0].paiement_id).toBeUndefined()
      expect(result.data[1].paiement_id).toBe('2603050001')
    })

    it('parses notes as optional string', async () => {
      const result = await getPrestations()
      expect(result.data[0].notes).toBe('Première consultation')
      expect(result.data[1].notes).toBeUndefined()
    })
  })

  describe('getPaiements', () => {
    it('parses paiements with optional fields', async () => {
      const result = await getPaiements()
      expect(result.data).toHaveLength(2)
      expect(result.data[0].date_encaissement).toBe('2026-03-10')
      expect(result.data[0].mode_encaissement).toBe('virement')
      expect(result.data[1].date_encaissement).toBeUndefined()
      expect(result.data[1].mode_encaissement).toBeUndefined()
    })

    it('parses notes as optional string', async () => {
      const result = await getPaiements()
      expect(result.data[0].notes).toBe('Paiement reçu par virement')
      expect(result.data[1].notes).toBeUndefined()
    })
  })

  describe('getDepenses', () => {
    it('parses depenses correctly', async () => {
      const result = await getDepenses()
      expect(result.data).toHaveLength(2)
      expect(result.data[0].compte).toBe('Mon compte')
      expect(result.data[0].montant).toBe(150)
      expect(result.data[1].compte).toBe('Association Locale')
    })
  })

  // ==================== WRITE operations ====================

  describe('addClient', () => {
    it('sends POST with correct values', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addClient({
        nom: 'New Client',
        email: 'new@test.fr',
        telephone: '0600000000',
        _rowNumber: -1,
      })
      expect(capturedBody.values).toBeDefined()
      expect(capturedBody.values[0]).toContain('New Client')
      expect(capturedBody.values[0]).toContain('new@test.fr')
    })
  })

  describe('updateClient', () => {
    it('sends PUT to correct row range', async () => {
      let capturedUrl = ''
      server.use(
        http.put(`${SHEETS_BASE}/:id/values/:range*`, ({ request }) => {
          capturedUrl = decodeURIComponent(request.url)
          return HttpResponse.json({ updatedRows: 1 })
        })
      )
      await updateClient(0, {
        nom: 'Updated Client',
        email: 'updated@test.fr',
        _rowNumber: 0,
      })
      expect(capturedUrl).toContain('A2')
    })
  })

  describe('deleteClient', () => {
    it('writes empty row to the correct range', async () => {
      let capturedBody: any = null
      server.use(
        http.put(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updatedRows: 1 })
        })
      )
      await deleteClient(1)
      expect(capturedBody.values[0].every((v: string) => v === '')).toBe(true)
    })
  })

  describe('addTypePrestation', () => {
    it('appends with correct values', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addTypePrestation({ nom: 'Audit', montant_suggere: 1500, _rowNumber: -1 })
      expect(capturedBody.values[0]).toContain('Audit')
      expect(capturedBody.values[0]).toContain(1500)
    })
  })

  describe('deleteTypePrestation', () => {
    it('writes empty row', async () => {
      let capturedBody: any = null
      server.use(
        http.put(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updatedRows: 1 })
        })
      )
      await deleteTypePrestation(0)
      expect(capturedBody.values[0].every((v: string) => v === '')).toBe(true)
    })
  })

  describe('addPrestation', () => {
    it('sends associatif as TRUE/FALSE string', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPrestation({
        date: '2026-04-01',
        nom_client: 'Test',
        type_prestation: 'Conseil',
        montant: 100,
        associatif: true,
        _rowNumber: -1,
      })
      expect(capturedBody.values[0]).toContain('TRUE')
    })

    it('sends notes in the row', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPrestation({
        date: '2026-04-01',
        nom_client: 'Test',
        type_prestation: 'Conseil',
        montant: 100,
        associatif: false,
        notes: 'Ma note',
        _rowNumber: -1,
      })
      expect(capturedBody.values[0]).toContain('Ma note')
    })

    it('sends empty string when notes is undefined', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPrestation({
        date: '2026-04-01',
        nom_client: 'Test',
        type_prestation: 'Conseil',
        montant: 100,
        associatif: false,
        _rowNumber: -1,
      })
      // The notes column (index 6) should be empty string
      const notesColIndex = mockSheetsRows.prestations.headers.indexOf('notes')
      expect(capturedBody.values[0][notesColIndex]).toBe('')
    })
  })

  describe('updatePrestationsPaiementId', () => {
    it('sends batchUpdate with correct cell references', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values\\:batchUpdate`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ totalUpdatedRows: 2 })
        })
      )
      await updatePrestationsPaiementId([0, 2], 'PAY001')
      expect(capturedBody.data).toHaveLength(2)
      expect(capturedBody.data[0].values[0][0]).toBe('PAY001')
      expect(capturedBody.data[0].range).toContain('E2')
      expect(capturedBody.data[1].range).toContain('E4')
    })
  })

  describe('addPaiement', () => {
    it('appends with optional fields as empty strings', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPaiement({
        reference: 'REF001',
        client: 'Client',
        total: 1000,
        _rowNumber: -1,
      })
      expect(capturedBody.values[0]).toContain('REF001')
      expect(capturedBody.values[0]).toContain(1000)
    })

    it('sends notes in the row', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPaiement({
        reference: 'REF002',
        client: 'Client',
        total: 500,
        notes: 'Note paiement',
        _rowNumber: -1,
      })
      expect(capturedBody.values[0]).toContain('Note paiement')
    })

    it('sends empty string when notes is undefined', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addPaiement({
        reference: 'REF003',
        client: 'Client',
        total: 300,
        _rowNumber: -1,
      })
      const notesColIndex = mockSheetsRows.paiements.headers.indexOf('notes')
      expect(capturedBody.values[0][notesColIndex]).toBe('')
    })
  })

  describe('addDepense', () => {
    it('appends depense row', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${SHEETS_BASE}/:id/values/:range*`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ updates: { updatedRows: 1 } })
        })
      )
      await addDepense({
        date: '2026-04-01',
        compte: 'Mon compte',
        montant: 200,
        description: 'Test',
        _rowNumber: -1,
      })
      expect(capturedBody.values[0]).toContain('Mon compte')
      expect(capturedBody.values[0]).toContain(200)
    })
  })

  // ==================== Auth guard ====================

  describe('authentication guard', () => {
    it('throws when not authenticated', async () => {
      localStorage.clear()
      clearColumnMapCache()
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await getClients()
      expect(result.data).toEqual([])
      expect(result.error).toBeDefined()
      spy.mockRestore()
    })
  })

  // ==================== Column map cache ====================

  describe('clearColumnMapCache', () => {
    it('forces re-reading headers on next call', async () => {
      // First call populates cache
      await getClients()

      clearColumnMapCache()
      let readCount = 0
      server.use(
        http.get(`${SHEETS_BASE}/:id/values/:range*`, ({ request }) => {
          const path = decodeURIComponent(new URL(request.url).pathname)
          if (path.includes('Clients')) readCount++
          return HttpResponse.json(
            sheetsValuesResponse(mockSheetsRows.clients.headers, mockSheetsRows.clients.rows)
          )
        })
      )
      await getClients()
      expect(readCount).toBe(1)
    })
  })
})

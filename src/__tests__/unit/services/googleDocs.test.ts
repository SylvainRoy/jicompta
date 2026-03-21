import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants'
import { mockConfig, mockClients, mockPrestations, mockPaiements } from '../../mocks/data'
import { generateFacture, generateRecu } from '@/services/googleDocs'

const DOCS_BASE = 'https://docs.googleapis.com/v1'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

function seedAuthAndConfig() {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({
    email: 'test@example.com', name: 'Test', accessToken: 'tok-123',
  }))
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'tok-123')
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
  localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
}

function setupPdfHandlers() {
  server.use(
    // Drive: search for year folder → not found
    http.get(`${DRIVE_BASE}/files`, ({ request }) => {
      const url = new URL(request.url)
      const q = url.searchParams.get('q') || ''
      if (q.includes('folder')) {
        return HttpResponse.json({ files: [] })
      }
      return HttpResponse.json({ files: [] })
    }),
    // Drive: create year folder
    http.post(`${DRIVE_BASE}/files`, () => {
      return HttpResponse.json({ id: 'year-folder-id' })
    }),
    // Drive: copy template
    http.post(`${DRIVE_BASE}/files/:id/copy`, () => {
      return HttpResponse.json({ id: 'temp-doc-id' })
    }),
    // Docs: batchUpdate (replace text)
    http.post(`${DOCS_BASE}/documents/:id\\:batchUpdate`, () => {
      return HttpResponse.json({ replies: [] })
    }),
    // Drive: export as PDF
    http.get(`${DRIVE_BASE}/files/:id/export`, () => {
      return new HttpResponse(new Blob(['fake-pdf'], { type: 'application/pdf' }), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      })
    }),
    // Drive: upload PDF
    http.post(`${UPLOAD_BASE}/files`, () => {
      return HttpResponse.json({ id: 'pdf-file-id' })
    }),
    // Drive: set permissions
    http.post(`${DRIVE_BASE}/files/:id/permissions`, () => {
      return HttpResponse.json({ id: 'permission-id' })
    }),
    // Drive: delete temp doc
    http.delete(`${DRIVE_BASE}/files/:id`, () => {
      return new HttpResponse(null, { status: 204 })
    }),
  )
}

describe('googleDocs service', () => {
  beforeEach(() => {
    seedAuthAndConfig()
    setupPdfHandlers()
  })

  describe('generateFacture', () => {
    it('returns a PDF URL on success', async () => {
      const paiement = mockPaiements[1] // Dupont SARL, not encaissé
      const client = mockClients[0]
      const prestations = [mockPrestations[0]]

      const url = await generateFacture(paiement, client, prestations)
      expect(url).toBe('https://drive.google.com/file/d/pdf-file-id/view')
    })

    it('sends correct template replacements', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${DOCS_BASE}/documents/:id\\:batchUpdate`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ replies: [] })
        })
      )

      const paiement = mockPaiements[0] // Martin & Co, encaissé
      const client = mockClients[1]
      const prestations = [mockPrestations[1]]

      await generateFacture(paiement, client, prestations)

      expect(capturedBody.requests).toBeDefined()
      const texts = capturedBody.requests.map((r: any) => r.replaceAllText.containsText.text)
      expect(texts).toContain('{{REFERENCE_PAIEMENT}}')
      expect(texts).toContain('{{NOM_CLIENT}}')
      expect(texts).toContain('{{TOTAL}}')

      const replacements = Object.fromEntries(
        capturedBody.requests.map((r: any) => [
          r.replaceAllText.containsText.text,
          r.replaceAllText.replaceText,
        ])
      )
      expect(replacements['{{REFERENCE_PAIEMENT}}']).toBe('2603050001')
      expect(replacements['{{NOM_CLIENT}}']).toBe('Martin & Co')
    })

    it('throws when not authenticated', async () => {
      localStorage.clear()
      await expect(
        generateFacture(mockPaiements[0], mockClients[0], [])
      ).rejects.toThrow()
    })
  })

  describe('generateRecu', () => {
    it('returns a PDF URL for encaissé paiement', async () => {
      const paiement = mockPaiements[0] // encaissé
      const client = mockClients[1]
      const prestations = [mockPrestations[1]]

      const url = await generateRecu(paiement, client, prestations)
      expect(url).toBe('https://drive.google.com/file/d/pdf-file-id/view')
    })

    it('throws when paiement is not encaissé', async () => {
      const paiement = mockPaiements[1] // no date_encaissement
      const client = mockClients[0]

      await expect(
        generateRecu(paiement, client, [])
      ).rejects.toThrow('Cannot generate reçu: payment not yet encaissé')
    })

    it('includes date_encaissement in replacements', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${DOCS_BASE}/documents/:id\\:batchUpdate`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ replies: [] })
        })
      )

      const paiement = mockPaiements[0]
      const client = mockClients[1]
      await generateRecu(paiement, client, [mockPrestations[1]])

      const replacements = Object.fromEntries(
        capturedBody.requests.map((r: any) => [
          r.replaceAllText.containsText.text,
          r.replaceAllText.replaceText,
        ])
      )
      expect(replacements['{{DATE_ENCAISSEMENT}}']).toBe('10/03/2026')
    })

    it('propagates API errors', async () => {
      server.use(
        http.post(`${DRIVE_BASE}/files/:id/copy`, () => {
          return new HttpResponse('Template not found', { status: 404 })
        })
      )
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await expect(
        generateRecu(mockPaiements[0], mockClients[1], [])
      ).rejects.toThrow()
      spy.mockRestore()
    })
  })
})

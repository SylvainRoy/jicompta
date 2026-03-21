import { http, HttpResponse } from 'msw'
import { mockSheetsRows } from './data'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const AUTH_BASE = 'https://www.googleapis.com'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

// Helper to build a Sheets API values response
function sheetsValuesResponse(headers: string[], rows: string[][]) {
  return { values: [headers, ...rows] }
}

export const handlers = [
  // ============================================
  // Google Sheets API - Read operations
  // ============================================

  http.get(`${SHEETS_BASE}/:spreadsheetId/values/Clients`, () => {
    return HttpResponse.json(
      sheetsValuesResponse(mockSheetsRows.clients.headers, mockSheetsRows.clients.rows)
    )
  }),

  http.get(`${SHEETS_BASE}/:spreadsheetId/values/TypeDePrestation`, () => {
    return HttpResponse.json(
      sheetsValuesResponse(mockSheetsRows.typesPrestations.headers, mockSheetsRows.typesPrestations.rows)
    )
  }),

  http.get(`${SHEETS_BASE}/:spreadsheetId/values/Prestation`, () => {
    return HttpResponse.json(
      sheetsValuesResponse(mockSheetsRows.prestations.headers, mockSheetsRows.prestations.rows)
    )
  }),

  http.get(`${SHEETS_BASE}/:spreadsheetId/values/Paiement`, () => {
    return HttpResponse.json(
      sheetsValuesResponse(mockSheetsRows.paiements.headers, mockSheetsRows.paiements.rows)
    )
  }),

  http.get(`${SHEETS_BASE}/:spreadsheetId/values/Depense`, () => {
    return HttpResponse.json(
      sheetsValuesResponse(mockSheetsRows.depenses.headers, mockSheetsRows.depenses.rows)
    )
  }),

  // ============================================
  // Google Sheets API - Write operations (append, update, clear)
  // ============================================

  http.post(`${SHEETS_BASE}/:spreadsheetId/values/*`, () => {
    return HttpResponse.json({ updates: { updatedRows: 1 } })
  }),

  http.put(`${SHEETS_BASE}/:spreadsheetId/values/*`, () => {
    return HttpResponse.json({ updatedRows: 1 })
  }),

  // ============================================
  // Google Auth API
  // ============================================

  http.get(`${AUTH_BASE}/oauth2/v2/userinfo`, () => {
    return HttpResponse.json({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    })
  }),

  http.get(`${AUTH_BASE}/oauth2/v1/tokeninfo`, ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('access_token')
    if (token === 'invalid-token') {
      return new HttpResponse(null, { status: 401 })
    }
    return HttpResponse.json({
      audience: 'mock-client-id',
      scope: 'openid email profile',
      expires_in: 3600,
    })
  }),

  http.post(`${AUTH_BASE.replace('www.', '')}oauth2.googleapis.com/revoke`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // ============================================
  // Google Drive API
  // ============================================

  http.get(`${DRIVE_BASE}/files`, () => {
    return HttpResponse.json({ files: [] })
  }),

  http.post(`${DRIVE_BASE}/files`, () => {
    return HttpResponse.json({ id: 'mock-new-file-id', name: 'New File' })
  }),

  http.delete(`${DRIVE_BASE}/files/:fileId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

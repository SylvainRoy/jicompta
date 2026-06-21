/**
 * Stateful in-memory Google Sheets emulator.
 *
 * Unlike the default MSW handlers (which stub append/update as no-ops that
 * always return success), this emulator keeps real per-sheet cell state and
 * implements values.get / values.update (PUT) / values.append / batchUpdate
 * against it. This lets tests exercise the *real* round-trip: a row written
 * by addX() must actually be readable by getX().
 *
 * APPEND SEMANTICS (the part that matters for this bug):
 * Google's spreadsheets.values.append with the default insertDataOption=OVERWRITE
 * finds a "table" inside the searched range and writes immediately after the
 * last row of that table, in column-A-first order. A table is the contiguous
 * block of non-empty rows from the first non-empty row down to the first empty
 * row. We model exactly that, so soft-deleted (blank) rows in the middle of a
 * sheet behave the way they do in production.
 */
import { http, HttpResponse } from 'msw'

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

type Cell = string | number | boolean
type Grid = Cell[][]

interface ParsedRange {
  title: string
  startCol: number | null
  startRow: number | null // 0-based
  endCol: number | null
  endRow: number | null // 0-based
}

function colToIndex(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function parseA1Part(part: string): { col: number | null; row: number | null } {
  const m = /^([A-Za-z]*)(\d*)$/.exec(part.trim())
  if (!m) return { col: null, row: null }
  const [, letters, digits] = m
  return {
    col: letters ? colToIndex(letters) : null,
    row: digits ? parseInt(digits, 10) - 1 : null,
  }
}

function parseRange(range: string): ParsedRange {
  const bang = range.lastIndexOf('!')
  const title = bang >= 0 ? range.slice(0, bang).replace(/^'|'$/g, '') : range
  const a1 = bang >= 0 ? range.slice(bang + 1) : ''
  if (!a1) return { title, startCol: null, startRow: null, endCol: null, endRow: null }
  const [startPart, endPart] = a1.split(':')
  const start = parseA1Part(startPart)
  const end = endPart ? parseA1Part(endPart) : start
  return {
    title,
    startCol: start.col,
    startRow: start.row,
    endCol: end.col,
    endRow: end.row,
  }
}

const isCellEmpty = (c: Cell | undefined) => c === undefined || c === null || c === ''
const isRowEmpty = (row: Cell[] | undefined) => !row || row.every(isCellEmpty)

export class SheetsEmulator {
  private grids: Record<string, Grid> = {}
  private sheetIds: Record<string, number> = {}
  private nextSheetId = 1
  private appendColShift = 0
  appendCalls: { title: string; rowIndex: number; values: Cell[] }[] = []

  /**
   * Model the production defect: the real values.append places appended rows
   * starting N columns to the right of column A instead of A. Set to 0 for the
   * faithful (aligned) behavior.
   */
  setAppendColumnShift(n: number): void {
    this.appendColShift = n
  }

  /** Seed a sheet with a header row + data rows. */
  setSheet(title: string, headers: string[], rows: Cell[][] = []): void {
    this.grids[title] = [headers.slice(), ...rows.map((r) => r.slice())]
    if (!(title in this.sheetIds)) this.sheetIds[title] = this.nextSheetId++
  }

  /** Read raw current state of a sheet (header + data) for assertions. */
  raw(title: string): Grid {
    return (this.grids[title] || []).map((r) => r.slice())
  }

  private get(range: ParsedRange): Cell[][] {
    const grid = this.grids[range.title]
    if (!grid) return []
    const startRow = range.startRow ?? 0
    const endRow = range.endRow ?? grid.length - 1
    const slice: Cell[][] = []
    for (let r = startRow; r <= endRow && r < grid.length; r++) {
      const full = grid[r] || []
      const startCol = range.startCol ?? 0
      const endCol = range.endCol ?? full.length - 1
      slice.push(full.slice(startCol, endCol + 1))
    }
    // Mimic real API: drop trailing fully-empty rows.
    while (slice.length && isRowEmpty(slice[slice.length - 1])) slice.pop()
    return slice
  }

  private put(range: ParsedRange, values: Cell[][]): void {
    const grid = (this.grids[range.title] ||= [])
    const baseRow = range.startRow ?? 0
    const baseCol = range.startCol ?? 0
    values.forEach((row, i) => {
      const r = baseRow + i
      while (grid.length <= r) grid.push([])
      row.forEach((val, j) => {
        grid[r][baseCol + j] = val
      })
    })
  }

  /** OVERWRITE-mode append after the detected table (see file header). */
  private append(range: ParsedRange, values: Cell[][]): { exists: boolean } {
    const grid = this.grids[range.title]
    if (!grid) return { exists: false } // unknown sheet -> caller returns 400

    // Find the table: first non-empty row, then down to first empty row.
    let firstData = 0
    while (firstData < grid.length && isRowEmpty(grid[firstData])) firstData++
    let tableEnd = firstData
    while (tableEnd + 1 < grid.length && !isRowEmpty(grid[tableEnd + 1])) tableEnd++
    const target = grid.length === 0 ? 0 : tableEnd + 1

    values.forEach((row, i) => {
      const r = target + i
      while (grid.length <= r) grid.push([])
      const placed =
        this.appendColShift > 0
          ? [...new Array(this.appendColShift).fill(''), ...row]
          : row.slice()
      grid[r] = placed
      this.appendCalls.push({ title: range.title, rowIndex: r, values: placed.slice() })
    })
    return { exists: true }
  }

  handlers() {
    const decode = (req: Request) => decodeURIComponent(new URL(req.url).pathname)

    return [
      // values.get
      http.get(`${BASE}/:id/values/:range*`, ({ request }) => {
        const path = decode(request as unknown as Request)
        const range = path.split('/values/')[1]
        return HttpResponse.json({ values: this.get(parseRange(range)) })
      }),

      // values.update (PUT)
      http.put(`${BASE}/:id/values/:range*`, async ({ request }) => {
        const path = decode(request as unknown as Request)
        const range = path.split('/values/')[1].split('?')[0]
        const body = (await request.json()) as { values: Cell[][] }
        this.put(parseRange(range), body.values || [])
        return HttpResponse.json({ updatedRows: body.values?.length ?? 0 })
      }),

      // POST: either values/<range>:append, values:batchUpdate, or <id>:batchUpdate
      http.post(`${BASE}/:id*`, async ({ request }) => {
        const path = decode(request as unknown as Request)
        const body = (await request.json().catch(() => ({}))) as any

        if (path.includes('/values/') && path.endsWith(':append')) {
          const range = path.split('/values/')[1].replace(/:append$/, '').split('?')[0]
          const res = this.append(parseRange(range), body.values || [])
          if (!res.exists) {
            return HttpResponse.json(
              { error: { code: 400, message: `Unable to parse range: ${range}` } },
              { status: 400 }
            )
          }
          return HttpResponse.json({ updates: { updatedRows: (body.values || []).length } })
        }

        if (path.endsWith('/values:batchUpdate')) {
          for (const d of body.data || []) this.put(parseRange(d.range), d.values || [])
          return HttpResponse.json({ totalUpdatedRows: (body.data || []).length })
        }

        if (path.endsWith(':batchUpdate')) {
          for (const reqItem of body.requests || []) {
            const title = reqItem?.addSheet?.properties?.title
            if (title && !this.grids[title]) {
              this.grids[title] = []
              this.sheetIds[title] = this.nextSheetId++
            }
          }
          return HttpResponse.json({ replies: [] })
        }

        return new HttpResponse(null, { status: 404 })
      }),

      // spreadsheet metadata (used by migrations)
      http.get(`${BASE}/:id`, () => {
        return HttpResponse.json({
          spreadsheetId: 'mock-spreadsheet-id',
          sheets: Object.keys(this.grids).map((title) => ({
            properties: { title, sheetId: this.sheetIds[title] ?? 0 },
          })),
        })
      }),
    ]
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants'
import { mockConfig } from '../../mocks/data'
import {
  loadConfig,
  getConfigValue,
  loadRepositories,
  saveRepositories,
  addRepository,
  removeRepository,
  checkExistingSetup,
  createBackup,
  listBackups,
  deleteBackup,
  runMigrations,
  LATEST_SCHEMA_VERSION,
} from '@/services/googleSetup'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

function seedAuth() {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify({
    email: 'test@example.com', name: 'Test', accessToken: 'tok-123',
  }))
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'tok-123')
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
}

function seedConfig() {
  localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
}

describe('googleSetup service', () => {
  beforeEach(() => {
    seedAuth()
  })

  // ==================== loadConfig ====================

  describe('loadConfig', () => {
    it('returns null when nothing stored', () => {
      expect(loadConfig()).toBeNull()
    })

    it('returns parsed config when stored', () => {
      seedConfig()
      const config = loadConfig()
      expect(config).not.toBeNull()
      expect(config!.spreadsheetId).toBe('mock-spreadsheet-id')
      expect(config!.folderName).toBe('Comptabilite')
    })

    it('returns null on corrupt JSON', () => {
      localStorage.setItem('jicompta_config', 'not-json')
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(loadConfig()).toBeNull()
      spy.mockRestore()
    })
  })

  // ==================== getConfigValue ====================

  describe('getConfigValue', () => {
    it('returns the requested value', () => {
      seedConfig()
      expect(getConfigValue('spreadsheetId')).toBe('mock-spreadsheet-id')
      expect(getConfigValue('folderName')).toBe('Comptabilite')
    })

    it('throws when config is missing', () => {
      expect(() => getConfigValue('spreadsheetId')).toThrow('Configuration not found')
    })

    it('throws when specific key is empty', () => {
      localStorage.setItem('jicompta_config', JSON.stringify({ ...mockConfig, templateRecuId: '' }))
      expect(() => getConfigValue('templateRecuId')).toThrow("Configuration value 'templateRecuId' not found")
    })
  })

  // ==================== Repository management ====================

  describe('loadRepositories', () => {
    it('returns empty array when nothing stored', () => {
      expect(loadRepositories()).toEqual([])
    })

    it('bootstraps from current config if no repository list exists', () => {
      seedConfig()
      const repos = loadRepositories()
      expect(repos).toHaveLength(1)
      expect(repos[0].spreadsheetId).toBe('mock-spreadsheet-id')
    })

    it('returns stored repositories', () => {
      const repos = [mockConfig, { ...mockConfig, folderComptabiliteId: 'other-id', folderName: 'Other' }]
      localStorage.setItem('jicompta_repositories', JSON.stringify(repos))
      expect(loadRepositories()).toHaveLength(2)
    })

    it('ensures folderName fallback on legacy entries', () => {
      const legacy = { ...mockConfig, folderName: undefined }
      localStorage.setItem('jicompta_repositories', JSON.stringify([legacy]))
      const repos = loadRepositories()
      expect(repos[0].folderName).toBe('Comptabilite')
    })

    it('handles corrupt JSON gracefully', () => {
      localStorage.setItem('jicompta_repositories', 'bad-json')
      expect(loadRepositories()).toEqual([])
    })
  })

  describe('saveRepositories', () => {
    it('persists to localStorage', () => {
      saveRepositories([mockConfig])
      const stored = JSON.parse(localStorage.getItem('jicompta_repositories')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].spreadsheetId).toBe('mock-spreadsheet-id')
    })
  })

  describe('addRepository', () => {
    it('adds a new repository', () => {
      seedConfig()
      const newConfig = { ...mockConfig, folderComptabiliteId: 'new-folder-id', folderName: 'New' }
      const repos = addRepository(newConfig)
      expect(repos).toHaveLength(2)
    })

    it('updates existing repository with same folderComptabiliteId', () => {
      seedConfig()
      const updated = { ...mockConfig, version: '99' }
      const repos = addRepository(updated)
      expect(repos).toHaveLength(1)
      expect(repos[0].version).toBe('99')
    })
  })

  describe('removeRepository', () => {
    it('removes a repository by folderComptabiliteId', () => {
      seedConfig()
      const repos = removeRepository(mockConfig.folderComptabiliteId)
      expect(repos).toHaveLength(0)
    })
  })

  // ==================== checkExistingSetup ====================

  describe('checkExistingSetup', () => {
    it('returns null when no folder found', async () => {
      server.use(
        http.get(`${DRIVE_BASE}/files`, () => {
          return HttpResponse.json({ files: [] })
        })
      )
      const result = await checkExistingSetup()
      expect(result).toBeNull()
    })

    it('returns config when full setup is detected', async () => {
      // Chain of Drive API calls for detectSetupInFolder
      let callCount = 0
      server.use(
        http.get(`${DRIVE_BASE}/files`, ({ request }) => {
          callCount++
          const url = new URL(request.url)
          const q = url.searchParams.get('q') || ''

          // 1st call: find Comptabilite folder
          if (q.includes("name='Comptabilite'") && q.includes('folder')) {
            return HttpResponse.json({ files: [{ id: 'folder-1', name: 'Comptabilite' }] })
          }
          // 2nd call: find Compta spreadsheet inside folder
          if (q.includes("name='Compta'") && q.includes('spreadsheet')) {
            return HttpResponse.json({ files: [{ id: 'ss-1', name: 'Compta', createdTime: '2026-01-01' }] })
          }
          // 3rd call: find subfolders
          if (q.includes('folder') && q.includes("'folder-1' in parents") && !q.includes("name=")) {
            return HttpResponse.json({
              files: [
                { id: 'f-factures', name: 'Factures' },
                { id: 'f-recus', name: 'Recus' },
                { id: 'f-modeles', name: 'Modeles' },
              ],
            })
          }
          // 4th call: find templates in Modeles
          if (q.includes("'f-modeles' in parents")) {
            return HttpResponse.json({
              files: [
                { id: 't-facture', name: 'Modèle de Facture' },
                { id: 't-recu', name: 'Modèle de Reçu' },
              ],
            })
          }
          return HttpResponse.json({ files: [] })
        })
      )

      const result = await checkExistingSetup()
      expect(result).not.toBeNull()
      expect(result!.spreadsheetId).toBe('ss-1')
      expect(result!.folderComptabiliteId).toBe('folder-1')
      expect(result!.templateFactureId).toBe('t-facture')
      expect(result!.templateRecuId).toBe('t-recu')
      expect(result!.folderFacturesId).toBe('f-factures')
      expect(result!.folderRecusId).toBe('f-recus')
    })

    it('returns null on API error', async () => {
      server.use(
        http.get(`${DRIVE_BASE}/files`, () => {
          return new HttpResponse('Server error', { status: 500 })
        })
      )
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await checkExistingSetup()
      expect(result).toBeNull()
      spy.mockRestore()
    })
  })

  // ==================== Backup operations ====================

  describe('createBackup', () => {
    it('copies spreadsheet and returns backup info', async () => {
      let capturedBody: any = null
      server.use(
        http.post(`${DRIVE_BASE}/files/:id/copy`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({
            id: 'backup-id',
            createdTime: '2026-03-20T10:00:00Z',
          })
        })
      )
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const result = await createBackup('ss-1', 'parent-folder')
      expect(result.id).toBe('backup-id')
      expect(result.name).toMatch(/^compta_backup_\d{6}_\d{6}$/)
      expect(capturedBody.parents).toEqual(['parent-folder'])
      spy.mockRestore()
    })
  })

  describe('listBackups', () => {
    it('returns parsed backup list sorted by date', async () => {
      server.use(
        http.get(`${DRIVE_BASE}/files`, () => {
          return HttpResponse.json({
            files: [
              { id: 'b1', name: 'compta_backup_260320_100000', createdTime: '2026-03-20T10:00:00Z' },
              { id: 'b2', name: 'compta_backup_260319_090000', createdTime: '2026-03-19T09:00:00Z' },
            ],
          })
        })
      )
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const backups = await listBackups('folder-id')
      expect(backups).toHaveLength(2)
      expect(backups[0].id).toBe('b1')
      expect(backups[0].date).toBe('260320')
      expect(backups[0].time).toBe('100000')
      spy.mockRestore()
    })

    it('returns empty array when no backups', async () => {
      server.use(
        http.get(`${DRIVE_BASE}/files`, () => {
          return HttpResponse.json({ files: [] })
        })
      )
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const backups = await listBackups('folder-id')
      expect(backups).toEqual([])
      spy.mockRestore()
    })
  })

  describe('deleteBackup', () => {
    it('calls DELETE on Drive API', async () => {
      let deletedId = ''
      server.use(
        http.delete(`${DRIVE_BASE}/files/:id`, ({ params }) => {
          deletedId = params.id as string
          return new HttpResponse(null, { status: 204 })
        })
      )
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await deleteBackup('backup-to-delete')
      expect(deletedId).toBe('backup-to-delete')
      spy.mockRestore()
    })
  })

  // ==================== Migrations ====================

  describe('runMigrations', () => {
    it('does nothing when schema is up to date', async () => {
      // Simulate _Meta sheet already exists with latest version
      server.use(
        http.get(`${SHEETS_BASE}/:id`, () => {
          return HttpResponse.json({
            sheets: [{ properties: { title: '_Meta' } }],
          })
        }),
        http.get(`${SHEETS_BASE}/:id/values/:range*`, ({ request }) => {
          const path = decodeURIComponent(new URL(request.url).pathname)
          if (path.includes('_Meta')) {
            return HttpResponse.json({
              values: [['schema_version', String(LATEST_SCHEMA_VERSION)]],
            })
          }
          return HttpResponse.json({ values: [] })
        })
      )
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await runMigrations('test-spreadsheet')
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('up to date'))
      spy.mockRestore()
    })

    it('creates _Meta sheet if missing and runs pending migrations', async () => {
      const apiCalls: string[] = []
      seedConfig()

      server.use(
        // GET spreadsheet metadata — no _Meta sheet initially, then has it after creation
        http.get(`${SHEETS_BASE}/:id`, ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('includeGridData') === 'false') {
            // Used by migration checks and ensureMetaSheet
            return HttpResponse.json({
              sheets: [
                { properties: { title: 'Clients', sheetId: 0 } },
                { properties: { title: 'Prestation', sheetId: 2 } },
                { properties: { title: '_Meta', sheetId: 99 } },
                { properties: { title: 'Depense', sheetId: 5 } },
              ],
            })
          }
          return HttpResponse.json({ sheets: [] })
        }),
        // GET values (for schema version reads and migration checks)
        http.get(`${SHEETS_BASE}/:id/values/:range*`, ({ request }) => {
          const path = decodeURIComponent(new URL(request.url).pathname)
          if (path.includes('_Meta')) {
            // Return version 0 — all migrations pending
            return HttpResponse.json({
              values: [['schema_version', '0']],
            })
          }
          if (path.includes('Prestation!F1')) {
            // Migration 2 checks if column F header exists
            return HttpResponse.json({ values: [['associatif']] })
          }
          return HttpResponse.json({ values: [] })
        }),
        // POST — batchUpdate, append, etc.
        http.post(`${SHEETS_BASE}/:id/:action*`, async ({ request }) => {
          apiCalls.push(`POST ${new URL(request.url).pathname}`)
          return HttpResponse.json({ replies: [{}] })
        }),
        // PUT — write values
        http.put(`${SHEETS_BASE}/:id/values/:range*`, async () => {
          return HttpResponse.json({ updatedRows: 1 })
        }),
        // Backup: copy spreadsheet
        http.post(`${DRIVE_BASE}/files/:id/copy`, () => {
          return HttpResponse.json({ id: 'backup-id', createdTime: new Date().toISOString() })
        }),
      )

      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await runMigrations('test-spreadsheet')
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('migration'))
      spy.mockRestore()
      warnSpy.mockRestore()
    })
  })

  // ==================== LATEST_SCHEMA_VERSION ====================

  describe('LATEST_SCHEMA_VERSION', () => {
    it('is a positive number', () => {
      expect(LATEST_SCHEMA_VERSION).toBeGreaterThan(0)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { ConfigProvider, useConfig } from '@/contexts/ConfigContext'

vi.mock('@/services/googleSetup', () => ({
  addRepository: vi.fn(),
}))

const mockConfig = {
  spreadsheetId: 'test-spreadsheet-id',
  templateFactureId: 'test-template-facture-id',
  templateRecuId: 'test-template-recu-id',
  folderComptabiliteId: 'test-folder-id',
  folderFacturesId: 'test-factures-id',
  folderRecusId: 'test-recus-id',
  setupDate: '2026-01-15',
  version: '2',
  folderName: 'Comptabilite',
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider>{children}</ConfigProvider>
)

describe('ConfigContext', () => {
  beforeEach(() => {
    // localStorage is cleared in global setup.ts afterEach
  })

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = (e: Event) => e.preventDefault()
    window.addEventListener('error', onError)
    expect(() => renderHook(() => useConfig())).toThrow(
      'useConfig must be used within a ConfigProvider'
    )
    window.removeEventListener('error', onError)
    spy.mockRestore()
  })

  it('starts as not configured when no localStorage', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    expect(result.current.isConfigured).toBe(false)
    expect(result.current.config).toBeNull()
  })

  it('loads config from localStorage on mount', async () => {
    localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
    const { result } = renderHook(() => useConfig(), { wrapper })
    await waitFor(() => {
      expect(result.current.isConfigured).toBe(true)
    })
    expect(result.current.config?.spreadsheetId).toBe('test-spreadsheet-id')
    expect(result.current.config?.folderName).toBe('Comptabilite')
  })

  it('saveConfig persists to localStorage and updates state', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    act(() => { result.current.saveConfig(mockConfig) })
    expect(result.current.isConfigured).toBe(true)
    expect(result.current.config?.spreadsheetId).toBe('test-spreadsheet-id')
    const stored = JSON.parse(localStorage.getItem('jicompta_config')!)
    expect(stored.spreadsheetId).toBe('test-spreadsheet-id')
  })

  it('saveConfig sets default folderName if missing', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    const configNoFolder = { ...mockConfig, folderName: '' }
    act(() => { result.current.saveConfig(configNoFolder) })
    expect(result.current.config?.folderName).toBe('Comptabilite')
  })

  it('clearConfig removes from localStorage and updates state', async () => {
    localStorage.setItem('jicompta_config', JSON.stringify(mockConfig))
    const { result } = renderHook(() => useConfig(), { wrapper })
    await waitFor(() => expect(result.current.isConfigured).toBe(true))

    act(() => { result.current.clearConfig() })
    expect(result.current.isConfigured).toBe(false)
    expect(result.current.config).toBeNull()
    expect(localStorage.getItem('jicompta_config')).toBeNull()
  })

  it('getSpreadsheetId throws when not configured', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    expect(() => result.current.getSpreadsheetId()).toThrow(
      'Configuration not initialized'
    )
  })

  it('getSpreadsheetId returns ID when configured', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    act(() => { result.current.saveConfig(mockConfig) })
    expect(result.current.getSpreadsheetId()).toBe('test-spreadsheet-id')
  })

  it('getTemplateFactureId returns ID when configured', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    act(() => { result.current.saveConfig(mockConfig) })
    expect(result.current.getTemplateFactureId()).toBe('test-template-facture-id')
  })

  it('getTemplateRecuId returns ID when configured', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    act(() => { result.current.saveConfig(mockConfig) })
    expect(result.current.getTemplateRecuId()).toBe('test-template-recu-id')
  })

  it('getFolderFacturesId throws when not configured', () => {
    const { result } = renderHook(() => useConfig(), { wrapper })
    expect(() => result.current.getFolderFacturesId()).toThrow(
      'Configuration not initialized'
    )
  })

  it('handles invalid JSON in localStorage gracefully', async () => {
    localStorage.setItem('jicompta_config', '{invalid json')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useConfig(), { wrapper })
    // Should fall back to not configured
    await waitFor(() => {
      // The useEffect has run and failed to parse
      expect(localStorage.getItem('jicompta_config')).toBeNull()
    })
    expect(result.current.isConfigured).toBe(false)
    spy.mockRestore()
  })
})

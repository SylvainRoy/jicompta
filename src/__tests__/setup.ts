// localStorage polyfill — Node 25+ has a native localStorage that is not fully
// functional in worker threads (missing getItem/setItem). Override it with a
// Map-based implementation before anything else runs.
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  },
  writable: true,
  configurable: true,
})

import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Clean up after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
})

// Close MSW server after all tests
afterAll(() => server.close())

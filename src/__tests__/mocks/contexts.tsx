import React from 'react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Test wrapper that provides all required context providers.
 * Use this when rendering components that depend on routing and contexts.
 *
 * Usage:
 *   render(<MyComponent />, { wrapper: TestProviders })
 *
 * For now this provides MemoryRouter only. Context providers will be
 * added in Phase 2+ when we write integration/component tests.
 */
export function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  )
}

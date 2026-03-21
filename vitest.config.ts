import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/__tests__/**',
        'src/vite-env.d.ts',
        'src/main.tsx',
      ],
      thresholds: {
        // Global thresholds — raise these as more phases are implemented
        // Phase 1 (utils only): ~5%. Phase 2+: increase toward 80%.
        'src/utils/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
}))

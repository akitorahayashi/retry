import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    globals: false,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**', '.tmp/**'],
    restoreMocks: true,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.ts'],
      reportsDirectory: './coverage',
      reporter: ['text-summary', 'lcov', 'json-summary'],
    },
  },
})

import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

function pkg(subpath: string) {
  return fileURLToPath(new URL(`../../packages/${subpath}`, import.meta.url))
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@fuelms/core': pkg('core/src'),
      '@fuelms/domain': pkg('domain/src'),
      '@fuelms/infrastructure': pkg('infrastructure/src'),
      '@fuelms/shared': pkg('shared/src'),
      '@fuelms/testing': pkg('testing/src'),
      '@fuelms/ui': pkg('ui/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/shared/src/**/*.test.ts',
    ],
    exclude: ['src/test/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/test/**', '**/*.d.ts', '**/*.config.*', 'src/main.tsx'],
    },
  },
})

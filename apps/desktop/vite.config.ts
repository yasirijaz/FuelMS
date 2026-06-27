import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

function pkg(subpath: string) {
  return fileURLToPath(new URL(`../../packages/${subpath}`, import.meta.url))
}

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      /* In-app aliases */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),

      /* Workspace package aliases — Vite bundles directly from source (no build step) */
      '@fuelms/core': pkg('core/src'),
      '@fuelms/domain': pkg('domain/src'),
      '@fuelms/infrastructure': pkg('infrastructure/src'),
      '@fuelms/shared': pkg('shared/src'),
      '@fuelms/testing': pkg('testing/src'),
      '@fuelms/ui': pkg('ui/src'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

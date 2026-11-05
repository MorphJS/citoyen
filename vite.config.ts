import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// base './' => rutas de assets relativas: el build funciona bajo https://<user>.github.io/<repo>/
// sin acoplar el código al nombre del repo. Con HashRouter la URL real nunca cambia de path.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node', // engine.ts es lógica pura: no necesita DOM
    include: ['src/**/*.test.ts'],
  },
})

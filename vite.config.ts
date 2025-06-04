import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCommonjs()
  ],
  css: {
    postcss: {
      plugins: [tailwindcss], //追加
    },
  },
  server: {
    host: true, // Allow external access (0.0.0.0)
  },
})

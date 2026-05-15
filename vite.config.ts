import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Dev server serves at /, production build serves under GH Pages at /tjbags/.
  // Vite rewrites absolute asset URLs (/fonts/x.otf) to include the prefix at build time.
  base: command === 'build' ? '/tjbags/' : '/',
  plugins: [react(), tailwindcss()],
}))

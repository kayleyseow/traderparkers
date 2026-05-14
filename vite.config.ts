import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Dev server serves at /, production build assumes GH Pages at /bag-bazaar/.
  // Vite rewrites absolute asset URLs (/fonts/x.otf) to include the prefix at build time.
  base: command === 'build' ? '/bag-bazaar/' : '/',
  plugins: [react(), tailwindcss()],
}))

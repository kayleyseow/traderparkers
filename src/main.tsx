import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * GitHub Pages SPA fallback: if 404.html bounced the user here with the
 * original path encoded in `?p=`, restore it via history.replaceState BEFORE
 * React Router mounts so the right route renders.
 */
{
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('p')
  if (redirect != null) {
    const query = params.get('q')
    const decodedPath = redirect.replace(/~and~/g, '&')
    const decodedQuery = query ? '?' + query.replace(/~and~/g, '&') : ''
    window.history.replaceState(
      null,
      '',
      window.location.pathname.replace(/\/$/, '') +
        decodedPath +
        decodedQuery +
        window.location.hash,
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

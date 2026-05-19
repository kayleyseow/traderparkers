import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router'
import Landing from './routes/Landing'
import Pantry from './routes/Pantry'
import Encyclopedia from './routes/Encyclopedia'
import Admin from './routes/Admin'
import BagDetail from './routes/BagDetail'
import EncyclopediaDetail from './routes/EncyclopediaDetail'
import About from './routes/About'
import FrameTuner from './routes/FrameTuner'
import NotFound from './routes/NotFound'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/encyclopedia/:id" element={<EncyclopediaDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<About />} />
        <Route path="/bags/:slug" element={<BagDetail />} />
        <Route path="/dev/frames" element={<FrameTuner />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

/* React Router's declarative mode preserves scroll position across navigations,
   so clicking a footer link (which sits at the bottom of the previous page)
   lands the new page mid-content. Reset to the top on every pathname change.
   `behavior: 'instant'` overrides the global `html { scroll-behavior: smooth }`
   so the reset doesn't animate during page transitions. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

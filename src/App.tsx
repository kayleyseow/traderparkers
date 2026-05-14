import { BrowserRouter, Routes, Route } from 'react-router'
import Landing from './routes/Landing'
import Gallery from './routes/Gallery'
import Catalog from './routes/Catalog'
import Admin from './routes/Admin'
import BagDetail from './routes/BagDetail'
import About from './routes/About'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/collection" element={<Gallery />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<About />} />
        <Route path="/bags/:slug" element={<BagDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

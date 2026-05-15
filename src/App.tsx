import { BrowserRouter, Routes, Route } from 'react-router'
import Landing from './routes/Landing'
import Pantry from './routes/Pantry'
import Encyclopedia from './routes/Encyclopedia'
import Admin from './routes/Admin'
import BagDetail from './routes/BagDetail'
import EncyclopediaDetail from './routes/EncyclopediaDetail'
import About from './routes/About'
import NotFound from './routes/NotFound'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/encyclopedia/:id" element={<EncyclopediaDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<About />} />
        <Route path="/bags/:slug" element={<BagDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

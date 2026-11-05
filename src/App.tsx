import { HashRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.tsx'
import Presentar from './pages/Presentar.tsx'
import Jugar from './pages/Jugar.tsx'
import Moderar from './pages/Moderar.tsx'
import Ensayo from './pages/Ensayo.tsx'

// HashRouter: GitHub Pages no reescribe rutas de SPA; con "#/" una recarga nunca da 404.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/presentar" element={<Presentar />} />
        <Route path="/jugar" element={<Jugar />} />
        <Route path="/moderar" element={<Moderar />} />
        <Route path="/ensayo" element={<Ensayo />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  )
}

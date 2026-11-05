import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/im-fell-english/400.css'
import '@fontsource/im-fell-english/400-italic.css'
import '@fontsource/im-fell-english-sc/400.css'
import '@fontsource/unifrakturcook/700.css'
import '@fontsource/caveat/500.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

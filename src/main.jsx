import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Le HTML est pré-rendu au build : on l'hydrate s'il est présent.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)

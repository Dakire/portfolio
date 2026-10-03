import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')

// Langue et articles viennent du HTML pré-rendu : l'hydratation doit partir des mêmes données.
const lang = document.documentElement.lang === 'en' ? 'en' : 'fr'
let posts = []
try {
  posts = JSON.parse(document.getElementById('posts-data')?.textContent ?? '[]')
} catch {
  // données absentes (mode dev) : section blog masquée
}

const app = (
  <StrictMode>
    <App lang={lang} posts={posts} />
  </StrictMode>
)

if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)

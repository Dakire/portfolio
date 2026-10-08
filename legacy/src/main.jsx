import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CONTACT_ROOT_ID, ISLANDS_DATA_ID, TERMINAL_ROOT_ID, TOOL_ROOT_ID } from './lib/islands.js'

// Production : les pages sont du HTML pré-rendu ; seules les zones interactives (« îlots ») sont hydratées.
// Chaque îlot est un chargement dynamique : une page ne télécharge que le code des îlots qu'elle contient.
// Les données (langue, textes) viennent du HTML : l'hydratation part du même état que le serveur.
// Un outil = un îlot (src/islands/tools/<id>.jsx) ; l'identifiant de l'outil de la page est dans les données sérialisées.
const TOOL_ISLANDS = import.meta.glob('./islands/tools/*.jsx')
const ISLANDS = {
  [CONTACT_ROOT_ID]: () => import('./islands/contact.jsx'),
  [TERMINAL_ROOT_ID]: () => import('./islands/terminal.jsx'),
  [TOOL_ROOT_ID]: (data) => TOOL_ISLANDS[`./islands/tools/${data.tool}.jsx`](),
}

const present = Object.entries(ISLANDS).filter(([id]) => document.getElementById(id))

if (present.length) {
  const data = JSON.parse(document.getElementById(ISLANDS_DATA_ID).textContent)
  for (const [id, load] of present) load(data).then((island) => island.default(document.getElementById(id), data))
} else if (import.meta.env.DEV) {
  // Développement (gabarit index.html, pas de pré-rendu) : toute la page est rendue côté client.
  import('./App.jsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
  })
}

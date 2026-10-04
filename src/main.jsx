import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CONTACT_ROOT_ID, DNS_ROOT_ID, ISLANDS_DATA_ID, TERMINAL_ROOT_ID } from './lib/islands.js'

// Production : les pages sont du HTML pré-rendu ; seules les zones interactives (« îlots ») sont hydratées.
// Chaque îlot est un chargement dynamique : une page ne télécharge que le code des îlots qu'elle contient.
// Les données (langue, textes) viennent du HTML : l'hydratation part du même état que le serveur.
const ISLANDS = {
  [CONTACT_ROOT_ID]: () => import('./islands/contact.jsx'),
  [DNS_ROOT_ID]: () => import('./islands/dns.jsx'),
  [TERMINAL_ROOT_ID]: () => import('./islands/terminal.jsx'),
}

const present = Object.entries(ISLANDS).filter(([id]) => document.getElementById(id))

if (present.length) {
  const data = JSON.parse(document.getElementById(ISLANDS_DATA_ID).textContent)
  for (const [id, load] of present) load().then((island) => island.default(document.getElementById(id), data))
} else if (import.meta.env.DEV) {
  // Développement (gabarit index.html, pas de pré-rendu) : toute la page est rendue côté client.
  import('./App.jsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
  })
}

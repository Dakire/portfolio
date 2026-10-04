import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { ContactIsland, HeaderIsland } from './islands.jsx'
import { CONTACT_ROOT_ID, HEADER_ROOT_ID, ISLANDS_DATA_ID } from './lib/islands.js'

// Production : la page est du HTML pré-rendu ; on n'hydrate que le menu et le formulaire de contact.
// Les données des îlots (langue, textes) viennent du HTML : l'hydratation part du même état que le serveur.
const header = document.getElementById(HEADER_ROOT_ID)
const contact = document.getElementById(CONTACT_ROOT_ID)

if (header && contact) {
  const { lang, ui, nav, form } = JSON.parse(document.getElementById(ISLANDS_DATA_ID).textContent)
  hydrateRoot(header, <StrictMode><HeaderIsland lang={lang} ui={ui} nav={nav} /></StrictMode>)
  hydrateRoot(contact, <StrictMode><ContactIsland lang={lang} form={form} /></StrictMode>)
} else if (import.meta.env.DEV) {
  // Développement (gabarit index.html, pas de pré-rendu) : toute la page est rendue côté client.
  import('./App.jsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
  })
}

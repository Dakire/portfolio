import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import ContactIsland from './components/ContactIsland.jsx'
import { CONTACT_ROOT_ID, ISLANDS_DATA_ID } from './lib/islands.js'

// Production : la page est du HTML pré-rendu ; seul le formulaire de contact est hydraté.
// Ses données (langue, textes) viennent du HTML : l'hydratation part du même état que le serveur.
const contact = document.getElementById(CONTACT_ROOT_ID)

if (contact) {
  const { lang, form } = JSON.parse(document.getElementById(ISLANDS_DATA_ID).textContent)
  hydrateRoot(contact, <StrictMode><ContactIsland lang={lang} form={form} /></StrictMode>)
} else if (import.meta.env.DEV) {
  // Développement (gabarit index.html, pas de pré-rendu) : toute la page est rendue côté client.
  import('./App.jsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
  })
}

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import ContactIsland from '../components/ContactIsland.jsx'

// Hydrate le formulaire de contact de l'accueil (chargé uniquement sur les pages qui le contiennent).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><ContactIsland lang={data.lang} form={data.form} /></StrictMode>)
}

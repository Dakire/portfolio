import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import EmailHeaders from '../../components/tools/EmailHeaders.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><EmailHeaders lang={data.lang} /></StrictMode>)
}

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import PasswordGenerator from '../../components/tools/PasswordGenerator.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><PasswordGenerator lang={data.lang} /></StrictMode>)
}

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import JsonFormatter from '../../components/tools/JsonFormatter.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><JsonFormatter lang={data.lang} /></StrictMode>)
}

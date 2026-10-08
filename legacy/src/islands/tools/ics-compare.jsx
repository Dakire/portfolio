import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import IcsCompare from '../../components/tools/IcsCompare.jsx'

// Hydrate l'outil « ics-compare » (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><IcsCompare lang={data.lang} /></StrictMode>)
}

import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import IcsSplit from '../../components/tools/IcsSplit.jsx'

// Hydrate l'outil « ics-split » (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><IcsSplit lang={data.lang} /></StrictMode>)
}

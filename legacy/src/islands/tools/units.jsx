import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import UnitConverter from '../../components/tools/UnitConverter.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><UnitConverter lang={data.lang} /></StrictMode>)
}

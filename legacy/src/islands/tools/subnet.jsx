import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import SubnetCalculator from '../../components/tools/SubnetCalculator.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><SubnetCalculator lang={data.lang} /></StrictMode>)
}

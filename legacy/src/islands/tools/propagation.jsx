import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import PropagationChecker from '../../components/tools/PropagationChecker.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><PropagationChecker lang={data.lang} /></StrictMode>)
}

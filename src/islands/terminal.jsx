import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import InteractiveTerminal from '../components/terminal/InteractiveTerminal.jsx'

// Hydrate le terminal interactif de l'accueil.
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><InteractiveTerminal lang={data.lang} data={data.terminal} /></StrictMode>)
}

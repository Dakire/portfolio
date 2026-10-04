import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import DnsChecker from '../components/tools/DnsChecker.jsx'

// Hydrate l'outil DNS (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><DnsChecker lang={data.lang} /></StrictMode>)
}

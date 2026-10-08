import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import EncoderDecoder from '../../components/tools/EncoderDecoder.jsx'

// Hydrate l'outil (chargé uniquement sur sa page).
export default function mount(el, data) {
  hydrateRoot(el, <StrictMode><EncoderDecoder lang={data.lang} /></StrictMode>)
}

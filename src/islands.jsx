// Zones interactives de l'accueil. Tout le reste de la page est du HTML pré-rendu qui n'est jamais hydraté :
// seuls ces deux conteneurs reçoivent du JavaScript (voir main.jsx).
import Header from './components/Header';
import ContactForm from './components/ContactForm';
import ErrorBoundary from './components/ErrorBoundary';

export const HeaderIsland = ({ lang, ui, nav }) => <Header lang={lang} ui={ui} nav={nav} />;

export const ContactIsland = ({ lang, form }) => (
  <ErrorBoundary fallback={form.fallback}>
    <ContactForm lang={lang} form={form} />
  </ErrorBoundary>
);

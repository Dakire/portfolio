// Seule zone interactive hydratée de l'accueil. Dans un ErrorBoundary : si le formulaire plante, le reste de la page
// (déjà pré-rendu) reste utilisable et l'adresse e-mail est proposée à la place.
import ContactForm from './ContactForm';
import ErrorBoundary from './ErrorBoundary';

export default function ContactIsland({ lang, form }) {
  return (
    <ErrorBoundary fallback={form.fallback}>
      <ContactForm lang={lang} form={form} />
    </ErrorBoundary>
  );
}

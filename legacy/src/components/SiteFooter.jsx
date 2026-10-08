import { Mail, MapPin } from 'lucide-react';
import { LANGS, PROFILE } from '../data/content';

// Rendu au build uniquement (jamais hydraté) : l'année est celle du build.
const YEAR = new Date().getFullYear();

// Pied de page commun à toutes les pages. Chaque lien fait au moins 44 px de haut (.tap).
export default function SiteFooter({ t, lang }) {
  return (
    <footer className="mt-section border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-x-8 gap-y-3 px-4 py-8 text-sm text-body sm:px-6 md:flex-row">
        <p>© {YEAR} {PROFILE.name}. {t.footer.rights}</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <li className="tap gap-1.5"><MapPin className="h-4 w-4 text-brand" aria-hidden="true" /> {PROFILE.location}</li>
          <li>
            <a href={`mailto:${PROFILE.email}`} className="tap link gap-1.5 no-underline hover:underline">
              <Mail className="h-4 w-4 text-brand" aria-hidden="true" /> {PROFILE.email}
            </a>
          </li>
          <li><a href={LANGS[lang].legal} className="tap link">{t.footer.legal}</a></li>
          <li><button type="button" data-consent-open className="tap link">{t.ui.cookies}</button></li>
        </ul>
      </div>
    </footer>
  );
}

import { Mail, MapPin } from 'lucide-react';
import { LANGS, PROFILE } from '../../data/content';

// Rendu au build uniquement (jamais hydraté) : l'année est celle du build.
const YEAR = new Date().getFullYear();

export default function Footer({ t, lang }) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-300">
        <p>© {YEAR} {PROFILE.name}. {t.footer.rights}</p>
        <ul className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
          <li className="flex items-center gap-1"><MapPin className="w-4 h-4" aria-hidden="true" /> {PROFILE.location}</li>
          <li>
            <a href={`mailto:${PROFILE.email}`} className="flex items-center gap-1 hover:text-emerald-300 transition-colors rounded">
              <Mail className="w-4 h-4" aria-hidden="true" /> {PROFILE.email}
            </a>
          </li>
          <li>
            <a href={LANGS[lang].legal} className="hover:text-emerald-300 underline underline-offset-2 transition-colors rounded">{t.footer.legal}</a>
          </li>
          <li>
            <button type="button" data-consent-open className="hover:text-emerald-300 underline underline-offset-2 transition-colors rounded">{t.ui.cookies}</button>
          </li>
        </ul>
      </div>
    </footer>
  );
}

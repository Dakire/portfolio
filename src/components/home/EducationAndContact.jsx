import { BookOpen, Mail, Shield } from 'lucide-react';
import { CONTACT_ROOT_ID } from '../../lib/islands';
import { ContactIsland } from '../../islands';

// Formation et contact côte à côte. Le formulaire est un îlot hydraté (voir src/islands.jsx).
export default function EducationAndContact({ t, lang }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section id="education" aria-labelledby="education-title" className="reveal scroll-mt-32">
        <h2 id="education-title" className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 shrink-0 text-emerald-400" aria-hidden="true" /> {t.educationTitle}
        </h2>
        <ul className="space-y-4 mb-6">
          {t.education.map((edu) => (
            <li key={edu} className="flex gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-slate-300 text-sm leading-relaxed">{edu}</span>
            </li>
          ))}
        </ul>
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-white font-bold mb-1">{t.ui.languages}</h3>
          <p className="text-sm text-slate-300">{t.languagesInfo}</p>
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-title" className="reveal scroll-mt-32">
        <h2 id="contact-title" className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
          <Mail className="w-6 h-6 shrink-0 text-emerald-400" aria-hidden="true" /> {t.contactTitle}
        </h2>
        <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl">
          <div id={CONTACT_ROOT_ID}>
            <ContactIsland lang={lang} form={t.form} />
          </div>
        </div>
      </section>
    </div>
  );
}

import { BookOpen, Mail, Shield } from 'lucide-react';
import { CONTACT_ROOT_ID } from '../../lib/islands';
import ContactIsland from '../ContactIsland';
import Card from '../ui/Card';
import SectionHeading from '../SectionHeading';

// Formation et contact côte à côte. Le formulaire est la seule zone hydratée (voir src/main.jsx).
export default function EducationAndContact({ t, lang }) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <section id="education" aria-labelledby="education-title" className="reveal">
        <SectionHeading id="education-title" icon={BookOpen}>{t.educationTitle}</SectionHeading>
        <ul className="mb-5 space-y-4">
          {t.education.map((edu) => (
            <li key={edu}>
              <Card className="flex gap-4 p-5">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <span className="text-copy text-body">{edu}</span>
              </Card>
            </li>
          ))}
        </ul>
        <Card className="p-6">
          <h3 className="mb-1 font-bold text-ink">{t.ui.languages}</h3>
          <p className="text-copy text-body">{t.languagesInfo}</p>
        </Card>
      </section>

      <section id="contact" aria-labelledby="contact-title" className="reveal">
        <SectionHeading id="contact-title" icon={Mail}>{t.contactTitle}</SectionHeading>
        <Card solid className="p-5 shadow-float sm:p-6 md:p-8">
          <div id={CONTACT_ROOT_ID}>
            <ContactIsland lang={lang} form={t.form} />
          </div>
        </Card>
      </section>
    </div>
  );
}

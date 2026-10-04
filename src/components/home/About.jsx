import { User } from 'lucide-react';
import { PROFILE } from '../../data/content';
import { GithubIcon, LinkedinIcon } from '../Icons';
import SectionHeading from '../SectionHeading';

export default function About({ t }) {
  return (
    <section id="about" aria-labelledby="about-title" className="reveal scroll-mt-32">
      <SectionHeading id="about-title" icon={User}>{t.aboutTitle}</SectionHeading>
      <div className="bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-2xl text-base sm:text-lg leading-relaxed text-slate-300 max-w-4xl shadow-xl">
        <p>{t.about}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 mt-8 pt-6 border-t border-slate-800">
          <li>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn — ${t.ui.linkedin}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-sky-300 transition-colors rounded">
              <LinkedinIcon className="w-6 h-6" /> LinkedIn
            </a>
          </li>
          <li>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" aria-label={`GitHub — ${t.ui.github}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded">
              <GithubIcon className="w-6 h-6" /> GitHub
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

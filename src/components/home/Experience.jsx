import { Briefcase, MapPin } from 'lucide-react';
import SectionHeading from '../SectionHeading';

export default function Experience({ t }) {
  return (
    <section id="experience" aria-labelledby="experience-title" className="reveal scroll-mt-32">
      <SectionHeading id="experience-title" icon={Briefcase}>{t.experienceTitle}</SectionHeading>
      <ol className="space-y-8 max-w-4xl">
        {t.experiences.map((exp) => (
          <li key={`${exp.company}-${exp.date}`} className="relative pl-8 md:pl-0">
            <div className="absolute left-[11px] md:left-[140px] top-2 -bottom-8 w-px bg-slate-700" aria-hidden="true" />
            <div className="absolute left-[7px] md:left-[136px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[3px] border-slate-950 box-content shadow-[0_0_14px_rgb(52_211_153/0.9)]" aria-hidden="true" />

            <div className="flex flex-col md:flex-row gap-4 md:gap-16">
              <p className="md:w-[120px] shrink-0 md:pt-6 md:text-right text-emerald-400 font-mono text-sm">{exp.date}</p>
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex-1 hover:bg-slate-900 transition-colors">
                <h3 className="text-xl font-bold text-white mb-1">{exp.role}</h3>
                <p className="text-emerald-300 font-medium text-sm mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {exp.company}
                  <span className="text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3" aria-hidden="true" /> {exp.location}
                  </span>
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">{exp.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

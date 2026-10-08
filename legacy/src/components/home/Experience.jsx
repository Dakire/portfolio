import { Briefcase, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeading from '../SectionHeading';

export default function Experience({ t }) {
  return (
    <section id="experience" aria-labelledby="experience-title" className="reveal">
      <SectionHeading id="experience-title" icon={Briefcase}>{t.experienceTitle}</SectionHeading>
      <ol className="max-w-4xl space-y-8">
        {t.experiences.map((exp) => (
          <li key={`${exp.company}-${exp.date}`} className="relative pl-8 md:pl-0">
            <div className="absolute -bottom-8 top-2 left-[11px] w-px bg-line-strong/60 md:left-[140px]" aria-hidden="true" />
            <div className="absolute left-[7px] top-3 box-content h-2.5 w-2.5 rounded-full border-[3px] border-canvas bg-brand shadow-[0_0_14px_var(--brand)] md:left-[136px]" aria-hidden="true" />

            <div className="flex flex-col gap-3 md:flex-row md:gap-16">
              <p className="shrink-0 font-mono text-meta text-link md:w-[120px] md:pt-6 md:text-right">{exp.date}</p>
              <Card glow className="flex-1 p-6">
                <h3 className="mb-1 text-xl font-bold text-ink">{exp.role}</h3>
                <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-copy font-medium text-link">
                  {exp.company}
                  <span className="flex items-center gap-1 font-normal text-body">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {exp.location}
                  </span>
                </p>
                <p className="text-copy text-body">{exp.desc}</p>
              </Card>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { FolderGit2 } from 'lucide-react';
import { PROFILE } from '../../data/content';
import { GithubIcon } from '../Icons';
import SectionHeading from '../SectionHeading';

const cardClass = 'card-lift bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-full';

function ProjectCard({ project, t }) {
  const body = (
    <>
      <div className="flex justify-between items-start mb-4">
        <FolderGit2 className="w-8 h-8 text-emerald-400" aria-hidden="true" />
        {project.href && <GithubIcon className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />}
      </div>
      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-300 transition-colors">
        {project.title}
        {project.href && <span className="sr-only"> — {t.ui.projectOpen}</span>}
      </h3>
      <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">{project.desc}</p>
      <ul className="flex flex-wrap gap-2 mt-auto" aria-label={t.ui.tags}>
        {project.tags.map((tag) => (
          <li key={tag} className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30">{tag}</li>
        ))}
      </ul>
    </>
  );
  return project.href ? (
    <a href={project.href} target="_blank" rel="noopener noreferrer" className={`${cardClass} group`}>{body}</a>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

export default function Projects({ t }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="reveal scroll-mt-32">
      <SectionHeading id="projects-title" icon={FolderGit2}>{t.projectsTitle}</SectionHeading>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {t.projects.map((project) => (
          <li key={project.title} className="h-full">
            <ProjectCard project={project} t={t} />
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 underline underline-offset-2 rounded">
          <GithubIcon className="w-5 h-5" /> {t.ui.repos}
        </a>
      </p>
    </section>
  );
}

import { FolderGit2 } from 'lucide-react';
import { PROFILE } from '../../data/content';
import { GithubIcon } from '../Icons';
import Card from '../ui/Card';
import SectionHeading from '../SectionHeading';

function ProjectCard({ project, t }) {
  const linked = Boolean(project.href);
  return (
    <Card
      as={linked ? 'a' : 'div'}
      glow
      solid
      className="group flex h-full flex-col p-6"
      {...(linked ? { href: project.href, target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="icon-tile h-11 w-11" aria-hidden="true"><FolderGit2 className="h-6 w-6" /></span>
        {linked && <GithubIcon className="h-5 w-5 text-body transition-colors duration-200 group-hover:text-ink" />}
      </div>
      <h3 className="mb-2 text-lg font-bold text-ink transition-colors duration-200 group-hover:text-link">
        {project.title}
        {linked && <span className="sr-only"> — {t.ui.projectOpen}</span>}
      </h3>
      <p className="mb-6 flex-1 text-copy text-body">{project.desc}</p>
      <ul className="mt-auto flex flex-wrap gap-2" aria-label={t.ui.tags}>
        {project.tags.map((tag) => (
          <li key={tag} className="tag">{tag}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function Projects({ t }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="reveal">
      <SectionHeading id="projects-title" icon={FolderGit2}>{t.projectsTitle}</SectionHeading>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {t.projects.map((project) => (
          <li key={project.title}>
            <ProjectCard project={project} t={t} />
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="tap link gap-2">
          <GithubIcon className="h-5 w-5" /> {t.ui.repos}
        </a>
      </p>
    </section>
  );
}

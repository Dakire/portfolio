import { Server, Code, Mail, MapPin, Download, User, Briefcase, BookOpen, FolderGit2, Shield, Newspaper, Clock } from 'lucide-react';
import { PORTFOLIO_DATA, PROFILE, LANGS } from './data/content';
import { GithubIcon, LinkedinIcon } from './components/Icons';
import Header from './components/Header';
import SectionHeading from './components/SectionHeading';
import ContactForm from './components/ContactForm';

const YEAR = new Date().getFullYear();

const formatDate = (iso, locale) =>
  new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// La langue est portée par l'URL ('/' = fr, '/en/' = en) : le HTML pré-rendu et l'hydratation partent du même état.
export default function App({ lang = 'fr', posts = [] }) {
  const t = PORTFOLIO_DATA[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      <a href="#main" className="skip-link">{t.ui.skip}</a>
      <Header t={t} lang={lang} />

      <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-20 space-y-24 md:space-y-32">
        {/* HERO */}
        <section id="home" aria-labelledby="hero-title" className="scroll-mt-32 flex flex-col items-start justify-center min-h-[50vh] md:min-h-[60vh]">
          <p className="text-emerald-400 font-mono mb-4 text-lg">{t.hero.greeting}</p>
          <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">
            Guillaume <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-cyan-400">Richard.</span>
          </h1>
          <p className="text-xl sm:text-2xl md:text-4xl font-bold text-slate-300 mb-8 max-w-3xl leading-tight">{t.hero.role}</p>

          <div className="flex flex-wrap gap-4 mt-4">
            <a href="#contact" className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30">
              {t.hero.contactBtn}
            </a>
            <a href={t.hero.cvLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-6 py-3 rounded-lg font-medium transition-colors">
              <Download className="w-5 h-5" aria-hidden="true" />
              {t.hero.cvBtn}
              <span className="sr-only"> ({t.ui.cvOpen})</span>
            </a>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" aria-labelledby="about-title" className="scroll-mt-32">
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

        {/* SKILLS */}
        <section id="skills" aria-labelledby="skills-title" className="scroll-mt-32">
          <SectionHeading id="skills-title" icon={Code}>{t.skillsTitle}</SectionHeading>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.skills.map((skill) => (
              <li key={skill.category} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/60 transition-colors shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <h3 className="text-white font-bold text-lg">{skill.category}</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{skill.items}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* EXPERIENCE */}
        <section id="experience" aria-labelledby="experience-title" className="scroll-mt-32">
          <SectionHeading id="experience-title" icon={Briefcase}>{t.experienceTitle}</SectionHeading>
          <ol className="space-y-8 max-w-4xl">
            {t.experiences.map((exp) => (
              <li key={`${exp.company}-${exp.date}`} className="relative pl-8 md:pl-0">
                <div className="absolute left-[11px] md:left-[140px] top-2 -bottom-8 w-px bg-slate-700" aria-hidden="true" />
                <div className="absolute left-[7px] md:left-[136px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[3px] border-slate-950 box-content" aria-hidden="true" />

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

        {/* PROJECTS */}
        <section id="projects" aria-labelledby="projects-title" className="scroll-mt-32">
          <SectionHeading id="projects-title" icon={FolderGit2}>{t.projectsTitle}</SectionHeading>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.projects.map((project) => {
              const card = 'bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-full';
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
                  <ul className="flex flex-wrap gap-2 mt-auto" aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag} className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30">{tag}</li>
                    ))}
                  </ul>
                </>
              );
              return (
                <li key={project.title} className="h-full">
                  {project.href ? (
                    <a href={project.href} target="_blank" rel="noopener noreferrer" className={`${card} hover:border-emerald-500 transition-colors group`}>{body}</a>
                  ) : (
                    <div className={card}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-6">
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 underline underline-offset-2 rounded">
              <GithubIcon className="w-5 h-5" /> {t.ui.repos}
            </a>
          </p>
        </section>

        {/* BLOG */}
        {posts.length > 0 && (
          <section id="blog" aria-labelledby="blog-title" className="scroll-mt-32">
            <SectionHeading id="blog-title" icon={Newspaper}>{t.blog.title}</SectionHeading>
            <p className="text-slate-300 mb-6 max-w-3xl">{t.blog.intro}</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.slice(0, 3).map((p) => (
                <li key={p.slug} className="h-full">
                  <article className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 transition-colors p-6 rounded-2xl shadow-lg h-full flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-2">
                      <a href={`${LANGS[lang].blog}${p.slug}/`} className="hover:text-emerald-300 transition-colors">{p.title}</a>
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">{p.description}</p>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-emerald-300">
                      <time dateTime={p.date}>{formatDate(p.date, t.blog.dateLocale)}</time>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {p.readingTime} {t.blog.min}</span>
                    </p>
                  </article>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <a href={LANGS[lang].blog} className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2 rounded">{t.blog.all}</a>
            </p>
          </section>
        )}

        {/* EDUCATION & CONTACT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section id="education" aria-labelledby="education-title" className="scroll-mt-32">
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

          <section id="contact" aria-labelledby="contact-title" className="scroll-mt-32">
            <h2 id="contact-title" className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
              <Mail className="w-6 h-6 shrink-0 text-emerald-400" aria-hidden="true" /> {t.contactTitle}
            </h2>
            <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl">
              <p className="text-slate-300 mb-6 text-sm">{t.contactDesc}</p>
              <ContactForm t={t} lang={lang} />
            </div>
          </section>
        </div>
      </main>

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
    </div>
  );
}

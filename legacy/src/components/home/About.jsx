import { User } from 'lucide-react';
import { PROFILE } from '../../data/content';
import { GithubIcon, LinkedinIcon } from '../Icons';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionHeading from '../SectionHeading';

export default function About({ t }) {
  return (
    <section id="about" aria-labelledby="about-title" className="reveal">
      <SectionHeading id="about-title" icon={User}>{t.aboutTitle}</SectionHeading>
      <Card className="max-w-4xl p-6 text-base leading-relaxed sm:p-8 sm:text-lg">
        <p>{t.about}</p>
        <ul className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <li>
            <Button href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" variant="secondary" aria-label={`LinkedIn — ${t.ui.linkedin}`}>
              <LinkedinIcon className="h-5 w-5" /> LinkedIn
            </Button>
          </li>
          <li>
            <Button href={PROFILE.github} target="_blank" rel="noopener noreferrer" variant="secondary" aria-label={`GitHub — ${t.ui.github}`}>
              <GithubIcon className="h-5 w-5" /> GitHub
            </Button>
          </li>
        </ul>
      </Card>
    </section>
  );
}

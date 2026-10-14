// Textes des pages de structure (accueil, parcours, ressources, détail d'une réalisation, pied de page), en français et en anglais.
// Les textes du profil (accroche, compétences, expériences, réalisations) sont dans profile.ts.
import type { Lang } from '../lib/i18n';

export interface SiteText {
  footer: {
    profile: string;
    resources: string;
    contact: string;
    info: string;
    cvFr: string;
    cvEn: string;
    form: string;
    tagline: string;
  };
  home: {
    skillsMore: string;
    featuredTitle: string;
    careerTitle: string;
    careerIntro: string;
    careerMore: string;
    resourcesTitle: string;
    resourcesIntro: string;
    contactTitle: string;
    contactText: string;
  };
  career: { title: string; description: string; cvTitle: string; cvText: string };
  resources: {
    title: string;
    description: string;
    intro: string;
    blogText: string;
    toolsText: string;
    cheatsheetsText: string;
    latest: string;
    open: string;
  };
  project: {
    summary: string;
    stack: string;
    context: string;
    role: string;
    steps: string;
    result: string;
    domain: string;
    proofs: string;
    posts: string;
    tools: string;
    cheatsheets: string;
    others: string;
    code: string;
  };
  skills: { projects: string; posts: string; tools: string; cheatsheets: string; proofs: string };
  contactBand: { title: string; text: string };
}

export const SITE_TEXT: Record<Lang, SiteText> = {
  fr: {
    footer: {
      profile: 'Profil',
      resources: 'Ressources',
      contact: 'Contact',
      info: 'Informations',
      cvFr: 'CV en français (PDF)',
      cvEn: 'Resume in English (PDF)',
      form: 'Formulaire de contact',
      tagline: 'Technicien informatique à Laval.',
    },
    home: {
      skillsMore: 'Toutes les compétences',
      featuredTitle: 'Réalisations à la une',
      careerTitle: 'Parcours en bref',
      careerIntro: "Où j'ai travaillé, du plus récent au plus ancien.",
      careerMore: 'Voir tout le parcours',
      resourcesTitle: 'Ressources',
      resourcesIntro:
        "Ce que mon travail m'a donné envie de partager : des notes, des outils et des commandes à garder sous la main.",
      contactTitle: 'Parlons de votre besoin',
      contactText: 'Un message suffit pour démarrer. Vous pouvez aussi télécharger mon CV.',
    },
    career: {
      title: 'Parcours professionnel',
      description:
        'Parcours de Guillaume Richard : technicien informatique chez TIXIA, dépannage à domicile, webmaster, maintenance IT, formation et langues.',
      cvTitle: 'Mon CV',
      cvText: 'Le CV complet, en français et en anglais.',
    },
    resources: {
      title: 'Ressources',
      description:
        'Le blog, les outils en ligne et les cheatsheets de Guillaume Richard : messagerie, DNS, Microsoft 365, Google Workspace, réseau et poste de travail.',
      intro:
        'Mon travail de tous les jours déborde souvent en notes, en petits outils et en listes de commandes. Je les rassemble ici : elles prolongent ce que vous avez vu sur le reste du site.',
      blogText:
        'Des notes techniques sur la messagerie, le DNS, Microsoft 365 et le poste de travail.',
      toolsText:
        'Des outils gratuits pour diagnostiquer le DNS et les e-mails, auditer un site, découper un calendrier ou calculer un réseau.',
      cheatsheetsText:
        'Des aide-mémoire de commandes (GAM, PowerShell, Windows, Git…) avec une recherche instantanée.',
      latest: 'Derniers articles',
      open: 'Ouvrir',
    },
    project: {
      summary: 'En bref',
      stack: 'Stack',
      context: 'Contexte',
      role: 'Mon rôle',
      steps: 'Déroulé',
      result: 'Résultat',
      domain: 'Domaine',
      proofs: 'Pour aller plus loin',
      posts: 'Articles',
      tools: 'Outils',
      cheatsheets: 'Cheatsheets',
      others: 'Autres réalisations',
      code: 'Voir le code sur GitHub',
    },
    skills: {
      projects: 'Réalisations',
      posts: 'Articles',
      tools: 'Outils',
      cheatsheets: 'Cheatsheets',
      proofs: 'Pour le voir en pratique',
    },
    contactBand: {
      title: 'Un projet, une question ?',
      text: 'Écrivez-moi : je lis chaque message et je réponds personnellement.',
    },
  },
  en: {
    footer: {
      profile: 'Profile',
      resources: 'Resources',
      contact: 'Contact',
      info: 'Information',
      cvFr: 'CV en français (PDF)',
      cvEn: 'Resume in English (PDF)',
      form: 'Contact form',
      tagline: 'IT technician based in Laval, France.',
    },
    home: {
      skillsMore: 'All skills',
      featuredTitle: 'Featured projects',
      careerTitle: 'Career at a glance',
      careerIntro: 'Where I have worked, most recent first.',
      careerMore: 'See the full career',
      resourcesTitle: 'Resources',
      resourcesIntro:
        'What my work made me want to share: notes, tools and commands worth keeping at hand.',
      contactTitle: "Let's talk about what you need",
      contactText: 'One message is enough to get started. You can also download my resume.',
    },
    career: {
      title: 'Career',
      description:
        'Career of Guillaume Richard: IT technician at TIXIA, home IT support, webmaster, IT maintenance, education and languages.',
      cvTitle: 'My resume',
      cvText: 'The full resume, in English and in French.',
    },
    resources: {
      title: 'Resources',
      description:
        'The blog and online tools by Guillaume Richard: email, DNS, Microsoft 365, Google Workspace, networking and the workstation.',
      intro:
        'My day-to-day work often spills over into notes, small tools and command lists. I gather them here: they extend what you have seen on the rest of the site.',
      blogText: 'Technical notes on email, DNS, Microsoft 365 and the workstation.',
      toolsText:
        'Free tools to diagnose DNS and email, audit a website, split a calendar or work out a network.',
      cheatsheetsText: 'Command cheatsheets (GAM, PowerShell, Windows, Git…) with instant search.',
      latest: 'Latest articles',
      open: 'Open',
    },
    project: {
      summary: 'In brief',
      stack: 'Stack',
      context: 'Context',
      role: 'My role',
      steps: 'How it went',
      result: 'Result',
      domain: 'Area',
      proofs: 'Going further',
      posts: 'Articles',
      tools: 'Tools',
      cheatsheets: 'Cheatsheets',
      others: 'More projects',
      code: 'View the code on GitHub',
    },
    skills: {
      projects: 'Projects',
      posts: 'Articles',
      tools: 'Tools',
      cheatsheets: 'Cheatsheets',
      proofs: 'See it in practice',
    },
    contactBand: {
      title: 'A project, a question?',
      text: 'Write to me: I read every message and answer personally.',
    },
  },
};

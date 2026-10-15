// Textes des pages de structure (accueil, parcours, ressources, détail d'une réalisation, pied de page), en français et en anglais.
// Les textes du profil (accroche, compétences, expériences, réalisations) sont dans profile.ts.
import type { Lang } from '../lib/i18n';

export interface ResourceExample {
  /** La situation, formulée comme le visiteur la vivrait. */
  situation: string;
  /** Ce que la ressource apporte. */
  text: string;
  /** Commande ou saisie d'exemple (adresses fictives : toto@domain.com, domain.com). */
  code?: string;
  kind: 'tool' | 'ref' | 'post';
  /** Identifiant de l'outil, de la cheatsheet (en français) ou slug français de l'article. */
  id: string;
  linkLabel: string;
}

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
    /** Sommaire du site sous le hero : ce qu'on trouve ici, avec le nombre réel d'éléments. */
    indexLabel: string;
    index: { projects: string; tools: string; cheatsheets: string; posts: string };
    toolsTitle: string;
    toolsIntro: string;
    /** « Les 12 outils » : {n} est remplacé par le nombre d'outils. */
    toolsMore: string;
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
    examplesTitle: string;
    examplesIntro: string;
    examples: ResourceExample[];
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
    kind: string;
    kinds: { perso: string; pro: string };
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
      indexLabel: 'Sur ce site',
      index: {
        projects: 'Une page par projet, avec sa stack',
        tools: 'DNS, e-mail, réseau, SEO : gratuits, sans inscription',
        cheatsheets: 'Commandes à copier, recherche instantanée',
        posts: 'Méthodes de diagnostic pas à pas',
      },
      toolsTitle: 'Outils en ligne',
      toolsIntro:
        'Écrits pour des problèmes que je croise en support : vérifier une zone DNS, lire les en-têtes d’un e-mail, auditer un site.',
      toolsMore: 'Les {n} outils',
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
      examplesTitle: 'Un problème, la bonne ressource',
      examplesIntro:
        'Quelques situations courantes, avec ce qu’il faut saisir. Les adresses sont fictives (toto@domain.com, domain.com) : remplacez-les par les vôtres.',
      examples: [
        {
          situation: 'Un mail de toto@domain.com arrive en spam',
          text: 'Collez ses en-têtes : l’outil montre le chemin suivi par le message, puis les résultats SPF, DKIM et DMARC.',
          kind: 'tool',
          id: 'email-headers',
          linkLabel: 'Analyser des en-têtes',
        },
        {
          situation: 'Le DNS de domain.com vient de changer',
          text: 'Interrogez plusieurs résolveurs publics et comparez leurs réponses pour savoir où en est la propagation.',
          code: 'domain.com',
          kind: 'tool',
          id: 'propagation',
          linkLabel: 'Vérifier la propagation',
        },
        {
          situation: 'Afficher un utilisateur Google Workspace',
          text: 'La commande GAM à copier, avec un lien vers le wiki d’origine.',
          code: 'gam info user toto@domain.com',
          kind: 'ref',
          id: 'gam',
          linkLabel: 'Ouvrir la cheatsheet GAM',
        },
        {
          situation: 'Voir la boîte aux lettres Microsoft 365 de toto@domain.com',
          text: 'Les commandes PowerShell Exchange Online, avec leurs pièges courants.',
          code: 'Get-Mailbox -Identity toto@domain.com | Format-List',
          kind: 'ref',
          id: 'powershell-m365',
          linkLabel: 'Ouvrir la cheatsheet PowerShell',
        },
        {
          situation: 'Entrer dans le BIOS d’un PC Dell',
          text: 'F2 pour le BIOS/UEFI, F12 pour le menu de démarrage. Les autres marques sont dans la cheatsheet.',
          kind: 'ref',
          id: 'bios-uefi',
          linkLabel: 'Voir les touches par marque',
        },
        {
          situation: 'Découper le réseau 192.168.10.0/24',
          text: 'Adresse du réseau, broadcast, plage d’hôtes et sous-réseaux, en IPv4 comme en IPv6.',
          code: '192.168.10.0/24',
          kind: 'tool',
          id: 'subnet',
          linkLabel: 'Calculer un réseau',
        },
        {
          situation: 'Comprendre SPF, DKIM et DMARC',
          text: 'Un article pour savoir à quoi sert chaque enregistrement et comment les vérifier.',
          kind: 'post',
          id: 'spf-dkim-dmarc-expliques',
          linkLabel: 'Lire l’article',
        },
      ],
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
      kind: 'Type',
      kinds: { perso: 'Projet personnel', pro: 'Réalisation professionnelle' },
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
      indexLabel: 'On this site',
      index: {
        projects: 'One page per project, with its stack',
        tools: 'DNS, email, networking, SEO: free, no sign-up',
        cheatsheets: 'Commands to copy, instant search',
        posts: 'Step-by-step troubleshooting methods',
      },
      toolsTitle: 'Online tools',
      toolsIntro:
        'Written for problems I run into in support: checking a DNS zone, reading email headers, auditing a site.',
      toolsMore: 'All {n} tools',
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
      examplesTitle: 'A problem, the right resource',
      examplesIntro:
        'A few common situations, with what to type. The addresses are made up (toto@domain.com, domain.com): swap in your own.',
      examples: [
        {
          situation: 'A mail from toto@domain.com lands in spam',
          text: 'Paste its headers: the tool shows the path the message took, then the SPF, DKIM and DMARC results.',
          kind: 'tool',
          id: 'email-headers',
          linkLabel: 'Analyze headers',
        },
        {
          situation: 'The DNS of domain.com has just changed',
          text: 'Query several public resolvers and compare their answers to see how far propagation has gone.',
          code: 'domain.com',
          kind: 'tool',
          id: 'propagation',
          linkLabel: 'Check propagation',
        },
        {
          situation: 'Get into the BIOS of a Dell PC',
          text: 'F2 for the BIOS/UEFI, F12 for the boot menu. Other brands are in the cheatsheet.',
          kind: 'ref',
          id: 'bios-uefi',
          linkLabel: 'See the keys by brand',
        },
        {
          situation: 'Split the 192.168.10.0/24 network',
          text: 'Network address, broadcast, host range and subnets, in IPv4 or IPv6.',
          code: '192.168.10.0/24',
          kind: 'tool',
          id: 'subnet',
          linkLabel: 'Calculate a network',
        },
        {
          situation: 'Understand SPF, DKIM and DMARC',
          text: 'An article on what each record is for and how to check them.',
          kind: 'post',
          id: 'spf-dkim-dmarc-expliques',
          linkLabel: 'Read the article',
        },
      ],
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
      kind: 'Type',
      kinds: { perso: 'Personal project', pro: 'Professional work' },
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

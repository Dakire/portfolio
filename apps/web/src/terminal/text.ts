// Textes du terminal (page /terminal/) (FR/EN). Les paramètres s'insèrent dans {accolades}.
import type { Lang } from '../lib/i18n';
import type { Command } from './commands';

type Section = 'home' | 'skills' | 'projects' | 'tools' | 'blog' | 'contact';

export interface TerminalStrings {
  label: string;
  title: string;
  inputLabel: string;
  placeholder: string;
  hint: string;
  suggestions: string[];
  log: string;
  disable: string;
  enable: string;
  close: string;
  minimize: string;
  maximize: string;
  disabled: string;
  shortcuts: string;
  notFound: string;
  helpTitle: string;
  helpKeys: string;
  help: Record<Command, string>;
  files: string;
  lsMissing: string;
  catUsage: string;
  catMissing: string;
  gotoUsage: string;
  gotoMissing: string;
  gotoDone: string;
  themeNow: string;
  themeSet: string;
  themeUsage: string;
  langUsage: string;
  langSame: string;
  langSwitching: string;
  cvOpening: string;
  cvName: string;
  noPosts: string;
  openBlog: string;
  contactForm: string;
  allTools: string;
  toolsHint: string;
  openUsage: string;
  openMissing: string;
  opening: string;
  cursorUsage: string;
  cursorOn: string;
  cursorOff: string;
  sudo: string;
  rm: string;
  exit: string;
  coffee: string;
  teapot: string;
  ping: string;
  vim: string;
  answer: string;
  didYouMean: string;
  notDir: string;
  cdMissing: string;
  projectUsage: string;
  projectMissing: string;
  blogMissing: string;
  noEducation: string;
  historyEmpty: string;
  resetDone: string;
  manUsage: string;
  manMissing: string;
  manUsageLabel: string;
  tagline: string;
  matrix: string;
  konami: string;
  interrupted: string;
  fortunes: string[];
  sections: Record<Section, string>;
  themes: Record<'dark' | 'light' | 'auto', string>;
  languages: Record<Lang, string>;
  neofetch: Record<'user' | 'role' | 'location' | 'stack' | 'host' | 'shell' | 'theme', string>;
}

export const TERMINAL: Record<Lang, TerminalStrings> = {
  fr: {
    label: 'Terminal interactif',
    title: 'guillaume@grichard.eu: ~',
    inputLabel: 'Commande du terminal',
    placeholder: 'tapez help',
    hint: 'Tapez une commande (help pour la liste), ↑ ↓ pour l’historique, Tab pour compléter. Ctrl+L efface, Ctrl+C interrompt, Ctrl+K cherche.',
    suggestions: ['help', 'skills', 'projects', 'tools', 'contact'],
    log: 'Résultats des commandes',
    close: 'Fermer le terminal',
    minimize: 'Réduire le terminal',
    maximize: 'Agrandir le terminal (Échap pour revenir)',
    disable: 'Désactiver le terminal',
    enable: 'Activer le terminal',
    disabled: 'Terminal désactivé. Les mêmes informations sont dans les sections de la page.',
    shortcuts: 'Raccourcis',
    notFound: 'commande introuvable : {cmd} (tapez help)',
    helpTitle: 'Commandes disponibles :',
    helpKeys: '↑ ↓ historique · Tab complétion · Ctrl+L effacer',
    help: {
      help: 'liste des commandes',
      about: 'présentation',
      whoami: 'qui je suis',
      skills: "domaines d'expertise",
      experience: 'parcours professionnel',
      projects: 'projets techniques',
      tools: 'outils en ligne',
      open: 'open <outil> : ouvrir un outil',
      blog: 'derniers articles du blog',
      contact: 'me contacter',
      cv: 'ouvrir le CV (PDF)',
      links: 'GitHub, LinkedIn, CV, outils',
      ls: 'lister les fichiers',
      cat: 'cat <fichier> : afficher un fichier',
      goto: 'goto <section> : aller à une section',
      theme: 'theme [dark|light|auto] : changer de thème',
      lang: 'lang [fr|en] : changer de langue',
      neofetch: 'informations système',
      cursor: 'cursor [on|off] : curseur du site (souris)',
      clear: "effacer l'écran",
      reset: 'effacer l’écran, l’historique et revenir à la racine',
      history: 'historique des commandes de la session',
      date: 'date et heure',
      pwd: 'dossier courant',
      cd: 'cd <dossier> : changer de dossier (about, skills, projects, experience, blog, contact)',
      education: 'formation',
      project: 'project <nom> : détail d’un projet',
      github: 'mon GitHub',
      website: 'ce site',
      banner: 'afficher la bannière',
      man: 'man <commande> : aide d’une commande',
      fortune: 'une phrase au hasard',
    },
    files:
      'about/  skills/  projects/  experience/  blog/  contact/  about.txt  stack.txt  contact.txt',
    lsMissing: 'ls : {file} : dossier introuvable',
    catUsage: 'usage : cat <fichier> (about.txt, stack.txt, contact.txt)',
    catMissing: 'cat : {file} : fichier introuvable',
    gotoUsage: 'usage : goto <section> (sections : {sections})',
    gotoMissing: 'goto : section inconnue : {section}',
    gotoDone: 'direction : {section}',
    themeNow: 'thème actuel : {theme} (theme dark | light | auto pour le changer)',
    themeSet: 'thème : {theme}',
    themeUsage: 'usage : theme [dark|light|auto]',
    langUsage: 'usage : lang [fr|en]',
    langSame: 'vous lisez déjà ce site en français',
    langSwitching: 'passage en {lang}…',
    cvOpening: 'ouverture du CV : ',
    cvName: 'CV (PDF)',
    noPosts: 'aucun article pour le moment',
    openBlog: 'tous les articles',
    contactForm: 'formulaire de contact',
    allTools: 'tous les outils',
    toolsHint: 'open <outil> pour en ouvrir un, par exemple : open dns',
    openUsage: 'usage : open <outil> (tools pour la liste)',
    openMissing: 'open : outil inconnu : {tool} (tapez tools)',
    opening: 'ouverture : {name}…',
    cursorUsage: 'usage : cursor [on|off] (souris uniquement)',
    cursorOn: 'curseur du site activé',
    cursorOff: 'curseur du site désactivé',
    sudo: 'Bien essayé. Cet incident sera signalé à l’administrateur (moi).',
    rm: 'Permission refusée : je tiens à mon portfolio.',
    exit: "Il n'y a nulle part où fuir : ce n'est qu'un navigateur.",
    coffee: 'Café en préparation… Erreur 418 : je suis une théière.',
    teapot: '418 I’m a teapot. Défini par la RFC 2324, publiée le 1er avril 1998.',
    ping: '64 octets depuis grichard.eu : temps < 1 ms (ça tourne dans votre navigateur, c’est de la triche).',
    vim: 'Ce n’est pas vim, mais vous avez quand même cherché à en sortir. Essayez :q',
    answer: 'La réponse à la grande question. Reste à retrouver la question.',
    didYouMean: 'Vouliez-vous dire : {cmd} ?',
    notDir: '{file} : n’est pas un dossier',
    cdMissing: 'cd : {dir} : dossier introuvable',
    projectUsage: 'usage : project <nom> (projects pour la liste)',
    projectMissing: 'project : projet inconnu : {name}',
    blogMissing: 'blog : article inconnu : {slug}',
    noEducation: 'aucune formation renseignée',
    historyEmpty: 'historique vide',
    resetDone: 'session réinitialisée',
    manUsage: 'usage : man <commande>',
    manMissing: 'man : aucune entrée de manuel pour {cmd}',
    manUsageLabel: 'USAGE',
    tagline: 'technicien informatique · réseaux, systèmes, automatisation',
    matrix: 'Réveillez-vous, Neo… (Échap ou Ctrl+C pour interrompre)',
    konami:
      '↑ ↑ ↓ ↓ ← → ← → B A : +30 vies. Ce n’est pas ce genre de site, mais merci d’avoir essayé.',
    interrupted: '^C',
    fortunes: [
      'Ce n’est pas un bug, c’est une fonctionnalité non documentée.',
      'Il y a deux problèmes difficiles en informatique : l’invalidation du cache, nommer les choses et les erreurs d’un décalage.',
      'Avez-vous essayé de l’éteindre puis de le rallumer ?',
      'Les sauvegardes, on n’y pense que le jour où l’on en a besoin.',
      'Un script qui marche une fois est un brouillon ; un script documenté est un outil.',
      'C’est toujours le DNS.',
    ],
    sections: {
      home: 'accueil',
      skills: 'compétences',
      projects: 'projets',
      tools: 'outils',
      blog: 'blog',
      contact: 'contact',
    },
    themes: { dark: 'sombre', light: 'clair', auto: 'automatique' },
    languages: { fr: 'français', en: 'anglais' },
    neofetch: {
      user: 'Utilisateur',
      role: 'Rôle',
      location: 'Lieu',
      stack: 'Stack',
      host: 'Hôte',
      shell: 'Shell',
      theme: 'Thème',
    },
  },
  en: {
    label: 'Interactive terminal',
    title: 'guillaume@grichard.eu: ~',
    inputLabel: 'Terminal command',
    placeholder: 'type help',
    hint: 'Type a command (help for the list), ↑ ↓ for history, Tab to complete. Ctrl+L clears, Ctrl+C interrupts, Ctrl+K searches.',
    suggestions: ['help', 'skills', 'projects', 'tools', 'contact'],
    log: 'Command output',
    close: 'Close the terminal',
    minimize: 'Minimize the terminal',
    maximize: 'Enlarge the terminal (Esc to go back)',
    disable: 'Turn off the terminal',
    enable: 'Turn on the terminal',
    disabled: 'Terminal turned off. The same information is in the sections of this page.',
    shortcuts: 'Shortcuts',
    notFound: 'command not found: {cmd} (type help)',
    helpTitle: 'Available commands:',
    helpKeys: '↑ ↓ history · Tab completion · Ctrl+L clear',
    help: {
      help: 'list the commands',
      about: 'introduction',
      whoami: 'who I am',
      skills: 'areas of expertise',
      experience: 'work history',
      projects: 'technical projects',
      tools: 'online tools',
      open: 'open <tool>: open a tool',
      blog: 'latest blog articles',
      contact: 'get in touch',
      cv: 'open the resume (PDF)',
      links: 'GitHub, LinkedIn, resume, tools',
      ls: 'list files',
      cat: 'cat <file>: show a file',
      goto: 'goto <section>: jump to a section',
      theme: 'theme [dark|light|auto]: change theme',
      lang: 'lang [fr|en]: change language',
      neofetch: 'system information',
      cursor: 'cursor [on|off]: site cursor (mouse)',
      clear: 'clear the screen',
      reset: 'clear the screen and history, back to the root',
      history: 'command history of this session',
      date: 'date and time',
      pwd: 'current directory',
      cd: 'cd <directory>: change directory (about, skills, projects, experience, blog, contact)',
      education: 'education',
      project: 'project <name>: project details',
      github: 'my GitHub',
      website: 'this site',
      banner: 'show the banner',
      man: 'man <command>: help for a command',
      fortune: 'a random quote',
    },
    files:
      'about/  skills/  projects/  experience/  blog/  contact/  about.txt  stack.txt  contact.txt',
    lsMissing: 'ls: {file}: no such directory',
    catUsage: 'usage: cat <file> (about.txt, stack.txt, contact.txt)',
    catMissing: 'cat: {file}: no such file',
    gotoUsage: 'usage: goto <section> (sections: {sections})',
    gotoMissing: 'goto: unknown section: {section}',
    gotoDone: 'heading to: {section}',
    themeNow: 'current theme: {theme} (theme dark | light | auto to change it)',
    themeSet: 'theme: {theme}',
    themeUsage: 'usage: theme [dark|light|auto]',
    langUsage: 'usage: lang [fr|en]',
    langSame: 'you are already reading this site in English',
    langSwitching: 'switching to {lang}…',
    cvOpening: 'opening the resume: ',
    cvName: 'Resume (PDF)',
    noPosts: 'no articles yet',
    openBlog: 'all articles',
    contactForm: 'contact form',
    allTools: 'all tools',
    toolsHint: 'open <tool> to open one, for example: open dns',
    openUsage: 'usage: open <tool> (type tools for the list)',
    openMissing: 'open: unknown tool: {tool} (type tools)',
    opening: 'opening: {name}…',
    cursorUsage: 'usage: cursor [on|off] (mouse only)',
    cursorOn: 'site cursor on',
    cursorOff: 'site cursor off',
    sudo: 'Nice try. This incident will be reported to the administrator (me).',
    rm: 'Permission denied: I am attached to my portfolio.',
    exit: 'There is nowhere to run: it is just a browser.',
    coffee: 'Brewing coffee… Error 418: I am a teapot.',
    teapot: '418 I’m a teapot. Defined by RFC 2324, published on 1 April 1998.',
    ping: '64 bytes from grichard.eu: time < 1 ms (it runs in your browser, so that is cheating).',
    vim: 'This is not vim, but you still tried to get out of it. Try :q',
    answer: 'The answer to the big question. Now to find the question.',
    didYouMean: 'Did you mean: {cmd}?',
    notDir: '{file}: not a directory',
    cdMissing: 'cd: {dir}: no such directory',
    projectUsage: 'usage: project <name> (projects for the list)',
    projectMissing: 'project: unknown project: {name}',
    blogMissing: 'blog: unknown article: {slug}',
    noEducation: 'no education listed',
    historyEmpty: 'history is empty',
    resetDone: 'session reset',
    manUsage: 'usage: man <command>',
    manMissing: 'man: no manual entry for {cmd}',
    manUsageLabel: 'USAGE',
    tagline: 'IT technician · networks, systems, automation',
    matrix: 'Wake up, Neo… (Esc or Ctrl+C to interrupt)',
    konami: '↑ ↑ ↓ ↓ ← → ← → B A: +30 lives. This is not that kind of site, but thanks for trying.',
    interrupted: '^C',
    fortunes: [
      'It is not a bug, it is an undocumented feature.',
      'There are two hard problems in computing: cache invalidation, naming things, and off-by-one errors.',
      'Have you tried turning it off and on again?',
      'Backups are only thought of on the day you need one.',
      'A script that works once is a draft; a documented script is a tool.',
      'It is always DNS.',
    ],
    sections: {
      home: 'home',
      skills: 'skills',
      projects: 'projects',
      tools: 'tools',
      blog: 'blog',
      contact: 'contact',
    },
    themes: { dark: 'dark', light: 'light', auto: 'automatic' },
    languages: { fr: 'French', en: 'English' },
    neofetch: {
      user: 'User',
      role: 'Role',
      location: 'Location',
      stack: 'Stack',
      host: 'Host',
      shell: 'Shell',
      theme: 'Theme',
    },
  },
};

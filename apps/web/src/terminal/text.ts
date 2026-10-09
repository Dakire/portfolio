// Textes du terminal de l'accueil (FR/EN). Les paramètres s'insèrent dans {accolades}.
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
    hint: 'Tapez une commande (help pour la liste), ↑ ↓ pour l’historique, Tab pour compléter.',
    suggestions: ['help', 'skills', 'projects', 'tools', 'contact'],
    log: 'Résultats des commandes',
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
      cursor: 'cursor [on|off] : curseur animé (souris)',
      clear: "effacer l'écran",
    },
    files: 'about.txt  stack.txt  contact.txt  blog/',
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
    cursorUsage:
      'usage : cursor [on|off] (souris uniquement, jamais si les animations sont réduites)',
    cursorOn: 'curseur animé activé',
    cursorOff: 'curseur animé désactivé',
    sudo: 'Bien essayé. Cet incident sera signalé à l’administrateur (moi).',
    rm: 'Permission refusée : je tiens à mon portfolio.',
    exit: "Il n'y a nulle part où fuir : ce n'est qu'un navigateur.",
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
    hint: 'Type a command (help for the list), ↑ ↓ for history, Tab to complete.',
    suggestions: ['help', 'skills', 'projects', 'tools', 'contact'],
    log: 'Command output',
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
      cursor: 'cursor [on|off]: animated cursor (mouse)',
      clear: 'clear the screen',
    },
    files: 'about.txt  stack.txt  contact.txt  blog/',
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
    cursorUsage: 'usage: cursor [on|off] (mouse only, never with reduced motion)',
    cursorOn: 'animated cursor on',
    cursorOff: 'animated cursor off',
    sudo: 'Nice try. This incident will be reported to the administrator (me).',
    rm: 'Permission denied: I am attached to my portfolio.',
    exit: 'There is nowhere to run: it is just a browser.',
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

// Contenu du profil (accroche, à propos, compétences, parcours, réalisations), en français et en anglais.
// Une seule source pour l'accueil, À propos, Parcours, Compétences, Réalisations et le terminal : toute modification de texte se fait ici.
// Les faits (dates, structures, technologies) viennent du CV ; seul le ton est travaillé. Les textes de contact et légaux sont dans content.ts.
import type { Lang } from '../lib/i18n';

export type SkillId = 'network' | 'security' | 'messaging' | 'training' | 'dev' | 'support';

export interface Skill {
  id: SkillId;
  category: string;
  /** Description complète (page Compétences). */
  items: string;
  /** Une ligne pour l'accueil. */
  short: string;
}
export interface Experience {
  role: string;
  company: string;
  location: string;
  date: string;
  /** Début et fin au format ISO (AAAA-MM), pour les données structurées ; pas de fin = poste en cours. */
  start: string;
  end?: string;
  /** Type de contrat (CDI, CDD), si connu. */
  contract?: string;
  /** Ce que recouvre le poste, un point par ligne. */
  points: string[];
  /** Compétences mises en œuvre (étiquettes). */
  skills?: string[];
}
export interface Education {
  title: string;
  school: string;
  date: string;
  /** Année d'obtention (jalon de la frise du parcours). */
  endYear: number;
  skills?: string[];
  /** Détails (un point par ligne). */
  points?: string[];
  /** Réalisations liées (slugs), affichées comme liens. */
  projects?: string[];
}
export interface Project {
  /** Segment d'URL, identique en français et en anglais (/projets/<slug>/ et /en/projects/<slug>/). */
  slug: string;
  skill: SkillId;
  title: string;
  desc: string;
  tags: string[];
  href?: string;
  /** Affiché sur l'accueil. */
  featured?: boolean;
  /** Nature du projet, affichée seulement si elle est renseignée (à compléter par Guillaume, ne rien deviner). */
  kind?: 'perso' | 'pro';
  /** Blocs facultatifs de la page de détail : tant qu'ils sont absents, rien n'est affiché. À remplir par Guillaume. */
  context?: string;
  role?: string;
  steps?: string[];
  result?: string;
}

export interface ProfileText {
  hero: {
    greeting: string;
    role: string;
    /** Phrase d'accroche sous le titre. */
    pitch: string;
    cvBtn: string;
    contactBtn: string;
    projectsBtn: string;
    cvLink: string;
    /** Liens vers les deux CV. */
    cvLinks: { href: string; label: string; lang: Lang }[];
    terminal: { cmd: string; out: string }[];
  };
  aboutTitle: string;
  about: string;
  aboutMore: string[];
  skillsTitle: string;
  skillsIntro: string;
  skills: Skill[];
  experienceTitle: string;
  experienceIntro: string;
  experiences: Experience[];
  projectsTitle: string;
  projectsIntro: string;
  projectsAll: string;
  projects: Project[];
  educationTitle: string;
  education: Education[];
  languagesInfo: string;
}

export const PROFILE_TEXT: Record<Lang, ProfileText> = {
  fr: {
    hero: {
      greeting: 'Bonjour, je suis',
      role: 'Technicien Informatique & Systèmes Numériques',
      pitch:
        "Je m'occupe des réseaux, des postes de travail et de la messagerie (Microsoft 365, Google Workspace) : je les installe, je les dépanne et j'accompagne les personnes qui s'en servent. Je forme aussi à l'IA, à Microsoft 365 et au RGPD.",
      cvBtn: 'Télécharger mon CV',
      contactBtn: 'Me contacter',
      projectsBtn: 'Voir mes réalisations',
      cvLink: '/CV_Guillaume_Richard_FR.pdf',
      cvLinks: [
        { href: '/CV_Guillaume_Richard_FR.pdf', label: 'CV en français (PDF)', lang: 'fr' },
        { href: '/Resume_Guillaume_Richard_EN.pdf', label: 'Resume in English (PDF)', lang: 'en' },
      ],
      terminal: [
        { cmd: 'whoami', out: 'guillaume · technicien informatique & systèmes numériques' },
        { cmd: 'cat stack.txt', out: 'Microsoft 365 · Google Workspace · DNS · Windows Server' },
        { cmd: 'ls ~/blog', out: 'spf-dkim-dmarc  delivrabilite  dns  migration  windows-11' },
      ],
    },
    aboutTitle: 'À propos de moi',
    about:
      "Je suis technicien informatique, et j'ai toujours testé les choses pour comprendre comment elles marchent. Au quotidien, je travaille sur les systèmes et les réseaux, la messagerie dans le cloud (Microsoft 365 et Google Workspace), le DNS et le support, de la demande de l'utilisateur jusqu'à sa résolution. Quand une tâche revient, j'écris l'outil qui la fait à ma place.",
    aboutMore: [
      'Ce site rassemble mon parcours, mes réalisations et mes compétences. Il montre aussi ce qui en est sorti : un blog de notes techniques, des outils en ligne et des cheatsheets de commandes.',
    ],
    skillsTitle: "Domaines d'expertise",
    skillsIntro:
      'Six domaines, du réseau à la formation. Chacun renvoie vers ce qui le prouve : réalisations, articles, outils et cheatsheets.',
    skills: [
      {
        id: 'network',
        category: 'Réseau & Systèmes',
        items:
          'Windows Server (Active Directory, serveur de fichiers, DNS, DHCP, bureau à distance, MDT et WDS pour la masterisation de PC) et Linux. Réseaux LAN/WLAN, VPN, FTP/SFTP. Un homelab me sert à tester configurations et services avant de les déployer.',
        short: 'Windows Server, Linux, réseaux LAN/WLAN, VPN',
      },
      {
        id: 'security',
        category: 'Sécurité IT',
        items:
          'Pare-feu Stormshield SNS, VPN, sécurité des identités sur Microsoft 365 et Google Workspace, authentification des e-mails (SPF, DKIM, DMARC).',
        short: 'Stormshield SNS, VPN, identités, SPF, DKIM, DMARC',
      },
      {
        id: 'messaging',
        category: 'Messagerie & Cloud',
        items:
          'Mise en place et administration de Microsoft 365 et de Google Workspace (avec GAM, en ligne de commande) au quotidien : migrations depuis IMAP (OVH, Gandi, IONOS, Orange…), Gmail et Outlook, analyse SMTP, délivrabilité, zones DNS (MX, SPF, DKIM, DMARC) et maintien en conditions opérationnelles (MCO).',
        short: 'Microsoft 365, Google Workspace, DNS, délivrabilité',
      },
      {
        id: 'training',
        category: 'Formation IA, Google Workspace, M365 & RGPD',
        items:
          "Je forme et j'accompagne les utilisateurs à l'intelligence artificielle, à Google Workspace, à Microsoft 365 et aux bonnes pratiques du RGPD. Cet accompagnement prolonge le support au quotidien : prise en main des outils et réponses aux questions des utilisateurs.",
        short: 'IA, Google Workspace, Microsoft 365, RGPD : former et accompagner',
      },
      {
        id: 'dev',
        category: 'Développement & Automatisation',
        items:
          'Création et gestion de sites (WordPress, Wix, Shopify, Weebly, PrestaShop, React). Scripts et outils en C#, Java, Python, PowerShell, Bash, SQL et PHP. Projets de licence en Java, SDL2 et Angular, et un plugin Minecraft en Java : les dépôts sont sur GitHub.',
        short: 'C#, Python, PowerShell, PHP, sites web',
      },
      {
        id: 'support',
        category: 'Support & Projets IT',
        items:
          'Support utilisateur de bout en bout (N1 à N3) : gestion des appels et des tickets HelpDesk, escalade auprès des éditeurs (N4), déploiement de logiciels métiers et accompagnement technique.',
        short: 'Support N1 à N3, escalade éditeurs, logiciels métiers',
      },
    ],
    experienceTitle: 'Parcours professionnel',
    experienceIntro:
      'Mes postes, du plus récent au plus ancien, suivis de ma formation. Les missions citées sont des exemples, pas une liste exhaustive. Le CV complet est disponible en PDF, en français et en anglais.',
    experiences: [
      {
        role: 'Technicien informatique et systèmes numériques',
        company: 'TIXIA Services numériques',
        location: 'France',
        contract: 'CDI',
        date: 'Depuis septembre 2023',
        start: '2023-09',
        points: [
          'Mise en place et administration de Google Workspace, avec GAM (administration en ligne de commande).',
          'Mise en place et administration de Microsoft 365 : identités, sécurité, maintien en conditions opérationnelles.',
          'Migrations de messagerie vers Google Workspace et Microsoft 365 : IMAP (OVH, Gandi, IONOS, Orange, etc.), Gmail et Outlook, avec reprise des zones DNS.',
          'Gestion des zones DNS, analyse des en-têtes SMTP et de la délivrabilité (SPF, DKIM, DMARC).',
          'Gestion des appels et des tickets : support HelpDesk de N1 à N3, escalade N4 auprès des éditeurs.',
          'Administration et configuration de Windows Server : Active Directory, serveur de fichiers, DHCP, DNS, bureau à distance.',
          'Mise en place de MDT et WDS pour la masterisation de PC.',
          'Création et mise à jour de sites web avec des CMS (Weebly, Wix, Shopify).',
        ],
        skills: [
          'Google Workspace',
          'Microsoft 365',
          'GAM',
          'Windows Server',
          'MDT et WDS',
          'Support HelpDesk',
        ],
      },
      {
        role: 'Intervenant dépannage informatique',
        company: 'AlloVoisin / Particuliers',
        location: 'France',
        date: 'Depuis 2021',
        start: '2021',
        points: [
          'Assistance informatique de proximité et diagnostic, matériel et logiciel.',
          'Réparation de PC, conseil technologique et optimisation de systèmes.',
        ],
      },
      {
        role: 'Webmaster',
        company: 'Les papiers de Lucas',
        location: 'Changé, France',
        contract: 'CDD',
        date: 'Avril 2022 - juin 2022',
        start: '2022-04',
        end: '2022-06',
        points: [
          'Maintenance et administration du site e-commerce sous PrestaShop.',
          'Audits SEO détaillés, gestion DNS et corrections UX/UI.',
        ],
        skills: ['PrestaShop', 'SEO', 'DNS'],
      },
      {
        role: 'Technicien de maintenance IT',
        company: 'Tibco (groupe Lactalis)',
        location: 'France',
        contract: 'CDD',
        date: 'Mars 2019 (1 mois)',
        start: '2019-03',
        end: '2019-03',
        points: [
          'Préparation et masterisation de nouveaux ordinateurs pour Lactalis.',
          "Réparation d'ordinateurs dans différentes usines : diagnostic de pannes matérielles et télé-assistance.",
          'Helpdesk et logistique.',
        ],
        skills: ['Maintenance informatique'],
      },
    ],
    projectsTitle: 'Réalisations',
    projectsIntro:
      "De l'infrastructure à l'automatisation : chaque réalisation a sa page, avec sa stack et les articles, outils et cheatsheets qui s'y rattachent.",
    projectsAll: 'Toutes les réalisations',
    projects: [
      {
        slug: 'homelab-proxmox',
        skill: 'network',
        kind: 'perso',
        featured: true,
        title: 'Homelab Proxmox, OPNsense et WireGuard',
        desc: 'Un laboratoire personnel sous Proxmox pour tester configurations et services avant de les déployer : pare-feu OPNsense, VPN WireGuard, réseau segmenté et machines virtuelles de test.',
        tags: ['Proxmox', 'OPNsense', 'WireGuard', 'Virtualisation'],
      },
      {
        slug: 'deploiement-windows-server',
        skill: 'network',
        featured: true,
        title: 'Déploiement Windows Server (MDT, WDS)',
        desc: 'Des serveurs Windows configurés pour déployer des postes en série : images maîtres avec MDT, démarrage par le réseau avec WDS, annuaire Active Directory, DHCP et DNS.',
        tags: ['Windows Server', 'MDT', 'WDS', 'Active Directory'],
      },
      {
        slug: 'migrations-messagerie',
        skill: 'messaging',
        featured: true,
        title: 'Migrations de comptes de messagerie',
        desc: 'Migration de boîtes Gmail, Outlook et IMAP (OVH, Gandi, IONOS, Orange…) vers Microsoft 365 ou Google Workspace, avec reprise des zones DNS et contrôle de la délivrabilité.',
        tags: ['Microsoft 365', 'Google Workspace', 'IMAP', 'DNS'],
      },
      {
        slug: 'support-n1-n3',
        skill: 'support',
        title: 'Support utilisateur N1 à N3',
        desc: 'Assistance de bout en bout auprès des utilisateurs : diagnostic, résolution, escalade vers les éditeurs (N4) et accompagnement technique.',
        tags: ['Support', 'Diagnostic', 'Microsoft 365'],
      },
      {
        slug: 'pc-sur-mesure',
        skill: 'support',
        title: 'PC sur mesure, personnels et professionnels',
        desc: "Choix des composants selon l'usage et le budget, montage, configuration et mise en service de PC pour des particuliers et des professionnels.",
        tags: ['Matériel', 'Montage', 'Configuration'],
      },
      {
        // href à ajouter quand le dépôt sera public : https://github.com/Dakire/MSG-EML-To-PDF-With-Attachments (privé pour l'instant)
        slug: 'convertisseur-msg-eml',
        skill: 'dev',
        title: 'Outil de conversion e-mail (C#)',
        desc: 'Un outil métier en C# qui extrait et convertit des archives de courriels complètes (MSG/EML) en PDF, pièces jointes comprises.',
        tags: ['C#', 'Outil métier', 'E-mail'],
      },
      {
        slug: 'automatisation-scripts',
        skill: 'dev',
        title: 'Automatisation (Python, scripts)',
        desc: 'Des scripts Python, PowerShell et Google Apps Script pour automatiser les tâches qui reviennent et fluidifier les flux de travail.',
        tags: ['Python', 'PowerShell', 'Automatisation'],
      },
      {
        slug: 'creation-web',
        skill: 'dev',
        title: 'Création web (JS, React, CMS)',
        href: 'https://github.com/Dakire/portfolio',
        desc: 'Extensions de navigateur sur mesure et sites web modernes (WordPress, Wix, React).',
        tags: ['JavaScript', 'React', 'Web'],
      },
      {
        slug: 'mineral-contest',
        skill: 'dev',
        kind: 'perso',
        title: 'MineralContest (plugin Minecraft)',
        desc: "Un plugin Spigot qui organise un « mineral contest » sur Minecraft, inspiré d'un plugin de Squeezie : des équipes de joueurs collectent des lingots (fer, or, diamant, émeraude) pour marquer des points. Partie de 60 minutes configurable, téléchargeur de carte et mise à jour automatique.",
        tags: ['Java', 'Spigot', 'Minecraft'],
        href: 'https://github.com/Dakire/MineralContest',
      },
      {
        slug: 'jettracker',
        skill: 'dev',
        title: 'JetTracker (projet étudiant)',
        desc: "Projet étudiant qui suit les jets de célébrités : une application Angular, une base Firebase (avec un export JSON pour l'essayer) et un serveur Express local.",
        tags: ['Angular', 'Express', 'Firebase'],
        href: 'https://github.com/ju-rouaux/JetTracker',
      },
      {
        slug: 'star-seeker',
        skill: 'dev',
        title: 'Star Seeker (rogue-like en SDL2)',
        desc: "Un rogue-like spatial, inspiré de The Binding of Isaac, développé de zéro avec SDL2 dans un projet étudiant de deuxième année : on explore les planètes de galaxies générées aléatoirement, on combat des monstres et l'expérience se conserve d'une partie à l'autre.",
        tags: ['SDL2', 'Makefile', 'Jeu vidéo'],
        href: 'https://github.com/ju-rouaux/Star-Seeker',
      },
      {
        slug: 'nurikabe',
        skill: 'dev',
        title: 'Nurikabe (jeu et aide à la résolution)',
        desc: 'Le jeu de Nurikabe en Java, avec une aide à la résolution des puzzles, développé dans un projet étudiant de troisième année de licence.',
        tags: ['Java', 'Maven', 'Jeu de logique'],
        href: 'https://github.com/ju-rouaux/Nurikabe',
      },
    ],
    educationTitle: 'Formation & langues',
    education: [
      {
        title: 'Licence Informatique (programmation, développement informatique)',
        school: 'Le Mans Université',
        date: 'Sept. 2020 - juin 2023',
        endYear: 2023,
        skills: ['Développement de logiciels', 'Développement web'],
        points: [
          'Projets universitaires : un rogue-like en SDL2, un jeu de Nurikabe avec aide à la résolution en Java et une application Angular de suivi de jets.',
        ],
        projects: ['star-seeker', 'nurikabe', 'jettracker'],
      },
      {
        title: "Baccalauréat scientifique, Sciences de l'ingénieur",
        school: 'Lycée Immaculée Conception',
        date: 'Déc. 2017 - janv. 2020',
        endYear: 2020,
      },
    ],
    languagesInfo: 'Français (langue maternelle), anglais (langue maternelle).',
  },
  en: {
    hero: {
      greeting: 'Hello, I am',
      role: 'IT & Digital Systems Technician',
      pitch:
        'I look after networks, workstations and email (Microsoft 365, Google Workspace): I set them up, fix them when they break, and support the people who use them. I also train people in AI, Microsoft 365 and GDPR.',
      cvBtn: 'Download my resume',
      contactBtn: 'Contact me',
      projectsBtn: 'See my work',
      cvLink: '/Resume_Guillaume_Richard_EN.pdf',
      cvLinks: [
        { href: '/Resume_Guillaume_Richard_EN.pdf', label: 'Resume in English (PDF)', lang: 'en' },
        { href: '/CV_Guillaume_Richard_FR.pdf', label: 'CV en français (PDF)', lang: 'fr' },
      ],
      terminal: [
        { cmd: 'whoami', out: 'guillaume · it & digital systems technician' },
        { cmd: 'cat stack.txt', out: 'Microsoft 365 · Google Workspace · DNS · Windows Server' },
        { cmd: 'ls ~/blog', out: 'spf-dkim-dmarc  deliverability  dns  migration  windows-11' },
      ],
    },
    aboutTitle: 'About me',
    about:
      "I am an IT technician, and I have always tested things to see how they work. Day to day I work on systems and networks, cloud email (Microsoft 365 and Google Workspace), DNS and support, from the user's request to the fix. When a task keeps coming back, I write the tool that does it for me.",
    aboutMore: [
      'This site brings together my career, my work and my skills. It also shows what came out of them: a blog of technical notes, online tools and command cheatsheets.',
    ],
    skillsTitle: 'Core expertise',
    skillsIntro:
      'Six areas, from networking to training. Each one links to what backs it up: projects, articles, tools and cheatsheets.',
    skills: [
      {
        id: 'network',
        category: 'Networks & Systems',
        items:
          'Windows Server (Active Directory, file server, DNS, DHCP, remote desktop, MDT and WDS to image PCs) and Linux. LAN/WLAN networks, VPN, FTP/SFTP. A homelab lets me test configurations and services before deploying them.',
        short: 'Windows Server, Linux, LAN/WLAN networks, VPN',
      },
      {
        id: 'security',
        category: 'IT Security',
        items:
          'Stormshield SNS firewalls, VPN, identity security on Microsoft 365 and Google Workspace, email authentication (SPF, DKIM, DMARC).',
        short: 'Stormshield SNS, VPN, identities, SPF, DKIM, DMARC',
      },
      {
        id: 'messaging',
        category: 'Messaging & Cloud',
        items:
          'Setting up and administering Microsoft 365 and Google Workspace (with GAM, on the command line) day to day: migrations from IMAP (OVH, Gandi, IONOS, Orange…), Gmail and Outlook, SMTP analysis, deliverability, DNS zones (MX, SPF, DKIM, DMARC) and operational maintenance.',
        short: 'Microsoft 365, Google Workspace, DNS, deliverability',
      },
      {
        id: 'training',
        category: 'AI, Google Workspace, M365 & GDPR training',
        items:
          "I train and support users in artificial intelligence, Google Workspace, Microsoft 365 and GDPR best practices. This support extends day-to-day helpdesk work: getting started with the tools and answering users' questions.",
        short: 'AI, Google Workspace, Microsoft 365, GDPR: training and support',
      },
      {
        id: 'dev',
        category: 'Development & Automation',
        items:
          'Website creation and management (WordPress, Wix, Shopify, Weebly, PrestaShop, React). Scripts and tools in C#, Java, Python, PowerShell, Bash, SQL and PHP. University projects in Java, SDL2 and Angular, and a Minecraft plugin in Java: the repositories are on GitHub.',
        short: 'C#, Python, PowerShell, PHP, websites',
      },
      {
        id: 'support',
        category: 'IT Support & Projects',
        items:
          'End-to-end user support (L1 to L3): call and helpdesk ticket handling, escalation to software vendors (L4), business application deployment and technical guidance.',
        short: 'L1 to L3 support, vendor escalation, business software',
      },
    ],
    experienceTitle: 'Career',
    experienceIntro:
      'My roles, most recent first, followed by my education. The duties listed are examples, not an exhaustive list. The full resume is available as a PDF, in English and in French.',
    experiences: [
      {
        role: 'IT and Digital Systems Technician',
        company: 'TIXIA Services numériques',
        location: 'France',
        contract: 'Permanent contract',
        date: 'Since September 2023',
        start: '2023-09',
        points: [
          'Setting up and administering Google Workspace, with GAM (command-line administration).',
          'Setting up and administering Microsoft 365: identities, security, operational maintenance.',
          'Email migrations to Google Workspace and Microsoft 365: IMAP (OVH, Gandi, IONOS, Orange, etc.), Gmail and Outlook, with DNS zones carried over.',
          'DNS zone management, SMTP header analysis and deliverability (SPF, DKIM, DMARC).',
          'Call and ticket handling: L1 to L3 helpdesk support, L4 escalation to vendors.',
          'Windows Server administration and configuration: Active Directory, file server, DHCP, DNS, remote desktop.',
          'Setting up MDT and WDS to image PCs.',
          'Building and updating websites with CMSs (Weebly, Wix, Shopify).',
        ],
        skills: [
          'Google Workspace',
          'Microsoft 365',
          'GAM',
          'Windows Server',
          'MDT and WDS',
          'Helpdesk support',
        ],
      },
      {
        role: 'IT support technician',
        company: 'AlloVoisin / Private individuals',
        location: 'France',
        date: 'Since 2021',
        start: '2021',
        points: [
          'Local IT assistance and diagnostics, hardware and software.',
          'PC repair, technology advice and system optimisation.',
        ],
      },
      {
        role: 'Webmaster',
        company: 'Les papiers de Lucas',
        location: 'Changé, France',
        contract: 'Fixed-term contract',
        date: 'April 2022 - June 2022',
        start: '2022-04',
        end: '2022-06',
        points: [
          'Maintenance and administration of the PrestaShop e-commerce site.',
          'Detailed SEO audits, DNS management and UX/UI fixes.',
        ],
        skills: ['PrestaShop', 'SEO', 'DNS'],
      },
      {
        role: 'IT maintenance technician',
        company: 'Tibco (Lactalis Group)',
        location: 'France',
        contract: 'Fixed-term contract',
        date: 'March 2019 (1 month)',
        start: '2019-03',
        end: '2019-03',
        points: [
          'Preparation and imaging of new computers for Lactalis.',
          'Computer repair in several factories: hardware fault diagnosis and remote assistance.',
          'Helpdesk and logistics.',
        ],
        skills: ['IT maintenance'],
      },
    ],
    projectsTitle: 'Projects',
    projectsIntro:
      'From infrastructure to automation: each project has its own page, with its stack and the articles, tools and cheatsheets that go with it.',
    projectsAll: 'All projects',
    projects: [
      {
        slug: 'homelab-proxmox',
        skill: 'network',
        kind: 'perso',
        featured: true,
        title: 'Proxmox, OPNsense and WireGuard homelab',
        desc: 'A personal lab on Proxmox to test configurations and services before deploying them: OPNsense firewall, WireGuard VPN, a segmented network and test virtual machines.',
        tags: ['Proxmox', 'OPNsense', 'WireGuard', 'Virtualization'],
      },
      {
        slug: 'deploiement-windows-server',
        skill: 'network',
        featured: true,
        title: 'Windows Server deployment (MDT, WDS)',
        desc: 'Windows servers set up to roll out workstations in bulk: master images with MDT, network boot with WDS, Active Directory, DHCP and DNS.',
        tags: ['Windows Server', 'MDT', 'WDS', 'Active Directory'],
      },
      {
        slug: 'migrations-messagerie',
        skill: 'messaging',
        featured: true,
        title: 'Mailbox migrations',
        desc: 'Migration of Gmail, Outlook and IMAP mailboxes (OVH, Gandi, IONOS, Orange…) to Microsoft 365 or Google Workspace, including DNS zones and deliverability checks.',
        tags: ['Microsoft 365', 'Google Workspace', 'IMAP', 'DNS'],
      },
      {
        slug: 'support-n1-n3',
        skill: 'support',
        title: 'User support L1 to L3',
        desc: 'End-to-end user assistance: diagnosis, resolution, escalation to software vendors (L4) and technical guidance.',
        tags: ['Support', 'Troubleshooting', 'Microsoft 365'],
      },
      {
        slug: 'pc-sur-mesure',
        skill: 'support',
        title: 'Custom-built PCs, personal and professional',
        desc: 'Choosing components for the use case and budget, then building, configuring and commissioning PCs for individuals and businesses.',
        tags: ['Hardware', 'Build', 'Configuration'],
      },
      {
        // href à ajouter quand le dépôt sera public : https://github.com/Dakire/MSG-EML-To-PDF-With-Attachments (privé pour l'instant)
        slug: 'convertisseur-msg-eml',
        skill: 'dev',
        title: 'MSG/EML to PDF converter (C#)',
        desc: 'A business tool in C# that extracts and converts whole email archives (MSG/EML) to PDF, attachments included.',
        tags: ['C#', 'Business tool', 'Email'],
      },
      {
        slug: 'automatisation-scripts',
        skill: 'dev',
        title: 'Automation (Python, scripts)',
        desc: 'Python, PowerShell and Google Apps Script scripts that automate recurring tasks and smooth out workflows.',
        tags: ['Python', 'PowerShell', 'Automation'],
      },
      {
        slug: 'creation-web',
        skill: 'dev',
        title: 'Web creation (JS, React, CMS)',
        href: 'https://github.com/Dakire/portfolio',
        desc: 'Custom browser extensions and modern websites (WordPress, Wix, React).',
        tags: ['JavaScript', 'React', 'Web'],
      },
      {
        slug: 'mineral-contest',
        skill: 'dev',
        kind: 'perso',
        title: 'MineralContest (Minecraft plugin)',
        desc: 'A Spigot plugin that runs a "mineral contest" on Minecraft, inspired by a plugin by Squeezie: teams of players collect ingots (iron, gold, diamond, emerald) to score points. Configurable 60-minute game, map downloader and automatic updates.',
        tags: ['Java', 'Spigot', 'Minecraft'],
        href: 'https://github.com/Dakire/MineralContest',
      },
      {
        slug: 'jettracker',
        skill: 'dev',
        title: 'JetTracker (student project)',
        desc: "A student project that tracks celebrities' jets: an Angular app, a Firebase database (with a JSON export to try it out) and a local Express server.",
        tags: ['Angular', 'Express', 'Firebase'],
        href: 'https://github.com/ju-rouaux/JetTracker',
      },
      {
        slug: 'star-seeker',
        skill: 'dev',
        title: 'Star Seeker (SDL2 rogue-like)',
        desc: 'A space rogue-like inspired by The Binding of Isaac, built from scratch with SDL2 in a second-year student project: you explore the planets of randomly generated galaxies, fight monsters, and experience carries over from one run to the next.',
        tags: ['SDL2', 'Makefile', 'Video game'],
        href: 'https://github.com/ju-rouaux/Star-Seeker',
      },
      {
        slug: 'nurikabe',
        skill: 'dev',
        title: 'Nurikabe (game and solving help)',
        desc: "The Nurikabe puzzle game in Java, with help for solving puzzles, built in a third-year bachelor's student project.",
        tags: ['Java', 'Maven', 'Logic game'],
        href: 'https://github.com/ju-rouaux/Nurikabe',
      },
    ],
    educationTitle: 'Education & languages',
    education: [
      {
        title: 'Bachelor of Science in Computer Science (programming, software development)',
        school: 'Le Mans University',
        date: 'Sept. 2020 - June 2023',
        endYear: 2023,
        skills: ['Software development', 'Web development'],
        points: [
          'University projects: a rogue-like game in SDL2, a Nurikabe game with puzzle-solving help in Java, and an Angular app that tracks jets.',
        ],
        projects: ['star-seeker', 'nurikabe', 'jettracker'],
      },
      {
        title: 'French Scientific Baccalauréat (Engineering Sciences)',
        school: 'Lycée Immaculée Conception',
        date: 'Dec. 2017 - Jan. 2020',
        endYear: 2020,
      },
    ],
    languagesInfo: 'French (native), English (native).',
  },
};

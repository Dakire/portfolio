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
  /** Ce que recouvre le poste, un point par ligne. */
  points: string[];
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
  education: string[];
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
      "L'informatique me passionne depuis toujours, et j'ai gardé l'habitude de tout tester pour comprendre comment ça marche. Aujourd'hui, je suis technicien informatique : je travaille au quotidien sur les systèmes et les réseaux, la messagerie dans le cloud (Microsoft 365 et Google Workspace), le DNS et le support, de la demande de l'utilisateur jusqu'à sa résolution. Quand une tâche se répète, j'écris l'outil qui la fait à ma place.",
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
          'Windows Server (Active Directory, MDT, WDS, DNS, DHCP, bureau à distance) et Linux. Réseaux LAN/WLAN, VPN, FTP/SFTP. Un homelab me sert à tester configurations et services avant de les déployer.',
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
          'Microsoft 365 et Google Workspace au quotidien : analyse SMTP, délivrabilité, zones DNS (MX, SPF, DKIM, DMARC) et maintien en conditions opérationnelles (MCO).',
        short: 'Microsoft 365, Google Workspace, DNS, délivrabilité',
      },
      {
        id: 'training',
        category: 'Formation IA, M365 & RGPD',
        items:
          "Je forme et j'accompagne les utilisateurs à l'intelligence artificielle, à Microsoft 365 et aux bonnes pratiques du RGPD.",
        short: 'IA, Microsoft 365, RGPD : former et accompagner',
      },
      {
        id: 'dev',
        category: 'Développement & Automatisation',
        items:
          'Création et gestion de sites (WordPress, Wix, Shopify, React). Scripts et outils en C#, Java, Python, PowerShell, Bash, SQL et PHP.',
        short: 'C#, Python, PowerShell, PHP, sites web',
      },
      {
        id: 'support',
        category: 'Support & Projets IT',
        items:
          'Support utilisateur de bout en bout (N1 à N3), escalade auprès des éditeurs (N4), déploiement de logiciels métiers et accompagnement technique.',
        short: 'Support N1 à N3, escalade éditeurs, logiciels métiers',
      },
    ],
    experienceTitle: 'Parcours professionnel',
    experienceIntro:
      'Mes postes, du plus récent au plus ancien, suivis de ma formation. Le CV complet est disponible en PDF, en français et en anglais.',
    experiences: [
      {
        role: 'Technicien informatique et systèmes numériques',
        company: 'TIXIA Services numériques',
        location: 'Laval, France',
        date: 'Depuis août 2023',
        start: '2023-08',
        points: [
          'Administration avancée de Microsoft 365 et Google Workspace : identités, sécurité, maintien en conditions opérationnelles.',
          'Migrations complexes de messagerie : IMAP (OVH, Gandi, IONOS, Orange, etc.), Gmail et Outlook vers le cloud.',
          'Gestion des zones DNS, analyse des en-têtes SMTP et de la délivrabilité (SPF, DKIM, DMARC).',
          'Administration Windows Server : MDT, WDS, Active Directory, DHCP, DNS, bureau à distance.',
          'Support IT de N1 à N3 (escalade N4 auprès des éditeurs) et masterisation de PC.',
        ],
      },
      {
        role: 'Intervenant dépannage informatique',
        company: 'AlloVoisin / Particuliers',
        location: 'Laval & Le Mans',
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
        date: 'Avril 2022 - juin 2022',
        start: '2022-04',
        end: '2022-06',
        points: [
          "Maintenance technique et administration d'un site e-commerce PrestaShop.",
          'Audits SEO détaillés, gestion DNS et corrections UX/UI.',
        ],
      },
      {
        role: 'Technicien de maintenance IT',
        company: 'Tibco (groupe Lactalis)',
        location: 'Laval, France',
        date: 'Janvier 2019',
        start: '2019-01',
        end: '2019-01',
        points: [
          'Préparation et masterisation de postes informatiques industriels.',
          'Diagnostic de pannes matérielles et télé-assistance.',
        ],
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
    ],
    educationTitle: 'Formation & langues',
    education: [
      'Licence Informatique (Développement et Programmation) - Le Mans Université (2023)',
      "Baccalauréat Scientifique (Sciences de l'Ingénieur) - Lycée Immaculée Conception, Laval (2020)",
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
      "I have loved computers for as long as I can remember, and I still test everything to see how it works. Today I am an IT technician: every day I work on systems and networks, cloud email (Microsoft 365 and Google Workspace), DNS and support, from the user's request all the way to the fix. When a task keeps coming back, I write the tool that does it for me.",
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
          'Windows Server (Active Directory, MDT, WDS, DNS, DHCP, remote desktop) and Linux. LAN/WLAN networks, VPN, FTP/SFTP. A homelab lets me test configurations and services before deploying them.',
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
          'Microsoft 365 and Google Workspace day to day: SMTP analysis, deliverability, DNS zones (MX, SPF, DKIM, DMARC) and operational maintenance.',
        short: 'Microsoft 365, Google Workspace, DNS, deliverability',
      },
      {
        id: 'training',
        category: 'AI, M365 & GDPR training',
        items:
          'I train and support users in artificial intelligence, Microsoft 365 and GDPR best practices.',
        short: 'AI, Microsoft 365, GDPR: training and support',
      },
      {
        id: 'dev',
        category: 'Development & Automation',
        items:
          'Website creation and management (WordPress, Wix, Shopify, React). Scripts and tools in C#, Java, Python, PowerShell, Bash, SQL and PHP.',
        short: 'C#, Python, PowerShell, PHP, websites',
      },
      {
        id: 'support',
        category: 'IT Support & Projects',
        items:
          'End-to-end user support (L1 to L3), escalation to software vendors (L4), business application deployment and technical guidance.',
        short: 'L1 to L3 support, vendor escalation, business software',
      },
    ],
    experienceTitle: 'Career',
    experienceIntro:
      'My roles, most recent first, followed by my education. The full resume is available as a PDF, in English and in French.',
    experiences: [
      {
        role: 'IT and Digital Systems Technician',
        company: 'TIXIA Services numériques',
        location: 'Laval, France',
        date: 'Since August 2023',
        start: '2023-08',
        points: [
          'Advanced administration of Microsoft 365 and Google Workspace: identities, security, operational maintenance.',
          'Complex email migrations: IMAP (OVH, Gandi, IONOS, Orange, etc.), Gmail and Outlook to the cloud.',
          'DNS zone management, SMTP header analysis and deliverability (SPF, DKIM, DMARC).',
          'Windows Server administration: MDT, WDS, Active Directory, DHCP, DNS, remote desktop.',
          'L1 to L3 IT support (L4 escalation to vendors) and PC imaging.',
        ],
      },
      {
        role: 'IT support technician',
        company: 'AlloVoisin / Private individuals',
        location: 'Laval & Le Mans',
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
        date: 'April 2022 - June 2022',
        start: '2022-04',
        end: '2022-06',
        points: [
          'Technical maintenance and administration of a PrestaShop e-commerce site.',
          'Detailed SEO audits, DNS management and UX/UI fixes.',
        ],
      },
      {
        role: 'IT maintenance technician',
        company: 'Tibco (Lactalis Group)',
        location: 'Laval, France',
        date: 'January 2019',
        start: '2019-01',
        end: '2019-01',
        points: [
          'Preparation and imaging of industrial computers.',
          'Hardware fault diagnosis and remote assistance.',
        ],
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
    ],
    educationTitle: 'Education & languages',
    education: [
      'Bachelor of Science in Computer Science (Development & Programming) - Le Mans University (2023)',
      'French Scientific Baccalauréat (Engineering Sciences) - Lycée Immaculée Conception, Laval (2020)',
    ],
    languagesInfo: 'French (native), English (native).',
  },
};

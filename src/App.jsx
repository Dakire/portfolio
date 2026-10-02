import { useState, useEffect } from 'react';
import { Terminal, Server, Shield, Code, Globe, Mail, Smartphone, MapPin, Download, User, Briefcase, BookOpen, Send, FolderGit2, ArrowLeft } from 'lucide-react';

// ==========================================
// 1. COMPOSANTS ICÔNES (SVG Purs)
// ==========================================
const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
  <rect x="2" y="9" width="4" height="12"></rect>
  <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

// ==========================================
// 2. DONNÉES DU SITE (Calquées sur le CV)
// ==========================================
const PORTFOLIO_DATA = {
  fr: {
    nav: { about: "À propos", skills: "Compétences", exp: "Expériences", projects: "Projets", contact: "Contact" },
    hero: { greeting: "Bonjour, je suis", role: "Administrateur Système, Réseau & Développement", cvBtn: "Télécharger mon CV", contactBtn: "Me contacter", cvLink: "/CV_Guillaume_Richard_FR.pdf" },
    aboutTitle: "À propos de moi",
    about: "Passionné par l'informatique depuis toujours et d'un naturel curieux, j'aime explorer et tester les nouvelles technologies. Fort de mon expérience, je possède aujourd'hui une solide expertise en administration système et réseau, gestion Cloud (M365/Workspace), troubleshooting DNS et support IT de bout en bout. Au quotidien, je déploie et administre des infrastructures complexes tout en développant des outils d'automatisation sur-mesure.",
    skillsTitle: "Domaines d'Expertise",
    skills: [
      { category: "Systèmes & Réseaux", items: "Windows Server (AD, MDT, WDS, DNS, DHCP, RDP), Linux. Gestion de Réseaux : LAN/WLAN, Stormshield, VPN, FTP/SFTP." },
      { category: "Messagerie & Cloud", items: "Expertise M365 & Google Workspace. Analyse SMTP, Délivrabilité, gestion des Zones DNS (MX, SPF, DKIM, DMARC), Maintien en Conditions Opérationnelles (MCO)." },
      { category: "Web & Développement", items: "Création et gestion de sites (WordPress, Wix, Shopify, React). Langages : C#, Java, Python, PowerShell, Bash, SQL, PHP." },
      { category: "Support & Projets IT", items: "Support utilisateur de bout en bout (N1 à N3), escalade éditeurs (N4), déploiement de logiciels métiers et accompagnement technique." }
    ],
    experienceTitle: "Expériences Professionnelles",
    experiences: [
      { role: "Technicien informatique et systèmes numériques", company: "TIXIA Services numériques", location: "Laval, France", date: "Depuis Août 2023", desc: "Administration avancée de Microsoft 365 et Google Workspace (identités, sécurité, MCO). Migrations complexes : IMAP (OVH, Gandi, IONOS, Orange, etc.), Gmail, Outlook vers le Cloud. Gestion zones DNS, analyse headers SMTP et délivrabilité (SPF, DKIM, DMARC). Administration Windows Server (MDT, WDS, AD, DHCP, DNS, RDP). Support IT N1 à N3 (escalade N4 éditeurs) et masterisation de PC." },
      { role: "Intervenant Dépannage Informatique", company: "AlloVoisin / Particuliers", location: "Laval & Le Mans", date: "Depuis 2021", desc: "Assistance informatique de proximité et diagnostic (matériel/logiciel). Réparation de PC, conseil technologique et optimisation de systèmes." },
      { role: "Webmaster", company: "Les papiers de Lucas", location: "Changé, France", date: "Avril 2022 - Juin 2022", desc: "Maintenance technique et administration d'un site e-commerce PrestaShop. Audits SEO détaillés, gestion DNS et correction UX/UI." },
      { role: "Technicien de Maintenance IT", company: "Tibco (Groupe Lactalis)", location: "Laval, France", date: "Janvier 2019", desc: "Préparation et masterisation de postes informatiques industriels. Diagnostic de pannes matérielles et télé-assistance." }
    ],
    projectsTitle: "Projets Techniques & GitHub",
    projects: [
      { title: "Outil de Conversion Email (C#)", desc: "Outil métier développé en C# permettant l'extraction et la conversion d'archives mails complètes (MSG/EML) vers PDF avec gestion automatique des pièces jointes.", tags: ["C#", "Outil Métier", "Email"], link: "https://github.com/Dakire" },
      { title: "Automatisation (Python, Scripts)", desc: "Création de scripts Python, PowerShell et Google Apps Script pour l'automatisation de tâches récurrentes et l'optimisation des flux de travail.", tags: ["Python", "PowerShell", "Automation"], link: "https://github.com/Dakire" },
      { title: "Création Web (JS, React, CMS)", desc: "Développement d'extensions navigateur sur-mesure et déploiement de sites web modernes (WordPress, Wix, React).", tags: ["JavaScript", "React", "Web"], link: "https://github.com/Dakire" }
    ],
    educationTitle: "Formation & Profil",
    education: [
      "Licence Informatique (Développement et Programmation) - Le Mans Université (2023)",
      "Baccalauréat Scientifique (Sciences de l'Ingénieur) - Lycée Immaculée Conception, Laval (2020)"
    ],
    languagesInfo: "Français (Maternelle), Anglais (Bilingue technique).",
    contactTitle: "Échangeons sur vos projets",
    contactDesc: "Une question, un projet ou une opportunité professionnelle ? N'hésitez pas à me contacter via ce formulaire, je vous répondrai dans les plus brefs délais.",
    form: { name: "Votre nom complet", email: "Votre adresse email", message: "Votre message...", gdpr: "J'accepte que mes données soient utilisées pour me recontacter.", submit: "Envoyer le message", sending: "Envoi en cours...", success: "Message envoyé avec succès !", error: "Erreur technique. Veuillez réessayer." },
      footer: { legal: "Mentions Légales", rights: "Tous droits réservés." }
  },
  en: {
    nav: { about: "About", skills: "Skills", exp: "Experience", projects: "Projects", contact: "Contact" },
    hero: { greeting: "Hello, I am", role: "IT, System, Network & Development Admin", cvBtn: "Download Resume", contactBtn: "Contact Me", cvLink: "/Resume_Guillaume_Richard_EN.pdf" },
    aboutTitle: "About Me",
    about: "Passionate about IT from an early age and naturally curious, I love exploring and testing new technologies. Building on solid experience, I possess a strong expertise in system and network administration, Cloud management (M365/Workspace), DNS troubleshooting, and end-to-end IT support. On a daily basis, I deploy and manage complex IT infrastructures while developing custom automation tools.",
    skillsTitle: "Core Expertise",
    skills: [
      { category: "Systems & Networks", items: "Windows Server (AD, MDT, WDS, DNS, DHCP, RDP), Linux. Network Management: LAN/WLAN, Stormshield, VPN, FTP/SFTP." },
      { category: "Messaging & Cloud", items: "M365 & Google Workspace expertise. SMTP header analysis, deliverability troubleshooting, DNS zone management (MX, SPF, DKIM, DMARC)." },
      { category: "Web & Development", items: "Website creation and management (WordPress, Wix, Shopify, React). Languages: C#, Java, Python, PowerShell, Bash, SQL, PHP." },
      { category: "IT Support & Projects", items: "End-to-end user support (L1 to L3), software publisher escalation (L4), business application deployment, and technical consulting." }
    ],
    experienceTitle: "Professional Experience",
    experiences: [
      { role: "IT and Digital Systems Technician", company: "TIXIA Services numériques", location: "Laval, France", date: "Since August 2023", desc: "Advanced administration of Microsoft 365 and Google Workspace (identities, security). Complex migrations: IMAP (OVH, Gandi, IONOS, Orange), Gmail, Outlook to the Cloud. DNS zone management, SMTP headers analysis, and deliverability (SPF, DKIM, DMARC). Windows Server administration (MDT, WDS, AD, DHCP, DNS, RDP). L1-L3 IT Support (L4 escalation) and PC imaging." },
      { role: "IT Support Technician", company: "Private Individuals", location: "Laval & Le Mans", date: "Since 2021", desc: "Local IT assistance and diagnostics (hardware/software). PC repair, technological consulting, and system optimization." },
      { role: "Webmaster", company: "Les papiers de Lucas", location: "Changé, France", date: "April 2022 - June 2022", desc: "Technical maintenance and administration of a PrestaShop e-commerce website. Detailed SEO audits, DNS management, and UX/UI fixes." },
      { role: "IT Maintenance Technician", company: "Tibco (Lactalis Group)", location: "Laval, France", date: "January 2019", desc: "Preparation and system imaging of industrial computers. On-site hardware diagnostics and remote technical assistance." }
    ],
    projectsTitle: "Technical Projects & GitHub",
    projects: [
      { title: "MSG/EML to PDF Converter", desc: "Business tool developed in C# allowing the extraction and conversion of complete email archives (MSG/EML) into PDFs with automated attachment handling.", tags: ["C#", "Business Tool", "Email"], link: "https://github.com/Dakire" },
      { title: "Automation (Python, Scripts)", desc: "Creation of Python, PowerShell, and Google Apps Script scripts to automate recurring tasks and optimize workflows.", tags: ["Python", "PowerShell", "Automation"], link: "https://github.com/Dakire" },
      { title: "Web Creation (JS, React, CMS)", desc: "Development of custom browser extensions and deployment of modern websites (WordPress, Wix, React).", tags: ["JavaScript", "React", "Web"], link: "https://github.com/Dakire" }
    ],
    educationTitle: "Education & Profile",
    education: [
      "Bachelor of Science in Computer Science (Development & Programming) - Le Mans University (2023)",
      "A-Levels (Engineering Sciences, Physics, Maths) - Lycée Immaculée Conception, Laval (2020)"
    ],
    languagesInfo: "French (Native), English (Fluent Technical).",
    contactTitle: "Let's connect",
    contactDesc: "A question, a project, or a professional opportunity? Feel free to contact me via this form, and I will get back to you as soon as possible.",
    form: { name: "Full Name", email: "Email Address", message: "Your message...", gdpr: "I agree that my data may be used to contact me.", submit: "Send Message", sending: "Sending...", success: "Message sent successfully!", error: "Technical error. Please try again." },
      footer: { legal: "Legal Mentions", rights: "All rights reserved." }
  }
};

// ==========================================
// 3. COMPOSANT PRINCIPAL
// ==========================================
export default function App() {
  const [lang, setLang] = useState('fr');
  const [formStatus, setFormStatus] = useState('idle');
  const [showLegal, setShowLegal] = useState(false);

  const t = PORTFOLIO_DATA[lang];

  // Gestion du SEO Dynamique
  useEffect(() => {
    document.title = lang === 'fr' ? "Guillaume Richard | Administrateur Système & Réseau" : "Guillaume Richard | System & Network Admin";
    document.documentElement.lang = lang;

    // Metadatas dynamiques
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = lang === 'fr'
      ? "Portfolio de Guillaume Richard, Administrateur Système et Réseau. Expertise en infrastructure (M365, DNS, Windows Server), Cloud et développement."
      : "Portfolio of Guillaume Richard, System and Network Administrator. Expertise in infrastructure, Cloud, DNS, and development.";
    }
  }, [lang]);

  // Gestionnaire de formulaire (Fetch API vers OVH)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('loading');

    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      const response = await fetch('/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus('success');
        e.target.reset();
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setFormStatus('error');
    } finally {
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  // --- VUE : MENTIONS LÉGALES ---
  if (showLegal) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
      <button onClick={() => setShowLegal(false)} className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 mb-8 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-2 py-1 -ml-2">
      <ArrowLeft className="w-5 h-5" /> Retour au portfolio
      </button>
      <h1 className="text-3xl font-bold text-white mb-6">Mentions Légales</h1>
      <div className="space-y-6 text-sm leading-relaxed text-slate-400">
      <section>
      <h2 className="text-xl font-semibold text-white mb-2">1. Éditeur du site</h2>
      <p>Ce site est édité par Guillaume Richard, un particulier.<br/>Résidant à : Laval, 53000, France.<br/>Contact : guillaume.rwins@gmail.com</p>
      </section>
      <section>
      <h2 className="text-xl font-semibold text-white mb-2">2. Hébergement</h2>
      <p>Ce site est hébergé par OVH SAS.<br/>Adresse : 2 rue Kellermann - 59100 Roubaix - France.<br/>Site web : www.ovh.com</p>
      </section>
      <section>
      <h2 className="text-xl font-semibold text-white mb-2">3. Propriété intellectuelle</h2>
      <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.</p>
      </section>
      <section>
      <h2 className="text-xl font-semibold text-white mb-2">4. Données personnelles (RGPD)</h2>
      <p>Les informations recueillies via le formulaire de contact (Nom, Email, Message) sont uniquement destinées à vous répondre. Elles ne sont stockées dans aucune base de données et ne sont jamais cédées à des tiers.<br/>Conformément à la loi "Informatique et Libertés" et au RGPD, vous disposez d'un droit d'accès, de rectification et d'effacement de vos données en me contactant par email.</p>
      </section>
      <section>
      <h2 className="text-xl font-semibold text-white mb-2">5. Cookies</h2>
      <p>Ce site fonctionne sans l'utilisation de cookies de suivi ou de traçage publicitaire. Votre navigation est respectueuse de votre vie privée.</p>
      </section>
      </div>
      </div>
      </div>
    );
  }

  // --- VUE : PORTFOLIO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30 scroll-smooth">

    {/* HEADER / NAVIGATION */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-sm">
    <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
    <a href="#home" aria-label="Retour à l'accueil" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg px-1">
    <Terminal className="w-6 h-6" aria-hidden="true" />
    <span className="font-mono font-bold tracking-tight text-white hidden sm:block">GR_PORTFOLIO</span>
    </a>

    <nav aria-label="Menu principal" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
    <a href="#about" className="hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.nav.about}</a>
    <a href="#skills" className="hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.nav.skills}</a>
    <a href="#experience" className="hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.nav.exp}</a>
    <a href="#projects" className="hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.nav.projects}</a>
    <a href="#contact" className="hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1">{t.nav.contact}</a>
    </nav>

    <button
    onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
    aria-label="Changer de langue"
    className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
    <Globe className="w-4 h-4 text-emerald-500" aria-hidden="true" />
    {lang === 'fr' ? 'EN' : 'FR'}
    </button>
    </div>
    </header>

    <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 space-y-32">

    {/* HERO SECTION */}
    <section id="home" className="scroll-mt-32 flex flex-col items-start justify-center min-h-[60vh]">
    <p className="text-emerald-500 font-mono mb-4 text-lg">{t.hero.greeting}</p>
    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4">
    Guillaume <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Richard.</span>
    </h1>
    <h2 className="text-2xl md:text-4xl font-bold text-slate-400 mb-8 max-w-3xl leading-tight">
    {t.hero.role}
    </h2>

    <div className="flex flex-wrap gap-4 mt-4">
    <a href="#contact" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950">
    {t.hero.contactBtn}
    </a>
    <a href={t.hero.cvLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950">
    <Download className="w-5 h-5" aria-hidden="true" /> {t.hero.cvBtn}
    </a>
    </div>
    </section>

    {/* ABOUT SECTION */}
    <section id="about" className="scroll-mt-32">
    <header className="flex items-center gap-4 mb-8">
    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
    <User className="w-8 h-8 text-emerald-500" aria-hidden="true" /> {t.aboutTitle}
    </h3>
    <div className="h-px bg-slate-800 flex-1"></div>
    </header>
    <article className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-lg leading-relaxed text-slate-300 max-w-4xl shadow-xl">
    <p>{t.about}</p>
    <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-slate-800">
    <a href="https://www.linkedin.com/in/guillaume-richard-in" aria-label="Visiter mon profil LinkedIn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#0A66C2] transition-colors focus:outline-none focus:text-[#0A66C2]">
    <LinkedinIcon className="w-6 h-6" /> LinkedIn
    </a>
    <a href="https://github.com/Dakire" aria-label="Visiter mon profil GitHub" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors focus:outline-none focus:text-white">
    <GithubIcon className="w-6 h-6" /> GitHub
    </a>
    </div>
    </article>
    </section>

    {/* SKILLS SECTION */}
    <section id="skills" className="scroll-mt-32">
    <header className="flex items-center gap-4 mb-10">
    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
    <Code className="w-8 h-8 text-emerald-500" aria-hidden="true" /> {t.skillsTitle}
    </h3>
    <div className="h-px bg-slate-800 flex-1"></div>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {t.skills.map((skill, index) => (
      <article key={index} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors shadow-lg">
      <div className="flex items-center gap-3 mb-4">
      <Server className="w-5 h-5 text-emerald-500" aria-hidden="true" />
      <h4 className="text-white font-bold text-lg">{skill.category}</h4>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{skill.items}</p>
      </article>
    ))}
    </div>
    </section>

    {/* EXPERIENCE SECTION */}
    <section id="experience" className="scroll-mt-32">
    <header className="flex items-center gap-4 mb-10">
    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
    <Briefcase className="w-8 h-8 text-emerald-500" aria-hidden="true" /> {t.experienceTitle}
    </h3>
    <div className="h-px bg-slate-800 flex-1"></div>
    </header>
    <div className="space-y-8 max-w-4xl">
    {t.experiences.map((exp, idx) => (
      <article key={idx} className="relative pl-8 md:pl-0">
      <div className="absolute left-[11px] md:left-[140px] top-2 bottom-[-32px] w-px bg-slate-800 last:hidden" aria-hidden="true"></div>
      <div className="absolute left-[7px] md:left-[136px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-500 border-[3px] border-slate-950 box-content" aria-hidden="true"></div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-16">
      <div className="md:w-[120px] shrink-0 pt-2 hidden md:block text-right">
      <span className="text-emerald-500 font-mono text-sm">{exp.date}</span>
      </div>
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex-1 hover:bg-slate-900 transition-colors">
      <span className="text-emerald-500 font-mono text-xs md:hidden block mb-2">{exp.date}</span>
      <h4 className="text-xl font-bold text-white mb-1">{exp.role}</h4>
      <p className="text-emerald-400 font-medium text-sm mb-4 flex items-center gap-2">
      {exp.company} {exp.location && <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true"/> {exp.location}</span>}
      </p>
      <p className="text-slate-400 text-sm leading-relaxed">{exp.desc}</p>
      </div>
      </div>
      </article>
    ))}
    </div>
    </section>

    {/* PROJECTS SECTION */}
    <section id="projects" className="scroll-mt-32">
    <header className="flex items-center gap-4 mb-10">
    <h3 className="text-3xl font-bold text-white flex items-center gap-3">
    <FolderGit2 className="w-8 h-8 text-emerald-500" aria-hidden="true" /> {t.projectsTitle}
    </h3>
    <div className="h-px bg-slate-800 flex-1"></div>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {t.projects.map((project, index) => (
      <a key={index} href={project.link} target="_blank" rel="noopener noreferrer" className="bg-slate-900 border border-slate-800 hover:border-emerald-500 p-6 rounded-2xl transition-all shadow-lg group flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-emerald-500">
      <div className="flex justify-between items-start mb-4">
      <FolderGit2 className="w-8 h-8 text-emerald-500 group-hover:text-emerald-400 transition-colors" aria-hidden="true" />
      <GithubIcon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
      </div>
      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-emerald-400 transition-colors">{project.title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{project.desc}</p>
      <div className="flex flex-wrap gap-2 mt-auto">
      {project.tags.map((tag, i) => (
        <span key={i} className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
        {tag}
        </span>
      ))}
      </div>
      </a>
    ))}
    </div>
    </section>

    {/* EDUCATION & CONTACT SECTION */}
    <section id="education" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12">

    <aside>
    <header className="flex items-center gap-4 mb-8">
    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
    <BookOpen className="w-6 h-6 text-emerald-500" aria-hidden="true" /> {t.educationTitle}
    </h3>
    </header>
    <ul className="space-y-4 mb-6">
    {t.education.map((edu, idx) => (
      <li key={idx} className="flex gap-4 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
      <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="text-slate-300 text-sm leading-relaxed">{edu}</span>
      </li>
    ))}
    </ul>
    <article className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
    <strong className="text-white block mb-1">Langues / Languages</strong>
    <p className="text-sm text-slate-400">{t.languagesInfo}</p>
    </article>
    </aside>

    <div id="contact" className="scroll-mt-32">
    <header className="flex items-center gap-4 mb-8">
    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
    <Mail className="w-6 h-6 text-emerald-500" aria-hidden="true" /> {t.contactTitle}
    </h3>
    </header>
    <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl">
    <p className="text-slate-400 mb-6 text-sm">{t.contactDesc}</p>

    <form onSubmit={handleSubmit} className="space-y-4">
    <div>
    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">{t.form.name}</label>
    <input type="text" id="name" name="name" required disabled={formStatus === 'loading'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50" />
    </div>
    <div>
    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">{t.form.email}</label>
    <input type="email" id="email" name="email" required disabled={formStatus === 'loading'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50" />
    </div>
    <div>
    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">{t.form.message}</label>
    <textarea id="message" name="message" rows="4" required disabled={formStatus === 'loading'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none disabled:opacity-50"></textarea>
    </div>

    <div className="flex items-start gap-3 mt-4">
    <input type="checkbox" id="gdpr" name="gdpr" required className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900" />
    <label htmlFor="gdpr" className="text-xs text-slate-400 leading-relaxed cursor-pointer hover:text-slate-300 transition-colors">{t.form.gdpr}</label>
    </div>

    <button
    type="submit"
    disabled={formStatus === 'loading' || formStatus === 'success'}
    className={`w-full font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 mt-4
      ${formStatus === 'success' ? 'bg-green-600 text-white focus:ring-green-600' :
        formStatus === 'error' ? 'bg-red-600 text-white focus:ring-red-600' :
          'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500'}`}
          >
          {formStatus === 'loading' ? (
            <span className="animate-pulse">{t.form.sending}</span>
          ) : formStatus === 'success' ? (
            <span>{t.form.success}</span>
          ) : formStatus === 'error' ? (
            <span>{t.form.error}</span>
          ) : (
            <><Send className="w-4 h-4" aria-hidden="true" /> {t.form.submit}</>
          )}
          </button>
          </form>
          </div>
          </div>
          </section>

          </main>

          <footer className="border-t border-slate-800/50 bg-slate-950 mt-12">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Guillaume Richard. {t.footer.rights}</p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" aria-hidden="true" /> Laval, France</span>
          <a href="mailto:guillaume.rwins@gmail.com" className="flex items-center gap-1 hover:text-emerald-500 transition-colors focus:outline-none focus:text-emerald-500"><Mail className="w-4 h-4" aria-hidden="true" /> guillaume.rwins@gmail.com</a>
          <button onClick={() => setShowLegal(true)} className="hover:text-emerald-500 underline underline-offset-2 transition-colors focus:outline-none focus:text-emerald-500">{t.footer.legal}</button>
          </div>
          </div>
          </footer>
          </div>
  );
}

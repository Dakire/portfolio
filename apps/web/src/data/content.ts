// Contenu du site (calqué sur le CV). Toute modification de texte se fait ici.
// Les textes des pages « confidentialité » et « accessibilité » sont dans pages.ts.
import type { Lang } from '../lib/i18n';
import { PROFILE_TEXT, type ProfileText } from './profile';

export type { Experience, Project, Skill, SkillId } from './profile';

export interface Portfolio extends ProfileText {
  meta: { title: string; description: string };
  ui: Record<string, string>;
  blog: Record<
    | 'title'
    | 'intro'
    | 'all'
    | 'min'
    | 'pageIntro'
    | 'pageDescription'
    | 'siteName'
    | 'home'
    | 'by'
    | 'related'
    | 'toc'
    | 'tocLabel'
    | 'crumbLabel'
    | 'tableLabel'
    | 'dateLocale'
    | 'otherLang'
    | 'emptyTitle'
    | 'emptyText',
    string
  >;
  tools: { title: string; intro: string; all: string };
  nav: Record<
    | 'about'
    | 'career'
    | 'skills'
    | 'experience'
    | 'projects'
    | 'resources'
    | 'contact'
    | 'blog'
    | 'tools'
    | 'cheatsheets',
    string
  >;
  contactTitle: string;
  form: Record<
    | 'name'
    | 'email'
    | 'message'
    | 'gdpr'
    | 'submit'
    | 'sending'
    | 'success'
    | 'error'
    | 'captcha'
    | 'captchaLabel'
    | 'captchaUnavailable'
    | 'rateLimited'
    | 'network'
    | 'fallback'
    | 'requiredNote'
    | 'errName'
    | 'errEmail'
    | 'errMessage'
    | 'errGdpr'
    | 'sendAnother'
    | 'retryCaptcha'
    | 'captchaLoading',
    string
  >;
  footer: { legal: string; rights: string };
  legal: { title: string; sections: { h: string; p: string }[] };
}

export const PROFILE = {
  name: 'Guillaume Richard',
  email: 'contact@grichard.eu',
  location: 'France',
  linkedin: 'https://www.linkedin.com/in/guillaume-richard-in',
  github: 'https://github.com/Dakire',
};

const BASE_DATA: Record<Lang, Omit<Portfolio, keyof ProfileText>> = {
  fr: {
    meta: {
      title: 'Guillaume Richard | Technicien IT, réseau et sécurité',
      description:
        'Portfolio de Guillaume Richard, technicien informatique : réseau, sécurité (Stormshield), Microsoft 365, Google Workspace, DNS et formation IA et RGPD.',
    },
    ui: {
      skip: 'Aller au contenu principal',
      home: "Retour à l'accueil",
      menu: 'Menu principal',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      switchLang: 'Read this site in English',
      linkedin: 'Profil LinkedIn (nouvelle fenêtre)',
      github: 'Profil GitHub (nouvelle fenêtre)',
      projectOpen: 'voir sur GitHub (nouvelle fenêtre)',
      cvOpen: 'PDF, nouvelle fenêtre',
      languages: 'Langues',
      back: 'Retour au portfolio',
      cookies: 'Gérer les cookies',
      repos: 'Voir tous mes dépôts GitHub',
      tags: 'Technologies utilisées',
      theme: 'Thème clair',
      mobile: 'mobile',
      search: 'Rechercher ou lancer une commande (Ctrl + K)',
      logo: 'GR_PORTFOLIO',
      langName: 'English',
    },
    blog: {
      title: 'Derniers articles',
      intro: "Notes techniques sur la messagerie, le DNS et l'administration cloud.",
      all: 'Tous les articles',
      min: 'min de lecture',
      pageIntro:
        'Des notes techniques écrites au fil de mon travail : messagerie, DNS, administration Microsoft 365 / Google Workspace et poste de travail.',
      pageDescription:
        'Notes techniques sur la messagerie (SPF, DKIM, DMARC), le DNS, les migrations Microsoft 365 / Google Workspace et le poste de travail.',
      siteName: 'Blog de Guillaume Richard',
      home: 'Accueil',
      by: 'Par',
      related: 'À lire aussi',
      toc: 'Sommaire',
      tocLabel: "Sommaire de l'article",
      crumbLabel: "Fil d'Ariane",
      tableLabel: 'Tableau (défilement horizontal)',
      dateLocale: 'fr-FR',
      otherLang: 'Read this article in English',
      emptyTitle: 'Les premiers articles arrivent',
      emptyText: "Les notes techniques seront publiées ici dès qu'elles sont prêtes.",
    },
    tools: {
      title: 'Outils',
      intro:
        "Des outils gratuits, nés de problèmes que j'ai rencontrés en support : diagnostic DNS et e-mail, audit SEO et sitemap, calendriers ICS, réseau, encodage, JSON, mots de passe, conversions. Ils sont à vous, sans inscription.",
      all: 'Tous les outils',
    },
    nav: {
      about: 'À propos',
      career: 'Parcours',
      skills: 'Compétences',
      experience: 'Parcours',
      projects: 'Réalisations',
      resources: 'Ressources',
      contact: 'Contact',
      blog: 'Blog',
      tools: 'Outils',
      cheatsheets: 'Cheatsheets',
    },
    contactTitle: 'Me contacter',
    form: {
      name: 'Votre nom complet',
      email: 'Votre adresse email',
      message: 'Votre message',
      gdpr: "J'accepte que mes données soient utilisées pour me recontacter.",
      submit: 'Envoyer le message',
      sending: 'Envoi en cours...',
      success: 'Message envoyé avec succès !',
      error: 'Erreur technique. Veuillez réessayer.',
      captcha: "Veuillez valider la vérification anti-robot avant l'envoi.",
      captchaLabel: 'Vérification anti-robot',
      captchaUnavailable:
        "La vérification anti-robot n'a pas pu se charger. Rechargez la page ou écrivez-moi directement par e-mail.",
      rateLimited:
        'Trop de messages pour le moment. Réessayez plus tard ou écrivez-moi directement par e-mail.',
      network: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
      fallback: `Le formulaire est indisponible. Écrivez-moi à ${PROFILE.email}.`,
      requiredNote: "Les champs marqués d'un * sont obligatoires.",
      errName: 'Indiquez votre nom.',
      errEmail: 'Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.',
      errMessage: 'Écrivez votre message.',
      errGdpr: 'Veuillez accepter pour que je puisse vous répondre.',
      sendAnother: 'Envoyer un autre message',
      retryCaptcha: 'Recharger la vérification',
      captchaLoading: 'Chargement de la vérification anti-robot…',
    },
    footer: { legal: 'Mentions Légales', rights: 'Tous droits réservés.' },
    legal: {
      title: 'Mentions Légales',
      sections: [
        {
          h: '1. Éditeur du site',
          p: 'Ce site est édité par Guillaume Richard, un particulier. Résidant en France. Contact : contact@grichard.eu',
        },
        {
          h: '2. Hébergement',
          p: 'Ce site est hébergé par OVH SAS. Adresse : 2 rue Kellermann - 59100 Roubaix - France. Site web : www.ovh.com',
        },
        {
          h: '3. Propriété intellectuelle',
          p: "L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.",
        },
        {
          h: '4. Données personnelles (RGPD)',
          p: "Les informations recueillies via le formulaire de contact (Nom, Email, Message) sont uniquement destinées à vous répondre. Elles ne sont stockées dans aucune base de données et ne sont jamais cédées à des tiers. Pour limiter les abus, une empreinte non réversible de votre adresse IP est conservée au plus une heure dans un fichier temporaire du serveur, uniquement pour plafonner le nombre d'envois. Le formulaire est protégé par Cloudflare Turnstile (Cloudflare, Inc., société américaine), qui vérifie que le visiteur est humain sans cookie publicitaire. Conformément à la loi « Informatique et Libertés » et au RGPD, vous disposez d'un droit d'accès, de rectification et d'effacement de vos données en me contactant par email.",
        },
        {
          h: "5. Cookies et mesure d'audience",
          p: "Ce site ne dépose aucun cookie publicitaire. Une mesure d'audience (Google Analytics 4, Google Ireland Ltd / Google LLC) n'est activée qu'après votre consentement, recueilli par le bandeau affiché à votre première visite. Elle dépose les cookies _ga et _ga_* (durée maximale de 13 mois) pour compter les visites. Votre choix est conservé 6 mois dans le stockage local de votre navigateur ; vous pouvez le modifier ou retirer votre consentement à tout moment via le lien « Gérer les cookies » en bas de page. Sans consentement, aucune donnée n'est envoyée à Google.",
        },
      ],
    },
  },
  en: {
    meta: {
      title: 'Guillaume Richard | IT & Digital Systems Technician',
      description:
        'Portfolio of Guillaume Richard, IT technician: networks, security (Stormshield), Microsoft 365, Google Workspace, DNS, AI and GDPR training.',
    },
    ui: {
      skip: 'Skip to main content',
      home: 'Back to top',
      menu: 'Main menu',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      switchLang: 'Lire ce site en français',
      linkedin: 'LinkedIn profile (opens in a new window)',
      github: 'GitHub profile (opens in a new window)',
      projectOpen: 'view on GitHub (opens in a new window)',
      cvOpen: 'PDF, opens in a new window',
      languages: 'Languages',
      back: 'Back to portfolio',
      cookies: 'Cookie settings',
      repos: 'See all my GitHub repositories',
      tags: 'Technologies used',
      theme: 'Light theme',
      mobile: 'mobile',
      search: 'Search or run a command (Ctrl + K)',
      logo: 'GR_PORTFOLIO',
      langName: 'Français',
    },
    blog: {
      title: 'Latest articles',
      intro: 'Technical notes on email, DNS and cloud administration.',
      all: 'All articles',
      min: 'min read',
      pageIntro:
        'Technical notes written along the way: email, DNS, Microsoft 365 / Google Workspace administration and the workstation.',
      pageDescription:
        'Technical notes on email (SPF, DKIM, DMARC), DNS, Microsoft 365 / Google Workspace migrations and the workstation.',
      siteName: "Guillaume Richard's blog",
      home: 'Home',
      by: 'By',
      related: 'Further reading',
      toc: 'Contents',
      tocLabel: 'Article contents',
      crumbLabel: 'Breadcrumb',
      tableLabel: 'Table (scrolls horizontally)',
      dateLocale: 'en-GB',
      otherLang: 'Lire cet article en français',
      emptyTitle: 'The first articles are on their way',
      emptyText: 'Technical notes will be published here as soon as they are ready.',
    },
    tools: {
      title: 'Tools',
      intro:
        'Free tools, born from problems I ran into while doing support: DNS and email diagnosis, SEO and sitemap audit, ICS calendars, networking, encoding, JSON, passwords, conversions. They are yours to use, no sign-up.',
      all: 'All tools',
    },
    nav: {
      about: 'About',
      career: 'Career',
      skills: 'Skills',
      experience: 'Career',
      projects: 'Projects',
      resources: 'Resources',
      contact: 'Contact',
      blog: 'Blog',
      tools: 'Tools',
      cheatsheets: 'Cheatsheets',
    },
    contactTitle: 'Get in touch',
    form: {
      name: 'Full Name',
      email: 'Email Address',
      message: 'Your message',
      gdpr: 'I agree that my data may be used to contact me.',
      submit: 'Send Message',
      sending: 'Sending...',
      success: 'Message sent successfully!',
      error: 'Technical error. Please try again.',
      captcha: 'Please complete the anti-bot check before sending.',
      captchaLabel: 'Anti-bot check',
      captchaUnavailable:
        'The anti-bot check could not load. Reload the page or email me directly.',
      rateLimited: 'Too many messages right now. Please try again later or email me directly.',
      network: 'Connection failed. Check your network and try again.',
      fallback: `The form is unavailable. Email me at ${PROFILE.email}.`,
      requiredNote: 'Fields marked with * are required.',
      errName: 'Please enter your name.',
      errEmail: 'Please enter a valid email address, for example name@example.com.',
      errMessage: 'Please write your message.',
      errGdpr: 'Please accept so that I can reply to you.',
      sendAnother: 'Send another message',
      retryCaptcha: 'Reload the check',
      captchaLoading: 'Loading the anti-bot check…',
    },
    footer: { legal: 'Legal Notice', rights: 'All rights reserved.' },
    legal: {
      title: 'Legal Notice',
      sections: [
        {
          h: '1. Publisher',
          p: 'This website is published by Guillaume Richard, a private individual, residing in France. Contact: contact@grichard.eu',
        },
        {
          h: '2. Hosting',
          p: 'This website is hosted by OVH SAS, 2 rue Kellermann - 59100 Roubaix - France. Website: www.ovh.com',
        },
        {
          h: '3. Intellectual property',
          p: 'This website is protected by French and international copyright and intellectual property laws. All reproduction rights are reserved.',
        },
        {
          h: '4. Personal data (GDPR)',
          p: 'Information collected through the contact form (name, email, message) is used solely to reply to you. It is not stored in any database and is never shared with third parties. To limit abuse, a non-reversible hash of your IP address is kept for at most one hour in a temporary server file, solely to cap the number of submissions. The form is protected by Cloudflare Turnstile (Cloudflare, Inc., a US company), which checks that the visitor is human without advertising cookies. Under French data protection law and the GDPR, you have the right to access, rectify and erase your data by contacting me by email.',
        },
        {
          h: '5. Cookies and analytics',
          p: 'This website sets no advertising cookies. Audience measurement (Google Analytics 4, Google Ireland Ltd / Google LLC) is enabled only after you give consent through the banner shown on your first visit. It sets the _ga and _ga_* cookies (13 months maximum) to count visits. Your choice is kept for 6 months in your browser\'s local storage; you can change it or withdraw consent at any time with the "Cookie settings" link at the bottom of the page. Without consent, no data is sent to Google.',
        },
      ],
    },
  },
};

export const PORTFOLIO_DATA: Record<Lang, Portfolio> = {
  fr: { ...BASE_DATA.fr, ...PROFILE_TEXT.fr },
  en: { ...BASE_DATA.en, ...PROFILE_TEXT.en },
};

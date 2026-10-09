// Textes des pages « Confidentialité » et « Accessibilité ». Les mentions légales sont dans content.ts (legal).
// À tenir à jour si le traitement des données ou l'état d'accessibilité change (formulaire, mesure d'audience, outils).
import type { Lang } from '../lib/i18n';

export interface InfoSection {
  id: string;
  h: string;
  p: string[];
  items?: string[];
}
export interface InfoPage {
  title: string;
  description: string;
  intro: string;
  updated: string;
  updatedLabel: string;
  sections: InfoSection[];
}

export const PRIVACY: Record<Lang, InfoPage> = {
  fr: {
    title: 'Politique de confidentialité',
    description:
      'Quelles données ce site collecte, pourquoi, combien de temps, et comment exercer vos droits.',
    intro:
      'Ce site collecte le strict minimum. Voici, point par point, ce qui est traité, pourquoi, et ce que vous pouvez faire.',
    updated: '8 octobre 2026',
    updatedLabel: 'Dernière mise à jour',
    sections: [
      {
        id: 'responsable',
        h: 'Responsable du traitement',
        p: [
          'Guillaume Richard, particulier, Laval (53000), France. Contact : contact@grichard.eu.',
        ],
      },
      {
        id: 'formulaire',
        h: 'Formulaire de contact',
        p: [
          'Le formulaire collecte votre nom, votre adresse e-mail et votre message, uniquement pour vous répondre (base légale : votre demande de contact). Ces informations ne sont stockées dans aucune base de données du site : elles arrivent dans la messagerie du site et y sont conservées le temps nécessaire au traitement de votre demande. Elles ne sont jamais cédées à des tiers.',
        ],
      },
      {
        id: 'antispam',
        h: 'Protection contre les abus',
        p: [
          "Le formulaire est protégé par Cloudflare Turnstile (Cloudflare, Inc., société américaine), qui vérifie que le visiteur est humain sans cookie publicitaire. Pour plafonner le nombre d'envois, une empreinte non réversible de votre adresse IP est conservée au plus une heure dans un fichier temporaire du serveur.",
        ],
      },
      {
        id: 'cookies',
        h: "Cookies et mesure d'audience",
        p: [
          "Ce site ne dépose aucun cookie publicitaire. La mesure d'audience (Google Analytics 4, Google Ireland Ltd / Google LLC) n'est activée qu'après votre consentement, recueilli par le bandeau affiché à votre première visite. Elle dépose les cookies _ga et _ga_* (durée maximale de 13 mois) pour compter les visites ; les usages publicitaires sont désactivés.",
          "Votre choix est conservé 6 mois dans le stockage local de votre navigateur. Vous pouvez le modifier ou retirer votre consentement à tout moment avec le lien « Gérer les cookies » en bas de chaque page. Sans consentement, aucune donnée n'est envoyée à Google.",
        ],
      },
      {
        id: 'outils',
        h: 'Outils en ligne',
        p: [
          "Les outils qui traitent du texte ou des fichiers (JSON, ICS, encodage, mots de passe, calculs réseau…) s'exécutent entièrement dans votre navigateur : ce que vous saisissez n'est pas envoyé au site. Les outils DNS interrogent directement, depuis votre navigateur, des résolveurs DNS publics (par exemple Cloudflare, Google, Quad9) : ces services voient le nom de domaine demandé et votre adresse IP, selon leurs propres politiques. Le site ne relaie ni ne stocke ces requêtes.",
          "Le rapport SEO fonctionne différemment : l'adresse que vous saisissez est envoyée au site, qui interroge la page indiquée (avec son robots.txt et un échantillon de ses liens) puis vous renvoie le rapport. Ni l'adresse, ni la page, ni le rapport ne sont conservés ou journalisés. Comme pour le formulaire, l'analyse est protégée par Cloudflare Turnstile, une empreinte non réversible de votre adresse IP est conservée au plus une heure pour limiter le nombre d'analyses, et un cookie technique strictement nécessaire (__Host-grtools, jeton anti-falsification de requête, sans durée de vie au-delà de la session) est déposé.",
        ],
      },
      {
        id: 'hebergeur',
        h: 'Hébergeur',
        p: [
          "Le site est hébergé par OVH SAS (Roubaix, France). L'hébergeur peut conserver des journaux techniques d'accès (adresse IP, date, page demandée) selon ses propres conditions, pour la sécurité et le bon fonctionnement du service.",
        ],
      },
      {
        id: 'droits',
        h: 'Vos droits',
        p: [
          "Conformément au RGPD et à la loi « Informatique et Libertés », vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité de vos données. Pour les exercer, écrivez à contact@grichard.eu. Si vous estimez, après m'avoir contacté, que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).",
        ],
      },
    ],
  },
  en: {
    title: 'Privacy policy',
    description:
      'What data this site collects, why, for how long, and how to exercise your rights.',
    intro:
      'This site collects the bare minimum. Here is, point by point, what is processed, why, and what you can do about it.',
    updated: '8 October 2026',
    updatedLabel: 'Last updated',
    sections: [
      {
        id: 'controller',
        h: 'Data controller',
        p: [
          'Guillaume Richard, private individual, Laval (53000), France. Contact: contact@grichard.eu.',
        ],
      },
      {
        id: 'form',
        h: 'Contact form',
        p: [
          'The form collects your name, email address and message, only to reply to you (legal basis: your request to be contacted). This information is not stored in any database of the site: it arrives in the site mailbox and is kept there for as long as needed to handle your request. It is never shared with third parties.',
        ],
      },
      {
        id: 'antispam',
        h: 'Abuse protection',
        p: [
          'The form is protected by Cloudflare Turnstile (Cloudflare, Inc., a US company), which checks that the visitor is human without advertising cookies. To cap the number of submissions, a non-reversible hash of your IP address is kept for at most one hour in a temporary server file.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies and analytics',
        p: [
          'This site sets no advertising cookies. Audience measurement (Google Analytics 4, Google Ireland Ltd / Google LLC) is enabled only after you give consent through the banner shown on your first visit. It sets the _ga and _ga_* cookies (13 months maximum) to count visits; advertising features are disabled.',
          'Your choice is kept for 6 months in your browser\'s local storage. You can change it or withdraw consent at any time with the "Cookie settings" link at the bottom of every page. Without consent, no data is sent to Google.',
        ],
      },
      {
        id: 'tools',
        h: 'Online tools',
        p: [
          'Tools that process text or files (JSON, ICS, encoding, passwords, network calculations…) run entirely in your browser: what you type is not sent to the site. The DNS tools query public DNS resolvers (for example Cloudflare, Google, Quad9) directly from your browser: those services see the requested domain name and your IP address, under their own policies. The site neither relays nor stores these queries.',
          'The SEO report works differently: the address you enter is sent to the site, which fetches that page (with its robots.txt and a sample of its links) and returns the report. Neither the address, the page nor the report is kept or logged. As with the form, the analysis is protected by Cloudflare Turnstile, a non-reversible hash of your IP address is kept for at most one hour to cap the number of analyses, and a strictly necessary technical cookie (__Host-grtools, an anti-request-forgery token that does not outlive the session) is set.',
        ],
      },
      {
        id: 'hosting',
        h: 'Hosting provider',
        p: [
          'The site is hosted by OVH SAS (Roubaix, France). The host may keep technical access logs (IP address, date, requested page) under its own terms, for security and proper operation of the service.',
        ],
      },
      {
        id: 'rights',
        h: 'Your rights',
        p: [
          'Under the GDPR and French data protection law, you have the right to access, rectify, erase, object to, restrict and port your data. To exercise them, write to contact@grichard.eu. If, after contacting me, you believe your rights are not being respected, you may lodge a complaint with the CNIL (cnil.fr).',
        ],
      },
    ],
  },
};

export const ACCESSIBILITY: Record<Lang, InfoPage> = {
  fr: {
    title: "Déclaration d'accessibilité",
    description:
      "Objectif d'accessibilité de ce site (WCAG 2.2 niveau AA), mesures en place, limites connues et moyen de signaler un problème.",
    intro:
      "Je vise l'accessibilité du site à tous, quel que soit le handicap ou le matériel utilisé. Voici l'état réel, sans enjolivement.",
    updated: '8 octobre 2026',
    updatedLabel: 'Dernière mise à jour',
    sections: [
      {
        id: 'objectif',
        h: 'Objectif et état de conformité',
        p: [
          "L'objectif est la conformité aux Web Content Accessibility Guidelines (WCAG) 2.2, niveau AA. Ce site personnel n'est pas soumis à l'obligation légale du RGAA ; l'état de conformité est une auto-évaluation : il n'a pas fait l'objet d'un audit externe.",
        ],
      },
      {
        id: 'mesures',
        h: 'Mesures en place',
        p: [
          'Ces points sont contrôlés automatiquement à chaque modification (outil axe, dans les thèmes clair et sombre) ou par construction :',
        ],
        items: [
          'HTML sémantique : une seule page = un seul titre de niveau 1, repères (en-tête, navigation, contenu principal, pied de page), lien d’évitement vers le contenu.',
          'Navigation complète au clavier, focus toujours visible, zones cliquables d’au moins 44 px.',
          'Contrastes des textes (4,5:1 au minimum) et des bordures de champs (3:1) vérifiés automatiquement dans les deux thèmes.',
          'Thème clair, sombre ou automatique (réglage du système) ; texte redimensionnable ; respect de la préférence « réduire les animations ».',
          'Formulaires avec libellés, erreurs explicites reliées aux champs et messages annoncés aux lecteurs d’écran.',
          'Site lisible sans JavaScript (le contenu est généré à l’avance).',
        ],
      },
      {
        id: 'limites',
        h: 'Limites connues',
        p: [
          "Les tests manuels avec un lecteur d'écran (NVDA, VoiceOver) et au zoom 200 % suivent une checklist mais ne sont pas encore réalisés de façon systématique : des défauts non détectés par les outils automatiques sont possibles.",
          'Les CV au format PDF ne sont pas garantis accessibles ; le même contenu est disponible en pages web.',
          'Les articles et outils peuvent contenir des extraits de code ou des tableaux larges : ils défilent horizontalement et sont atteignables au clavier.',
        ],
      },
      {
        id: 'contact',
        h: 'Signaler un problème',
        p: [
          "Si vous rencontrez une difficulté, écrivez à contact@grichard.eu en indiquant la page concernée : je m'engage à répondre et à corriger dès que possible. Si la réponse ne vous satisfait pas, vous pouvez saisir le Défenseur des droits (defenseurdesdroits.fr).",
        ],
      },
    ],
  },
  en: {
    title: 'Accessibility statement',
    description:
      'Accessibility goal of this site (WCAG 2.2 level AA), measures in place, known limitations and how to report a problem.',
    intro:
      'I aim for a site everyone can use, whatever their disability or device. Here is the actual state, without embellishment.',
    updated: '8 October 2026',
    updatedLabel: 'Last updated',
    sections: [
      {
        id: 'goal',
        h: 'Goal and conformance status',
        p: [
          'The goal is conformance with the Web Content Accessibility Guidelines (WCAG) 2.2, level AA. This personal site is not subject to the legal requirement of the French RGAA; the conformance status is a self-assessment: it has not been audited externally.',
        ],
      },
      {
        id: 'measures',
        h: 'Measures in place',
        p: [
          'These points are checked automatically on every change (axe tool, in light and dark themes) or hold by construction:',
        ],
        items: [
          'Semantic HTML: one level-1 heading per page, landmarks (header, navigation, main content, footer), skip link to the content.',
          'Full keyboard navigation, focus always visible, click targets of at least 44 px.',
          'Text contrast (4.5:1 minimum) and form field borders (3:1) checked automatically in both themes.',
          'Light, dark or automatic theme (system setting); resizable text; respect for the "reduce motion" preference.',
          'Forms with labels, explicit errors tied to fields and messages announced to screen readers.',
          'Readable without JavaScript (content is generated ahead of time).',
        ],
      },
      {
        id: 'limits',
        h: 'Known limitations',
        p: [
          'Manual tests with a screen reader (NVDA, VoiceOver) and at 200% zoom follow a checklist but are not yet carried out systematically: defects missed by automatic tools are possible.',
          'The CVs in PDF format are not guaranteed to be accessible; the same content is available as web pages.',
          'Articles and tools may contain code excerpts or wide tables: they scroll horizontally and are reachable by keyboard.',
        ],
      },
      {
        id: 'contact',
        h: 'Report a problem',
        p: [
          'If you run into a difficulty, write to contact@grichard.eu mentioning the page concerned: I commit to replying and fixing it as soon as possible. If the answer does not satisfy you, you can contact the French Défenseur des droits (defenseurdesdroits.fr).',
        ],
      },
    ],
  },
};

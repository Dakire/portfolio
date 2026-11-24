// Produits de la vitrine (ADR 0017). Seuls ceux de l'ouverture (premier trimestre 2027) ont une page ; les autres sont suivis
// dans l'aperçu privé de l'espace client (apps/portal/src/Catalog). Tarifs proposés, à valider avant l'ouverture : rien n'est
// inventé au-delà de la description fournie pour chaque produit.
import type { Lang } from '../lib/i18n';

export type Billing = 'free' | 'once' | 'year' | 'month';

export interface Plan {
  name: string;
  /** Montant en euros ; 0 pour gratuit. */
  price: number;
  billing: Billing;
  /** Prix hors taxes (clients professionnels) ou toutes taxes comprises (particuliers). */
  tax: 'ht' | 'ttc';
  features: string[];
}

export interface ShopProduct {
  slug: string;
  name: string;
  /** Où le produit tourne. */
  platform: string;
  summary: string;
  audience: string;
  features: string[];
  requirements: string[];
  /** Ce que couvre la licence, en une phrase (le détail est sur la page Licence). */
  licence: string;
  plans: Plan[];
}

type Bilingual = Record<Lang, ShopProduct[]>;

export const PRODUCTS: Bilingual = {
  fr: [
    {
      slug: 'youtube-regarder-plus-tard',
      name: 'Trieur « À regarder plus tard »',
      platform: 'Extension Chrome',
      summary:
        'Trier, filtrer et nettoyer la playlist « À regarder plus tard » de YouTube, directement depuis la page de la playlist.',
      audience: 'Toute personne dont la playlist « À regarder plus tard » déborde.',
      features: [
        'Trier la playlist « À regarder plus tard »',
        'La filtrer pour retrouver une vidéo',
        'La nettoyer',
      ],
      requirements: [
        'Google Chrome ou un navigateur compatible (Edge, Brave)',
        'Un compte YouTube',
      ],
      licence: 'Licence personnelle : une personne, sur ses propres navigateurs.',
      plans: [
        {
          name: 'Gratuit',
          price: 0,
          billing: 'free',
          tax: 'ttc',
          features: ['Fonctions de base (périmètre à préciser)'],
        },
        {
          name: 'Pro',
          price: 9,
          billing: 'year',
          tax: 'ttc',
          features: ['Toutes les fonctions', 'Mises à jour incluses'],
        },
        {
          name: 'Pro à vie',
          price: 15,
          billing: 'once',
          tax: 'ttc',
          features: [
            'Comme Pro, payé une seule fois',
            'Mises à jour incluses tant que l’extension existe',
          ],
        },
      ],
    },
    {
      slug: 'prevenez-moi-rupture',
      name: 'Prévenez-moi au retour en stock',
      platform: 'Module PrestaShop',
      summary:
        'Un formulaire « Prévenez-moi » apparaît sur les produits et déclinaisons en rupture ; quand le stock revient, les inscrits reçoivent un e-mail.',
      audience: 'Boutiques PrestaShop qui perdent des ventes sur leurs ruptures de stock.',
      features: [
        'Formulaire « Prévenez-moi » sur les produits et déclinaisons en rupture',
        'E-mail aux inscrits quand le stock revient',
      ],
      requirements: ['Une boutique PrestaShop (versions compatibles : à préciser)'],
      licence:
        'Licence par boutique : une boutique en production, plus ses environnements de test et de développement.',
      plans: [
        {
          name: 'Licence',
          price: 39,
          billing: 'once',
          tax: 'ht',
          features: ['Module complet', 'Un an de mises à jour et de support'],
        },
        {
          name: 'Mises à jour',
          price: 15,
          billing: 'year',
          tax: 'ht',
          features: [
            'Prolonge les mises à jour et le support d’un an',
            'Facultatif : le module continue de fonctionner sans',
          ],
        },
      ],
    },
    {
      slug: 'standup-slack',
      name: 'Standup asynchrone pour Slack',
      platform: 'Application Slack',
      summary:
        'À l’heure choisie, chaque membre reçoit un message avec un bouton « Répondre » ; le bot publie ensuite un résumé consolidé dans le canal de l’équipe.',
      audience: 'Équipes réparties qui veulent un point quotidien sans réunion.',
      features: [
        'Message privé à chaque membre, à l’heure choisie, avec un bouton « Répondre »',
        'Résumé consolidé publié dans le canal de l’équipe',
        'Hébergé : rien à installer ni à administrer',
      ],
      requirements: ['Un espace de travail Slack', 'Droit d’y installer une application'],
      licence: 'Abonnement par espace de travail Slack.',
      plans: [
        {
          name: 'Gratuit',
          price: 0,
          billing: 'free',
          tax: 'ht',
          features: ['Jusqu’à 5 membres'],
        },
        {
          name: 'Équipe',
          price: 19,
          billing: 'month',
          tax: 'ht',
          features: ['Membres illimités', 'Ou 190 € HT par an (deux mois offerts)'],
        },
      ],
    },
  ],
  en: [
    {
      slug: 'youtube-regarder-plus-tard',
      name: 'Watch Later sorter',
      platform: 'Chrome extension',
      summary:
        'Sort, filter and clean up your YouTube “Watch later” playlist, right from the playlist page.',
      audience: 'Anyone whose “Watch later” playlist is overflowing.',
      features: ['Sort the “Watch later” playlist', 'Filter it to find a video', 'Clean it up'],
      requirements: ['Google Chrome or a compatible browser (Edge, Brave)', 'A YouTube account'],
      licence: 'Personal licence: one person, on their own browsers.',
      plans: [
        {
          name: 'Free',
          price: 0,
          billing: 'free',
          tax: 'ttc',
          features: ['Basic features (scope to be confirmed)'],
        },
        {
          name: 'Pro',
          price: 9,
          billing: 'year',
          tax: 'ttc',
          features: ['Every feature', 'Updates included'],
        },
        {
          name: 'Pro lifetime',
          price: 15,
          billing: 'once',
          tax: 'ttc',
          features: [
            'Same as Pro, paid once',
            'Updates included for as long as the extension exists',
          ],
        },
      ],
    },
    {
      slug: 'prevenez-moi-rupture',
      name: 'Back-in-stock alerts',
      platform: 'PrestaShop module',
      summary:
        'A “Notify me” form appears on out-of-stock products and combinations; when stock comes back, subscribers get an email.',
      audience: 'PrestaShop stores that lose sales on out-of-stock items.',
      features: [
        '“Notify me” form on out-of-stock products and combinations',
        'Email to subscribers when stock comes back',
      ],
      requirements: ['A PrestaShop store (supported versions: to be confirmed)'],
      licence:
        'Per-store licence: one production store, plus its test and development environments.',
      plans: [
        {
          name: 'Licence',
          price: 39,
          billing: 'once',
          tax: 'ht',
          features: ['Full module', 'One year of updates and support'],
        },
        {
          name: 'Updates',
          price: 15,
          billing: 'year',
          tax: 'ht',
          features: [
            'Extends updates and support by one year',
            'Optional: the module keeps working without it',
          ],
        },
      ],
    },
    {
      slug: 'standup-slack',
      name: 'Async standup for Slack',
      platform: 'Slack app',
      summary:
        'At the chosen time, each member gets a message with a “Reply” button; the bot then posts a consolidated summary to the team channel.',
      audience: 'Distributed teams who want a daily check-in without a meeting.',
      features: [
        'Direct message to each member at the chosen time, with a “Reply” button',
        'Consolidated summary posted to the team channel',
        'Hosted: nothing to install or maintain',
      ],
      requirements: ['A Slack workspace', 'Permission to install an app in it'],
      licence: 'Subscription per Slack workspace.',
      plans: [
        { name: 'Free', price: 0, billing: 'free', tax: 'ht', features: ['Up to 5 members'] },
        {
          name: 'Team',
          price: 19,
          billing: 'month',
          tax: 'ht',
          features: ['Unlimited members', 'Or €190 excl. VAT per year (two months free)'],
        },
      ],
    },
  ],
};

/** Prix affiché : « Gratuit », « 39 € HT », « 9 € TTC / an »… */
export function formatPrice(lang: Lang, plan: Plan): string {
  if (plan.billing === 'free') return lang === 'fr' ? 'Gratuit' : 'Free';
  const amount = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
  }).format(plan.price);
  const tax =
    plan.tax === 'ht'
      ? lang === 'fr'
        ? ' HT'
        : ' excl. VAT'
      : lang === 'fr'
        ? ' TTC'
        : ' incl. VAT';
  const per = {
    once: lang === 'fr' ? ', une fois' : ', one-off',
    year: lang === 'fr' ? ' / an' : ' / year',
    month: lang === 'fr' ? ' / mois' : ' / month',
  }[plan.billing];
  return `${amount}${tax}${per}`;
}

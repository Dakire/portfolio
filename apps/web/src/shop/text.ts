// Libellés de structure de la boutique (FR et EN, mêmes clés : parité vérifiée par le typage).
import type { Lang } from '../lib/i18n';

const fr = {
  title: 'Boutique',
  description:
    'Modules PrestaShop, extensions Chrome et applications Slack de Guillaume Richard : fonctions, tarifs, licences et conditions de vente.',
  lead: 'Des modules, extensions et applications pour gagner du temps au quotidien : tarifs clairs, remboursement sans condition sous 30 jours.',
  notOpenTitle: 'Bientôt disponible',
  notOpen: 'La boutique ouvre au premier trimestre 2027 : rien n’est encore en vente.',
  provisional: 'Descriptions, tarifs et conditions sont provisoires.',
  draftTitle: 'Version de travail',
  products: 'Produits',
  pricing: 'Tarifs',
  pricingNote: 'prix en euros',
  pricingCaption: 'Tarifs de chaque produit, par formule',
  product: 'Produit',
  plan: 'Formule',
  price: 'Prix',
  conditions: 'Conditions',
  legalMeta: { terms: 'cgv', refunds: '30 jours', license: 'utilisation' },
  questions: 'Une question avant d’acheter ?',
  contact: 'Écrivez-moi.',
  features: 'Ce que fait le produit',
  audience: 'Pour qui',
  requirements: 'Prérequis',
  licence: 'Licence',
  licenceLink: 'Lire la licence.',
  plans: 'Formules',
  termsLine:
    'Vendu par Paddle, revendeur et Merchant of Record. Remboursement sans condition sous 30 jours.',
  termsLink: 'Conditions de vente',
  refundsLink: 'Remboursement',
  back: '← Tous les produits',
};

type ShopText = typeof fr;

const en: ShopText = {
  title: 'Shop',
  description:
    'PrestaShop modules, Chrome extensions and Slack apps by Guillaume Richard: features, pricing, licences and terms of sale.',
  lead: 'Modules, extensions and apps that save time every day: clear pricing, no-questions-asked refund within 30 days.',
  notOpenTitle: 'Coming soon',
  notOpen: 'The shop opens in the first quarter of 2027: nothing is on sale yet.',
  provisional: 'Descriptions, pricing and terms are provisional.',
  draftTitle: 'Working draft',
  products: 'Products',
  pricing: 'Pricing',
  pricingNote: 'prices in euros',
  pricingCaption: 'Pricing of each product, by plan',
  product: 'Product',
  plan: 'Plan',
  price: 'Price',
  conditions: 'Terms',
  legalMeta: { terms: 'terms', refunds: '30 days', license: 'usage' },
  questions: 'A question before buying?',
  contact: 'Write to me.',
  features: 'What it does',
  audience: 'Who it is for',
  requirements: 'Requirements',
  licence: 'Licence',
  licenceLink: 'Read the licence.',
  plans: 'Plans',
  termsLine:
    'Sold by Paddle, reseller and Merchant of Record. No-questions-asked refund within 30 days.',
  termsLink: 'Terms of sale',
  refundsLink: 'Refunds',
  back: '← All products',
};

export const SHOP_TEXT: Record<Lang, ShopText> = { fr, en };

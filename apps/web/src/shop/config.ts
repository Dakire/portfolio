// Boutique (ADR 0017, docs/boutique.md) : vitrine statique, sans achat possible avant l'ouverture.
//
// SHOP_OPEN = false (aujourd'hui) : pages publiées mais masquées — noindex, hors sitemap (EXCLUDED d'astro.config.mjs), hors
// menu, hors recherche, hors llms.txt — et aucun bouton d'achat. À l'ouverture : passer à true, retirer les préfixes de
// EXCLUDED, ajouter le lien au menu, et renseigner PADDLE (jeton client et identifiants de prix).
import { withBase } from '../lib/base';
import type { Lang } from '../lib/i18n';

export const SHOP_OPEN = false;

/** Préfixes d'URL de la boutique (aussi listés dans EXCLUDED d'astro.config.mjs tant que la boutique est fermée). */
export const SHOP_PREFIX: Record<Lang, string> = { fr: '/boutique/', en: '/en/shop/' };

export type ShopPage = 'hub' | 'terms' | 'refunds' | 'license';

const RAW: Record<Lang, Record<ShopPage, string>> = {
  fr: {
    hub: '/boutique/',
    terms: '/boutique/cgv/',
    refunds: '/boutique/remboursement/',
    license: '/boutique/licence/',
  },
  en: {
    hub: '/en/shop/',
    terms: '/en/shop/terms/',
    refunds: '/en/shop/refunds/',
    license: '/en/shop/license/',
  },
};

export const SHOP_ROUTES: Record<Lang, Record<ShopPage, string>> = {
  fr: Object.fromEntries(Object.entries(RAW.fr).map(([k, v]) => [k, withBase(v)])) as Record<
    ShopPage,
    string
  >,
  en: Object.fromEntries(Object.entries(RAW.en).map(([k, v]) => [k, withBase(v)])) as Record<
    ShopPage,
    string
  >,
};

/** Page d'un produit ; le slug est le même dans les deux langues (comme les réalisations). */
export const productPath = (lang: Lang, slug: string) => `${SHOP_ROUTES[lang].hub}${slug}/`;

export const shopAlternates = (page: ShopPage) => ({
  fr: SHOP_ROUTES.fr[page],
  en: SHOP_ROUTES.en[page],
});

/** Espace client (portail Symfony) : comptes, licences, téléchargements. */
export const PORTAL_URL = '/espace/';

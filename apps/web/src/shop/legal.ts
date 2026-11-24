// Conditions de la boutique (ADR 0017) : CGV, remboursement, licence d'utilisation, en français et en anglais.
// VERSION DE TRAVAIL : à relire avant l'ouverture. Rédigées pour répondre aux exigences de revue de Paddle (Paddle nommé comme
// Merchant of Record, nom légal du vendeur, remboursement sans condition d'au moins 14 jours, ici 30). Le numéro SIRET sera
// ajouté à l'immatriculation (docs/boutique.md) : ne pas en écrire un provisoire.
import type { Lang } from '../lib/i18n';
import type { ShopPage } from './config';

export interface LegalSection {
  h: string;
  p: string[];
  items?: string[];
}
export interface LegalPage {
  title: string;
  description: string;
  lead: string;
  sections: LegalSection[];
}

type LegalKey = Exclude<ShopPage, 'hub'>;

export const DRAFT_NOTICE: Record<Lang, string> = {
  fr: 'Version de travail : la boutique n’est pas encore ouverte et ces conditions peuvent changer avant l’ouverture.',
  en: 'Working draft: the shop is not open yet and these terms may change before it opens.',
};

export const SHOP_LEGAL: Record<Lang, Record<LegalKey, LegalPage>> = {
  fr: {
    terms: {
      title: 'Conditions générales de vente',
      description:
        'Conditions générales de vente des modules, extensions et services de Guillaume Richard, vendus par Paddle, revendeur et Merchant of Record.',
      lead: 'Ce qui s’applique quand vous achetez un module, une extension ou un abonnement sur cette boutique.',
      sections: [
        {
          h: 'Éditeur et vendeur',
          p: [
            'Les produits présentés dans cette boutique sont conçus et édités par Guillaume Richard, entrepreneur individuel établi en France. Son numéro SIRET sera indiqué ici dès son immatriculation.',
            'Les commandes sont traitées par notre revendeur en ligne Paddle.com. Paddle.com est le Merchant of Record de toutes nos commandes : c’est lui qui vous vend le produit, encaisse le paiement, applique la TVA de votre pays et vous adresse la facture. Paddle traite les demandes liées à la commande et au paiement, et gère les remboursements.',
          ],
        },
        {
          h: 'Produits',
          p: [
            'Chaque fiche produit décrit ce que fait le produit, sa plateforme, les prérequis et les formules disponibles. Les conditions d’utilisation de chaque produit sont précisées dans la licence d’utilisation.',
          ],
        },
        {
          h: 'Prix',
          p: [
            'Les prix des produits destinés aux particuliers sont affichés toutes taxes comprises ; ceux destinés aux professionnels, hors taxes. Le montant exact, TVA de votre pays comprise, est calculé et affiché par Paddle avant le paiement.',
          ],
        },
        {
          h: 'Commande et paiement',
          p: [
            'Le paiement se fait sur la page de paiement sécurisée de Paddle, par les moyens qu’elle propose. Aucune donnée de carte bancaire ne transite par ce site.',
          ],
        },
        {
          h: 'Livraison',
          p: [
            'Les produits sont livrés immédiatement après le paiement : clé de licence ou accès, envoyés par e-mail et disponibles dans votre espace client, avec les fichiers à télécharger le cas échéant.',
          ],
        },
        {
          h: 'Abonnements',
          p: [
            'Un abonnement se renouvelle automatiquement à la fin de chaque période (mois ou année) jusqu’à sa résiliation. Vous pouvez le résilier à tout moment, sans frais, depuis le lien de gestion envoyé par Paddle ou depuis votre espace client ; la résiliation prend effet à la fin de la période déjà payée.',
            'Pour un abonnement annuel, un rappel vous est envoyé avant chaque renouvellement.',
          ],
        },
        {
          h: 'Remboursement',
          p: [
            'Tout achat peut être remboursé dans les 30 jours, sans condition ni justification : voir la politique de remboursement. Cette garantie s’ajoute à vos droits légaux.',
          ],
        },
        {
          h: 'Mises à jour et assistance',
          p: [
            'La durée des mises à jour et de l’assistance dépend de la formule achetée et figure sur la fiche du produit. L’assistance se fait par e-mail, via la page de contact.',
          ],
        },
        {
          h: 'Garanties et responsabilité',
          p: [
            'Les produits bénéficient de la garantie légale de conformité des contenus et services numériques prévue par le Code de la consommation pour les acheteurs particuliers. En dehors de ces garanties légales, la responsabilité de l’éditeur est limitée au montant payé pour le produit concerné.',
          ],
        },
        {
          h: 'Données personnelles',
          p: [
            'Paddle traite les données nécessaires au paiement et à la facturation selon sa propre politique de confidentialité. Ce site conserve seulement ce qui sert à fournir le produit : adresse e-mail, licences, téléchargements. Le détail figure dans la politique de confidentialité du site.',
          ],
        },
        {
          h: 'Droit applicable',
          p: [
            'Ces conditions sont soumises au droit français. En cas de difficulté, contactez-nous d’abord : la plupart des questions se règlent par un simple e-mail.',
          ],
        },
      ],
    },
    refunds: {
      title: 'Politique de remboursement',
      description:
        'Remboursement sans condition sous 30 jours pour tout achat sur la boutique de Guillaume Richard : comment le demander et ce qui se passe ensuite.',
      lead: 'Si un produit ne vous convient pas, vous êtes remboursé : sans condition, dans les 30 jours.',
      sections: [
        {
          h: 'Garantie de 30 jours',
          p: [
            'Tout achat (licence, mise à jour ou abonnement) peut être remboursé intégralement dans les 30 jours qui suivent le paiement, sans avoir à justifier votre demande.',
          ],
        },
        {
          h: 'Comment demander un remboursement',
          p: [
            'Répondez à l’e-mail de confirmation de Paddle, ou utilisez le lien d’aide à la commande qu’il contient. Vous pouvez aussi nous écrire via la page de contact en indiquant l’adresse e-mail utilisée pour l’achat.',
          ],
        },
        {
          h: 'Après le remboursement',
          p: [
            'Le remboursement est effectué par Paddle sur le moyen de paiement utilisé. La licence correspondante est désactivée et l’abonnement, s’il y en a un, prend fin.',
          ],
        },
        {
          h: 'Au-delà de 30 jours',
          p: [
            'Un abonnement peut être résilié à tout moment pour les périodes suivantes. Vos droits légaux, notamment la garantie de conformité, restent applicables au-delà de ce délai.',
          ],
        },
      ],
    },
    license: {
      title: 'Licence d’utilisation',
      description:
        'Licence d’utilisation des modules, extensions et services de Guillaume Richard : ce que permet chaque licence, mises à jour, restrictions.',
      lead: 'Ce que vous pouvez faire avec un produit acheté sur cette boutique.',
      sections: [
        {
          h: 'Ce qui vous est accordé',
          p: [
            'L’achat vous donne un droit d’utilisation non exclusif et non cessible du produit, dans les limites de la formule achetée. Le produit reste la propriété de son éditeur.',
          ],
        },
        {
          h: 'Étendue de chaque licence',
          p: ['L’étendue dépend du type de produit :'],
          items: [
            'Extension de navigateur : une personne, sur ses propres navigateurs.',
            'Module PrestaShop : une boutique en production, plus ses environnements de test et de développement.',
            'Application Slack : un espace de travail Slack.',
          ],
        },
        {
          h: 'Mises à jour',
          p: [
            'Une licence achetée une fois continue de fonctionner sans limite de durée. Les mises à jour et l’assistance sont incluses pendant la durée indiquée sur la fiche du produit, et peuvent être prolongées.',
          ],
        },
        {
          h: 'Ce qui n’est pas permis',
          p: [
            'Revendre, louer ou redistribuer le produit ou sa clé de licence ; contourner la vérification de licence ; utiliser le produit au-delà de l’étendue achetée.',
          ],
        },
        {
          h: 'Fin de la licence',
          p: [
            'La licence prend fin en cas de remboursement, de fin d’abonnement ou de non-respect de ces conditions.',
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of sale',
      description:
        'Terms of sale for the modules, extensions and services by Guillaume Richard, sold by Paddle, reseller and Merchant of Record.',
      lead: 'What applies when you buy a module, an extension or a subscription from this shop.',
      sections: [
        {
          h: 'Publisher and seller',
          p: [
            'The products in this shop are designed and published by Guillaume Richard, a sole trader based in France. His SIRET number will be shown here once registered.',
            'Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders: it sells you the product, takes the payment, applies your country’s VAT and sends you the invoice. Paddle handles order and payment enquiries, and processes refunds.',
          ],
        },
        {
          h: 'Products',
          p: [
            'Each product page describes what the product does, its platform, requirements and available plans. The terms of use of each product are set out in the licence.',
          ],
        },
        {
          h: 'Prices',
          p: [
            'Prices of products for individuals include VAT; prices of products for businesses exclude VAT. The exact amount, including your country’s VAT, is calculated and shown by Paddle before payment.',
          ],
        },
        {
          h: 'Order and payment',
          p: [
            'Payment is made on Paddle’s secure checkout, with the payment methods it offers. No card data goes through this site.',
          ],
        },
        {
          h: 'Delivery',
          p: [
            'Products are delivered right after payment: a licence key or access, sent by email and available in your customer area, with files to download where relevant.',
          ],
        },
        {
          h: 'Subscriptions',
          p: [
            'A subscription renews automatically at the end of each period (month or year) until cancelled. You can cancel it at any time, at no cost, from the management link sent by Paddle or from your customer area; cancellation takes effect at the end of the period already paid.',
            'For a yearly subscription, a reminder is sent before each renewal.',
          ],
        },
        {
          h: 'Refunds',
          p: [
            'Any purchase can be refunded within 30 days, no questions asked: see the refund policy. This guarantee comes on top of your statutory rights.',
          ],
        },
        {
          h: 'Updates and support',
          p: [
            'The length of updates and support depends on the plan purchased and is shown on the product page. Support is by email, through the contact page.',
          ],
        },
        {
          h: 'Warranties and liability',
          p: [
            'Consumers benefit from the statutory conformity guarantee for digital content and services under French consumer law. Beyond these statutory guarantees, the publisher’s liability is limited to the amount paid for the product concerned.',
          ],
        },
        {
          h: 'Personal data',
          p: [
            'Paddle processes the data needed for payment and invoicing under its own privacy policy. This site only keeps what is needed to provide the product: email address, licences, downloads. Details are in the site’s privacy policy.',
          ],
        },
        {
          h: 'Governing law',
          p: [
            'These terms are governed by French law. If anything goes wrong, contact us first: most questions are settled by a simple email.',
          ],
        },
      ],
    },
    refunds: {
      title: 'Refund policy',
      description:
        'No-questions-asked refund within 30 days for any purchase from Guillaume Richard’s shop: how to ask for it and what happens next.',
      lead: 'If a product is not right for you, you get your money back: no questions asked, within 30 days.',
      sections: [
        {
          h: '30-day guarantee',
          p: [
            'Any purchase (licence, updates or subscription) can be fully refunded within 30 days of payment, without having to give a reason.',
          ],
        },
        {
          h: 'How to ask for a refund',
          p: [
            'Reply to Paddle’s confirmation email, or use the order help link it contains. You can also write to us through the contact page, giving the email address used for the purchase.',
          ],
        },
        {
          h: 'After the refund',
          p: [
            'Paddle refunds the payment method used. The matching licence is deactivated and the subscription, if any, ends.',
          ],
        },
        {
          h: 'After 30 days',
          p: [
            'A subscription can be cancelled at any time for the following periods. Your statutory rights, including the conformity guarantee, still apply after this period.',
          ],
        },
      ],
    },
    license: {
      title: 'Licence',
      description:
        'Licence for the modules, extensions and services by Guillaume Richard: what each licence allows, updates, restrictions.',
      lead: 'What you may do with a product bought from this shop.',
      sections: [
        {
          h: 'What you are granted',
          p: [
            'A purchase gives you a non-exclusive, non-transferable right to use the product, within the limits of the plan bought. The product remains the property of its publisher.',
          ],
        },
        {
          h: 'Scope of each licence',
          p: ['The scope depends on the type of product:'],
          items: [
            'Browser extension: one person, on their own browsers.',
            'PrestaShop module: one production store, plus its test and development environments.',
            'Slack app: one Slack workspace.',
          ],
        },
        {
          h: 'Updates',
          p: [
            'A licence bought once keeps working with no time limit. Updates and support are included for the period shown on the product page, and can be extended.',
          ],
        },
        {
          h: 'What is not allowed',
          p: [
            'Reselling, renting or redistributing the product or its licence key; bypassing the licence check; using the product beyond the scope bought.',
          ],
        },
        {
          h: 'End of the licence',
          p: [
            'The licence ends on refund, at the end of a subscription, or if these terms are breached.',
          ],
        },
      ],
    },
  },
};

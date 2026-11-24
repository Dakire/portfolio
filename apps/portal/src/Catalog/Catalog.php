<?php

declare(strict_types=1);

namespace Grichard\Portal\Catalog;

/**
 * Catalogue d'aperçu de la boutique, visible seulement une fois connecté (/boutique). Tarifs et étapes proposés dans la
 * conversation de cadrage du 24 novembre 2026 : rien n'est en vente, aucun bouton d'achat (ADR 0017, docs/boutique.md).
 */
final class Catalog
{
    /** @return list<Product> */
    public function all(): array
    {
        return [
            new Product(
                slug: 'youtube-regarder-plus-tard',
                name: 'Trier « À regarder plus tard »',
                platform: 'Extension Chrome',
                pitch: 'Trier, filtrer et nettoyer la playlist « À regarder plus tard » de YouTube.',
                audience: 'Toute personne dont la playlist déborde.',
                channel: 'Licence vendue sur grichard.eu (Paddle), extension publiée sur le Chrome Web Store',
                price: 'Gratuit, version Pro à 9 € par an (ou 15 € à vie)',
                stage: Stage::Launch,
                watchpoint: 'L\'API YouTube ne donne pas accès à cette playlist : l\'extension lit la page et peut casser à chaque refonte de YouTube.',
            ),
            new Product(
                slug: 'prevenez-moi-rupture',
                name: 'Prévenez-moi au retour en stock',
                platform: 'Module PrestaShop',
                pitch: 'Un formulaire « Prévenez-moi » sur les produits et variations en rupture ; quand le stock revient, les inscrits reçoivent un e-mail.',
                audience: 'Boutiques PrestaShop qui perdent des ventes sur les ruptures.',
                channel: 'Licence vendue sur grichard.eu (Paddle), ou PrestaShop Addons',
                price: '39 à 49 € HT une fois, un an de mises à jour, puis environ 15 € par an',
                stage: Stage::Launch,
                watchpoint: 'Se démarquer du module natif « Mail alerts » : variations, double opt-in RGPD, statistiques, export vers Klaviyo.',
            ),
            new Product(
                slug: 'standup-slack',
                name: 'Standup asynchrone pour Slack',
                platform: 'Bot Slack (Cloudflare Worker, D1)',
                pitch: 'À l\'heure choisie, chaque membre reçoit un message avec un bouton « Répondre » ; le bot publie un résumé consolidé dans le canal de l\'équipe.',
                audience: 'Équipes réparties qui veulent un point quotidien sans réunion.',
                channel: 'Abonnement par Paddle (à la place de Stripe en direct : la TVA reste chez Paddle)',
                price: 'Gratuit jusqu\'à 5 membres, puis environ 2 € par membre et par mois, ou 19 € par mois et par espace',
                stage: Stage::Launch,
                watchpoint: 'Remplacer Stripe par Paddle dans le Worker (webhook, état de l\'abonnement dans D1) ; référencement sur la Slack Marketplace.',
            ),
            new Product(
                slug: 'crm-gmail',
                name: 'Boîte partagée et mini-CRM pour Gmail',
                platform: 'Extension Chrome (Manifest V3)',
                pitch: 'Boîte partagée, mini-CRM et suivi du temps passé dans Gmail, sans serveur : libellés Gmail, Google Sheets, Google Contacts et stockage de Chrome.',
                audience: 'Petites équipes qui gèrent leurs clients depuis Gmail.',
                channel: 'Licence ou abonnement par Paddle',
                price: '5 € par utilisateur et par mois, ou 49 € par an',
                stage: Stage::Later,
                watchpoint: 'Accès Gmail « restreints » : validation de Google obligatoire, et audit de sécurité annuel si des données passent par un serveur. Lancer la demande tôt.',
            ),
            new Product(
                slug: 'regles-tags-shopify',
                name: 'Règles de tags automatiques',
                platform: 'App Shopify embarquée',
                pitch: 'Le marchand définit des règles (« si le montant ≥ 100, taguer la commande gros-panier ») appliquées à chaque nouvelle commande.',
                audience: 'Boutiques qui trient, exportent ou automatisent à partir des tags (segmentation, entrepôt, Shopify Flow, Klaviyo).',
                channel: 'App Store et facturation Shopify (0 % de commission sur le premier million de dollars, puis 15 %)',
                price: 'Gratuit jusqu\'à N commandes, puis 4,99 à 9,99 $ par mois',
                stage: Stage::Later,
                watchpoint: 'Shopify Flow fait déjà ce cas gratuitement : trouver un vrai différenciateur avant de construire.',
            ),
            new Product(
                slug: 'prompt-structure',
                name: 'Générateur de prompts structurés',
                platform: 'Outil en ligne (et extension, plus tard)',
                pitch: 'Transforme une idée brute en prompt structuré : rôle, contexte, tâche, contraintes, format de sortie.',
                audience: 'Utilisateurs de ChatGPT, Claude ou Gemini qui veulent de meilleurs résultats sans apprendre le prompt engineering.',
                channel: 'Gratuit sur grichard.eu (apporte du trafic) ; payant seulement s\'il appelle une IA',
                price: 'Gratuit',
                stage: Stage::FreeTool,
                watchpoint: 'Marché saturé d\'outils gratuits ; un appel à une IA coûterait à chaque usage (abonnement, ou clé fournie par l\'utilisateur).',
            ),
        ];
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Portal\Catalog;

/** Un produit de la future boutique (ADR 0017) : fiche d'aperçu, rien n'est encore en vente. */
final readonly class Product
{
    /**
     * @param string $platform   où le produit tourne (« Extension Chrome », « Module PrestaShop »…)
     * @param string $channel    par où il se vendra (Paddle, App Store Shopify…)
     * @param string $price      tarif proposé, à valider
     * @param string $watchpoint ce qui reste à régler avant de le vendre
     */
    public function __construct(
        public string $slug,
        public string $name,
        public string $platform,
        public string $pitch,
        public string $audience,
        public string $channel,
        public string $price,
        public Stage $stage,
        public string $watchpoint,
    ) {}
}

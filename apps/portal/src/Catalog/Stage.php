<?php

declare(strict_types=1);

namespace Grichard\Portal\Catalog;

/** Étape prévue pour un produit (feuille de route : docs/boutique.md). */
enum Stage: string
{
    case Launch = 'Ouverture prévue au premier trimestre 2027';
    case Later = 'Plus tard';
    case FreeTool = 'Outil gratuit sur grichard.eu';
}

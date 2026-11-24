<?php

declare(strict_types=1);

namespace Grichard\Portal\Catalog;

/** Étape prévue pour un produit (feuille de route : docs/boutique.md). L'ordre des cas est celui des rubriques de la page. */
enum Stage: string
{
    case Launch = 'launch';
    case Later = 'later';
    case FreeTool = 'free';

    /** Titre de la rubrique. */
    public function title(): string
    {
        return match ($this) {
            self::Launch => 'À l\'ouverture',
            self::Later => 'Ensuite',
            self::FreeTool => 'Outils gratuits',
        };
    }

    /** Mention en mono à droite de la rubrique, et badge de chaque fiche. */
    public function label(): string
    {
        return match ($this) {
            self::Launch => 'premier trimestre 2027',
            self::Later => 'après l\'ouverture',
            self::FreeTool => 'gratuit, sur grichard.eu',
        };
    }
}

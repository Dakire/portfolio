<?php

declare(strict_types=1);

namespace Grichard\Portal\Shop;

/**
 * Ce que donne chaque formule payante (mêmes produits et formules que la vitrine, apps/web/src/shop/products.ts) :
 *  - perpetual : licence sans échéance, mises à jour pendant la durée indiquée (null : sans limite) ;
 *  - subscription : licence valable jusqu'à la fin de la période payée, prolongée à chaque renouvellement ;
 *  - updates : prolonge les mises à jour d'une licence perpétuelle existante du même produit.
 * Les formules gratuites n'ont pas de licence. Les identifiants de prix Paddle sont reliés à ces formules dans
 * config/paddle_prices.php.
 */
final class Offer
{
    public const PERPETUAL = 'perpetual';
    public const SUBSCRIPTION = 'subscription';
    public const UPDATES = 'updates';

    /** @var array<string, array<string, array{kind: string, updates: ?string}>> */
    private const OFFERS = [
        'youtube-regarder-plus-tard' => [
            'pro' => ['kind' => self::SUBSCRIPTION, 'updates' => null],
            'pro-a-vie' => ['kind' => self::PERPETUAL, 'updates' => null],
        ],
        'prevenez-moi-rupture' => [
            'licence' => ['kind' => self::PERPETUAL, 'updates' => 'P1Y'],
            'mises-a-jour' => ['kind' => self::UPDATES, 'updates' => 'P1Y'],
        ],
        'standup-slack' => [
            'equipe' => ['kind' => self::SUBSCRIPTION, 'updates' => null],
        ],
    ];

    /** @return array{kind: string, updates: ?string}|null */
    public static function find(string $product, string $plan): ?array
    {
        return self::OFFERS[$product][$plan] ?? null;
    }

    /** @return list<string> */
    public static function products(): array
    {
        return array_keys(self::OFFERS);
    }

    /** @return list<string> */
    public static function plans(string $product): array
    {
        return array_keys(self::OFFERS[$product] ?? []);
    }
}

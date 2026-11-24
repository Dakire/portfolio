<?php

declare(strict_types=1);

namespace Grichard\Portal\Paddle;

use Grichard\Portal\Shop\Offer;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** Identifiant de prix Paddle -> formule (config/paddle_prices.php). Une entrée vers une formule inconnue est refusée. */
final class PriceMap
{
    /** @var array<string, array{product: string, plan: string}> */
    private array $prices;

    /** @param array<string, array{product: string, plan: string}>|null $prices pour les tests ; sinon le fichier de configuration */
    public function __construct(
        #[Autowire('%portal.paddle_prices_file%')]
        string $file,
        ?array $prices = null,
    ) {
        /** @var array<string, array{product: string, plan: string}> $loaded */
        $loaded = $prices ?? (is_file($file) ? (array) require $file : []);
        foreach ($loaded as $priceId => $target) {
            if (null === Offer::find($target['product'], $target['plan'])) {
                throw new \LogicException(\sprintf('Prix Paddle %s : formule inconnue %s/%s.', $priceId, $target['product'], $target['plan']));
            }
        }
        $this->prices = $loaded;
    }

    /** @return array{product: string, plan: string}|null */
    public function find(string $priceId): ?array
    {
        return $this->prices[$priceId] ?? null;
    }
}

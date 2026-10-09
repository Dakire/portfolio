<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Support;

use Grichard\Api\Net\Resolver;

/** Faux résolveur : table « nom -> adresses » (une IP littérale se résout en elle-même). */
final class FakeResolver implements Resolver
{
    /** @param array<string, list<string>> $records */
    public function __construct(private array $records) {}

    public function resolve(string $host): array
    {
        if (false !== filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        return $this->records[$host] ?? [];
    }
}

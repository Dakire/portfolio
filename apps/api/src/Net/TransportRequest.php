<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Une requête prête à partir : l'URL, l'IP déjà validée sur laquelle la connexion est épinglée, les limites. */
final readonly class TransportRequest
{
    /** @param array<string, string> $headers */
    public function __construct(
        public Url $url,
        public string $ip,
        public string $method,
        public array $headers,
        public int $maxBytes,
        public float $timeoutSeconds,
        public float $connectTimeoutSeconds,
    ) {}
}

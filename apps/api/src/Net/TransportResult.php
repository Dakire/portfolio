<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Réponse brute d'un seul échange (sans suivre de redirection), ou l'échec du transport. */
final readonly class TransportResult
{
    /** @param array<string, list<string>> $headers noms en minuscules */
    public function __construct(
        public int $status,
        public array $headers,
        public string $body,
        public bool $truncated,
        public float $seconds,
        public float $firstByteSeconds,
        public ?string $error = null,
    ) {}

    public static function failed(string $reason, float $seconds = 0.0): self
    {
        return new self(0, [], '', false, $seconds, 0.0, $reason);
    }
}

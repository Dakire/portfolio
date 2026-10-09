<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Réponse finale d'une requête sortante, après les redirections. */
final readonly class HttpResponse
{
    /**
     * @param array<string, list<string>>             $headers   noms en minuscules
     * @param list<array{url: string, status: int}>    $redirects étapes avant l'URL finale
     */
    public function __construct(
        public Url $url,
        public int $status,
        public array $headers,
        public string $body,
        public bool $truncated,
        public float $seconds,
        public float $firstByteSeconds,
        public array $redirects,
    ) {}

    public function header(string $name): ?string
    {
        $values = $this->headers[strtolower($name)] ?? [];

        return [] === $values ? null : implode(', ', $values);
    }

    public function contentType(): string
    {
        return strtolower(trim(explode(';', $this->header('content-type') ?? '')[0]));
    }
}

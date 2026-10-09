<?php

declare(strict_types=1);

namespace Grichard\Api\Http;

/** Requête HTTP reçue, réduite à ce dont l'API a besoin (testable sans superglobales). */
final readonly class Request
{
    /** @param array<string, string> $cookies */
    public function __construct(
        public string $method,
        public string $origin,
        public string $remoteAddress,
        public string $body,
        public string $csrfHeader = '',
        public array $cookies = [],
        public string $query = '',
    ) {}

    /**
     * Construit la requête courante depuis l'environnement PHP ; le corps est lu avec une taille maximale.
     *
     * @param int<0, max> $maxBodyBytes
     */
    public static function fromGlobals(int $maxBodyBytes = 20_000): self
    {
        $body = file_get_contents('php://input', false, null, 0, $maxBodyBytes);
        $cookies = [];
        foreach ($_COOKIE as $name => $value) {
            if (\is_string($value)) {
                $cookies[(string) $name] = $value;
            }
        }

        return new self(
            method: \is_string($_SERVER['REQUEST_METHOD'] ?? null) ? $_SERVER['REQUEST_METHOD'] : '',
            origin: \is_string($_SERVER['HTTP_ORIGIN'] ?? null) ? $_SERVER['HTTP_ORIGIN'] : '',
            remoteAddress: \is_string($_SERVER['REMOTE_ADDR'] ?? null) ? $_SERVER['REMOTE_ADDR'] : '',
            body: false === $body ? '' : $body,
            csrfHeader: \is_string($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : '',
            cookies: $cookies,
            query: \is_string($_SERVER['QUERY_STRING'] ?? null) ? $_SERVER['QUERY_STRING'] : '',
        );
    }
}

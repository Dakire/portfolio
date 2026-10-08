<?php

declare(strict_types=1);

namespace Grichard\Api\Http;

/** Requête HTTP reçue, réduite à ce dont l'API a besoin (testable sans superglobales). */
final readonly class Request
{
    public function __construct(
        public string $method,
        public string $origin,
        public string $remoteAddress,
        public string $body,
    ) {}

    /**
     * Construit la requête courante depuis l'environnement PHP ; le corps est lu avec une taille maximale.
     *
     * @param int<0, max> $maxBodyBytes
     */
    public static function fromGlobals(int $maxBodyBytes = 20_000): self
    {
        $body = file_get_contents('php://input', false, null, 0, $maxBodyBytes);

        return new self(
            method: \is_string($_SERVER['REQUEST_METHOD'] ?? null) ? $_SERVER['REQUEST_METHOD'] : '',
            origin: \is_string($_SERVER['HTTP_ORIGIN'] ?? null) ? $_SERVER['HTTP_ORIGIN'] : '',
            remoteAddress: \is_string($_SERVER['REMOTE_ADDR'] ?? null) ? $_SERVER['REMOTE_ADDR'] : '',
            body: false === $body ? '' : $body,
        );
    }
}

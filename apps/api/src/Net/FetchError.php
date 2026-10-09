<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Échec d'une requête sortante. Le code est stable (le front le traduit) ; le message n'est jamais renvoyé tel quel. */
final class FetchError extends \RuntimeException
{
    public const INVALID_URL = 'invalid_url';
    public const BLOCKED = 'blocked_address';
    public const DNS = 'dns_failure';
    public const CONNECTION = 'connection_failed';
    public const TIMEOUT = 'timeout';
    public const TOO_MANY_REDIRECTS = 'too_many_redirects';
    public const TLS = 'tls_error';
    public const UNAVAILABLE = 'unavailable';

    public function __construct(public readonly string $reason, string $detail = '')
    {
        parent::__construct('' === $detail ? $reason : $reason . ' : ' . $detail);
    }
}

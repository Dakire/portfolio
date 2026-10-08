<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Vérification côté serveur auprès de Cloudflare. Le jeton doit avoir été émis pour notre site et pour aucun autre. */
final readonly class CloudflareTurnstileVerifier implements TurnstileVerifier
{
    private const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    private const MAX_TOKEN_LENGTH = 2048;

    /** @param list<string> $allowedHosts */
    public function __construct(
        private string $secret,
        private array $allowedHosts,
        private HttpClient $http,
    ) {}

    public function verify(string $token, string $ip): bool
    {
        if ('' === $token || \strlen($token) > self::MAX_TOKEN_LENGTH) {
            return false;
        }

        $raw = $this->http->postForm(self::ENDPOINT, ['secret' => $this->secret, 'response' => $token, 'remoteip' => $ip], 5);
        if (null === $raw) {
            return false;
        }

        $result = json_decode($raw, true);
        if (!\is_array($result) || true !== ($result['success'] ?? false)) {
            return false;
        }

        // Un nom d'hôte absent est refusé : l'accepter permettrait de réutiliser un jeton émis pour un autre site.
        $hostname = $result['hostname'] ?? null;

        return \is_string($hostname) && \in_array($hostname, $this->allowedHosts, true);
    }
}

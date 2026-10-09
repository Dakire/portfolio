<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

use Closure;

/**
 * Requêtes sortantes des outils (rapport SEO, vérificateur de sitemap), protégées contre la SSRF :
 * - URL validée par Url (http/https, ports 80/443, aucun identifiant, aucune écriture exotique d'IP) ;
 * - nom résolu ici, et refus si UNE SEULE des adresses n'est pas publique (IpPolicy) ; la connexion est épinglée
 *   sur l'adresse validée, la résolution ne peut donc pas changer entre le contrôle et l'appel (DNS rebinding) ;
 * - redirections suivies une à une (5 au plus), chacune revalidée de la même façon ;
 * - délais courts, budget de temps global pour toute l'analyse, corps plafonné, User-Agent identifiable.
 */
final class SafeHttpClient
{
    public const USER_AGENT = 'grichard.eu-tools/1.0 (+https://grichard.eu/outils/seo/)';
    public const MAX_REDIRECTS = 5;
    private const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

    private readonly float $deadline;

    /** @var array<string, list<string>> */
    private array $dnsCache = [];

    /** @param Closure(): float $clock horloge injectable (secondes, microtime) */
    public function __construct(
        private readonly Transport $transport,
        private readonly Resolver $resolver,
        float $budgetSeconds = 20.0,
        private readonly float $requestTimeout = 8.0,
        private readonly float $connectTimeout = 3.0,
        private readonly ?Closure $clock = null,
    ) {
        $this->deadline = $this->now() + $budgetSeconds;
    }

    public function available(): bool
    {
        return $this->transport->available();
    }

    /** Temps restant sur le budget global de l'analyse. */
    public function remaining(): float
    {
        return $this->deadline - $this->now();
    }

    /** @throws FetchError */
    public function fetch(Url $url, string $method = 'GET', int $maxBytes = 2_000_000): HttpResponse
    {
        $result = $this->fetchAll(['only' => $url], $method, $maxBytes)['only'];
        if ($result instanceof FetchError) {
            throw $result;
        }

        return $result;
    }

    /**
     * Plusieurs URL en parallèle (une étape de redirection à la fois pour toutes).
     *
     * @template K of array-key
     *
     * @param array<K, Url> $urls
     *
     * @return array<K, HttpResponse|FetchError>
     */
    public function fetchAll(array $urls, string $method = 'GET', int $maxBytes = 2_000_000): array
    {
        $results = [];
        /** @var array<K, array{url: Url, method: string, redirects: list<array{url: string, status: int}>}> $pending */
        $pending = [];
        foreach ($urls as $key => $url) {
            $pending[$key] = ['url' => $url, 'method' => $method, 'redirects' => []];
        }
        if (!$this->transport->available()) {
            return array_map(static fn(): FetchError => new FetchError(FetchError::UNAVAILABLE, 'cURL absent'), $urls);
        }

        while ([] !== $pending) {
            $remaining = $this->remaining();
            if ($remaining < 0.5) {
                foreach ($pending as $key => $_) {
                    $results[$key] = new FetchError(FetchError::TIMEOUT, 'budget épuisé');
                }
                break;
            }
            $requests = [];
            foreach ($pending as $key => $step) {
                try {
                    $requests[$key] = new TransportRequest(
                        url: $step['url'],
                        ip: $this->safeIp($step['url']),
                        method: $step['method'],
                        headers: [
                            'User-Agent' => self::USER_AGENT,
                            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language' => 'fr,en;q=0.8',
                        ],
                        maxBytes: $maxBytes,
                        timeoutSeconds: min($this->requestTimeout, $remaining),
                        connectTimeoutSeconds: min($this->connectTimeout, $remaining),
                    );
                } catch (FetchError $error) {
                    $results[$key] = $error;
                    unset($pending[$key]);
                }
            }

            foreach ($this->transport->sendAll($requests) as $key => $result) {
                $step = $pending[$key];
                unset($pending[$key]);
                if (null !== $result->error) {
                    $results[$key] = new FetchError($result->error);
                    continue;
                }
                $location = $result->headers['location'][0] ?? null;
                if (\in_array($result->status, self::REDIRECT_STATUSES, true) && null !== $location) {
                    $next = $step['url']->resolve($location);
                    $redirects = [...$step['redirects'], ['url' => $step['url']->toString(), 'status' => $result->status]];
                    if (null === $next) {
                        $results[$key] = new FetchError(FetchError::INVALID_URL, 'redirection vers une URL refusée');
                    } elseif (\count($redirects) > self::MAX_REDIRECTS) {
                        $results[$key] = new FetchError(FetchError::TOO_MANY_REDIRECTS);
                    } else {
                        $nextMethod = 303 === $result->status && 'HEAD' !== $step['method'] ? 'GET' : $step['method'];
                        $pending[$key] = ['url' => $next, 'method' => $nextMethod, 'redirects' => $redirects];
                    }
                    continue;
                }
                $results[$key] = new HttpResponse(
                    url: $step['url'],
                    status: $result->status,
                    headers: $result->headers,
                    body: $result->body,
                    truncated: $result->truncated,
                    seconds: $result->seconds,
                    firstByteSeconds: $result->firstByteSeconds,
                    redirects: $step['redirects'],
                );
            }
        }

        // ordre des clés d'origine
        $ordered = [];
        foreach ($urls as $key => $_) {
            $ordered[$key] = $results[$key] ?? new FetchError(FetchError::CONNECTION);
        }

        return $ordered;
    }

    /** @throws FetchError */
    private function safeIp(Url $url): string
    {
        $ips = $this->dnsCache[$url->host] ??= $this->resolver->resolve($url->host);
        if ([] === $ips) {
            throw new FetchError(FetchError::DNS, $url->host);
        }
        foreach ($ips as $ip) {
            if (!IpPolicy::isPublic($ip)) {
                throw new FetchError(FetchError::BLOCKED, $url->host);
            }
        }
        // IPv4 d'abord : l'hébergement mutualisé n'a pas toujours de connectivité IPv6 sortante.
        usort($ips, static fn(string $a, string $b): int => (int) str_contains($a, ':') <=> (int) str_contains($b, ':'));

        return $ips[0];
    }

    private function now(): float
    {
        return null !== $this->clock ? ($this->clock)() : microtime(true);
    }
}

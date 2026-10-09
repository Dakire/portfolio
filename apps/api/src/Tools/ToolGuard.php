<?php

declare(strict_types=1);

namespace Grichard\Api\Tools;

use Grichard\Api\Contact\RateLimiter;
use Grichard\Api\Contact\TurnstileVerifier;
use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;

/**
 * Garde-fous des outils qui font des requêtes sortantes (rapport SEO, vérificateur de sitemap). Contrôles du moins cher au
 * plus cher : méthode, origine, jeton CSRF (double soumission : cookie __Host- + en-tête X-CSRF-Token), JSON, Turnstile,
 * puis quota (une requête refusée plus tôt ne consomme pas le quota). Aucune URL analysée n'est journalisée ni conservée.
 */
final readonly class ToolGuard
{
    public const COOKIE = '__Host-grtools';

    /** @param list<string> $allowedHosts */
    public function __construct(
        private array $allowedHosts,
        private string $turnstileSecret,
        private TurnstileVerifier $turnstile,
        private RateLimiter $limiter,
    ) {}

    /**
     * GET : émet un jeton CSRF (cookie HttpOnly + valeur à renvoyer dans l'en-tête X-CSRF-Token).
     * Le cookie __Host- n'est accepté par le navigateur qu'en HTTPS, sans Domain, avec Path=/ : impossible à poser depuis
     * un sous-domaine.
     */
    public static function issueToken(): Response
    {
        $token = bin2hex(random_bytes(32));

        return Response::data(['csrf' => $token], [
            'Set-Cookie' => self::COOKIE . '=' . $token . '; Path=/; Secure; HttpOnly; SameSite=Strict',
        ]);
    }

    /**
     * @return Response|array<array-key, mixed> l'erreur à renvoyer telle quelle, ou le corps JSON décodé
     */
    public function check(Request $request): Response|array
    {
        if ('POST' !== $request->method) {
            return Response::error(405, 'Méthode non autorisée.', ['Allow' => 'GET, POST'], 'method');
        }
        $host = parse_url($request->origin, PHP_URL_HOST);
        if (!\is_string($host) || !\in_array($host, $this->allowedHosts, true)) {
            return Response::error(403, 'Origine non autorisée.', [], 'origin');
        }
        $cookie = $request->cookies[self::COOKIE] ?? '';
        if (64 !== \strlen($cookie) || !hash_equals($cookie, $request->csrfHeader)) {
            return Response::error(403, 'Jeton de sécurité invalide : rechargez la page.', [], 'csrf');
        }
        $input = json_decode($request->body, true, 4);
        if (!\is_array($input)) {
            return Response::error(400, 'Requête invalide.', [], 'invalid_request');
        }
        if ('' === $this->turnstileSecret) {
            return Response::error(503, 'Service momentanément indisponible.', [], 'unavailable');
        }
        $token = $input['turnstileToken'] ?? '';
        if (!\is_string($token) || !$this->turnstile->verify($token, $request->remoteAddress)) {
            return Response::error(403, 'Vérification anti-robot échouée.', [], 'captcha');
        }
        if ($this->limiter->tooMany($request->remoteAddress)) {
            return Response::error(429, 'Trop d’analyses pour le moment, réessayez dans une heure.', ['Retry-After' => '3600'], 'rate_limited');
        }

        return $input;
    }
}

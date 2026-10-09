<?php

declare(strict_types=1);

namespace Grichard\Api\Tools;

use Closure;
use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;
use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\Url;

/**
 * Point d'entrée des outils serveur (public/tools.php) :
 *   GET  tools.php?csrf                                   -> jeton CSRF (cookie + valeur)
 *   POST tools.php {tool, url, turnstileToken}            -> rapport JSON
 * Chaque outil a ses propres garde-fous (quota distinct). Les erreurs portent un code stable que le front traduit.
 * Journal : la classe d'erreur seulement, jamais l'URL analysée (RGPD).
 */
final readonly class ToolsHandler
{
    /**
     * @param array<string, ToolGuard>                                $guards par outil
     * @param array<string, Closure(Url): array<string, mixed>>       $tools  par outil ; chaque appel crée son client (budget de temps neuf)
     */
    public function __construct(
        private array $guards,
        private array $tools,
    ) {}

    /** @param callable(string): void $log */
    public function handle(Request $request, callable $log): Response
    {
        if ('GET' === $request->method) {
            return 'csrf' === $request->query
                ? ToolGuard::issueToken()
                : Response::error(400, 'Requête invalide.', [], 'invalid_request');
        }
        if ('POST' !== $request->method) {
            return Response::error(405, 'Méthode non autorisée.', ['Allow' => 'GET, POST'], 'method');
        }

        $peek = json_decode($request->body, true, 4);
        $tool = \is_array($peek) && \is_string($peek['tool'] ?? null) ? $peek['tool'] : '';
        $guard = $this->guards[$tool] ?? null;
        $run = $this->tools[$tool] ?? null;
        if (null === $guard || null === $run) {
            return Response::error(404, 'Outil inconnu.', [], 'unknown_tool');
        }

        $input = $guard->check($request);
        if ($input instanceof Response) {
            return $input;
        }
        $raw = $input['url'] ?? null;
        $url = \is_string($raw) ? Url::fromInput($raw) : null;
        if (null === $url) {
            return Response::error(422, 'Adresse invalide : saisissez une URL http(s) publique.', [], FetchError::INVALID_URL);
        }

        try {
            return Response::data($run($url));
        } catch (FetchError $error) {
            return self::fetchError($error);
        } catch (\Throwable $error) {
            $log('outils (' . $tool . ') : ' . $error::class . ' ' . $error->getFile() . ':' . $error->getLine());

            return Response::error(500, 'Erreur interne pendant l’analyse.', [], 'internal');
        }
    }

    private static function fetchError(FetchError $error): Response
    {
        [$status, $message] = match ($error->reason) {
            FetchError::BLOCKED => [422, 'Cette adresse n’est pas publique : elle ne peut pas être analysée.'],
            FetchError::INVALID_URL => [422, 'Adresse ou redirection invalide.'],
            FetchError::DNS => [502, 'Le nom de domaine ne se résout pas.'],
            FetchError::TIMEOUT => [504, 'Le site a mis trop de temps à répondre.'],
            FetchError::TLS => [502, 'Certificat TLS invalide ou connexion sécurisée impossible.'],
            FetchError::TOO_MANY_REDIRECTS => [502, 'Trop de redirections.'],
            FetchError::UNAVAILABLE => [503, 'Service momentanément indisponible.'],
            default => [502, 'Le site n’a pas pu être joint.'],
        };

        return Response::error($status, $message, [], $error->reason);
    }
}

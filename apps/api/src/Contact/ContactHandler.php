<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;

/**
 * Traite une demande de contact. L'ordre des contrôles est voulu : les plus bon marché d'abord, le captcha avant toute
 * validation du contenu, la limitation de débit juste avant l'envoi (un message refusé ne consomme pas le quota).
 */
final readonly class ContactHandler
{
    /** @param list<string> $allowedHosts */
    public function __construct(
        private string $turnstileSecret,
        private array $allowedHosts,
        private TurnstileVerifier $turnstile,
        private RateLimiter $limiter,
        private Mailer $mailer,
    ) {}

    /** @param callable(string): void $log journalise une erreur d'exploitation (jamais renvoyée au visiteur) */
    public function handle(Request $request, callable $log): Response
    {
        if ('POST' !== $request->method) {
            return Response::error(405, 'Méthode non autorisée.', ['Allow' => 'POST']);
        }

        // Rejette les requêtes cross-site (le front appelle ce script en same-origin).
        if ('' !== $request->origin && !\in_array(parse_url($request->origin, PHP_URL_HOST), $this->allowedHosts, true)) {
            return Response::error(403, 'Origine non autorisée.');
        }

        $input = json_decode($request->body, true, 4);
        if (!\is_array($input)) {
            return Response::error(400, 'Requête invalide.');
        }

        // Honeypot : les robots remplissent ce champ caché. On répond « OK » sans rien envoyer.
        if ('' !== trim(self::text($input['website'] ?? ''))) {
            return Response::ok('Message envoyé avec succès.');
        }

        // Échec fermé : sans secret configuré, aucun message n'est jamais accepté.
        if ('' === $this->turnstileSecret) {
            $log('contact : secret Turnstile manquant (private/config.php ou TURNSTILE_SECRET).');

            return Response::error(500, 'Service momentanément indisponible.');
        }
        if (!$this->turnstile->verify(self::text($input['turnstileToken'] ?? ''), $request->remoteAddress)) {
            return Response::error(403, 'Vérification anti-robot échouée.');
        }

        $message = ContactMessage::fromInput($input);
        if (null === $message) {
            return Response::error(400, 'Données invalides ou manquantes.');
        }

        if ($this->limiter->tooMany($request->remoteAddress)) {
            return Response::error(429, 'Trop de messages pour le moment, veuillez réessayer plus tard.');
        }

        if ($this->mailer->send($message)) {
            return Response::ok('Message envoyé avec succès.');
        }
        $log('contact : échec de mail().');

        return Response::error(500, "Erreur lors de l'envoi de l'email.");
    }

    private static function text(mixed $value): string
    {
        return \is_string($value) ? $value : '';
    }
}

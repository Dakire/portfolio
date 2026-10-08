<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Message validé et nettoyé. Impossible à construire autrement que par fromInput() : un objet existant est toujours sûr à envoyer. */
final readonly class ContactMessage
{
    public const MAX_NAME = 100;
    public const MAX_MESSAGE = 5000;
    public const MAX_EMAIL = 254;

    private function __construct(
        public string $name,
        public string $email,
        public string $message,
    ) {}

    /**
     * @param array<array-key, mixed> $input corps JSON décodé
     *
     * @return self|null null si une donnée est manquante, trop longue ou suspecte
     */
    public static function fromInput(array $input): ?self
    {
        $name = self::cleanName(self::text($input['name'] ?? ''));
        $email = trim(self::text($input['email'] ?? ''));
        $message = trim(self::text($input['message'] ?? ''));

        if (
            '' === $name || mb_strlen($name) > self::MAX_NAME
            || '' === $message || mb_strlen($message) > self::MAX_MESSAGE
            || '' === $email || \strlen($email) > self::MAX_EMAIL
            || false === filter_var($email, FILTER_VALIDATE_EMAIL)
            // Pas de forme exotique (guillemets, commentaires, listes d'adresses) : l'adresse est reprise dans Reply-To
            || 1 === preg_match('/[\s"<>,;()\[\]\\\\]/', $email)
        ) {
            return null;
        }

        return new self($name, $email, $message);
    }

    /** Nom sans balises ni caractères de contrôle (CR, LF, NUL, séparateurs de ligne Unicode…) : aucune injection d'en-tête possible. */
    private static function cleanName(string $raw): string
    {
        $cleaned = preg_replace('/[\p{Cc}\x{2028}\x{2029}]+/u', ' ', strip_tags($raw));

        return trim($cleaned ?? '');
    }

    private static function text(mixed $value): string
    {
        return \is_string($value) ? $value : '';
    }
}

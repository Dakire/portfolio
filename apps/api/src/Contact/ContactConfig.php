<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Réglages du formulaire de contact. Le secret Turnstile ne vient jamais du dépôt : variable d'environnement ou fichier hors webroot. */
final readonly class ContactConfig
{
    /** @param list<string> $allowedHosts domaines autorisés comme origine de la requête et comme domaine du jeton Turnstile */
    public function __construct(
        public string $turnstileSecret,
        public string $stateDir,
        public string $mailTo = 'contact@grichard.eu',
        public string $mailFrom = 'noreply@grichard.eu',
        public array $allowedHosts = ['grichard.eu', 'www.grichard.eu'],
        public int $maxPerHour = 15,
        public int $maxPerIpPerHour = 3,
    ) {}

    /** @param array<array-key, mixed> $data contenu du fichier de configuration (private/config.php) */
    public static function fromArray(array $data, string $stateDir): self
    {
        $secret = $data['turnstile_secret'] ?? '';
        $hosts = $data['allowed_hosts'] ?? null;

        return new self(
            turnstileSecret: \is_string($secret) ? $secret : '',
            stateDir: $stateDir,
            mailTo: \is_string($data['mail_to'] ?? null) ? $data['mail_to'] : 'contact@grichard.eu',
            mailFrom: \is_string($data['mail_from'] ?? null) ? $data['mail_from'] : 'noreply@grichard.eu',
            allowedHosts: \is_array($hosts) ? array_values(array_filter($hosts, is_string(...))) : ['grichard.eu', 'www.grichard.eu'],
        );
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Portal\Setup;

/**
 * Jeton d'installation, lu dans private/portal.php (jamais dans le dépôt). Tant qu'aucun utilisateur n'existe, la page /setup
 * le demande ; vide, l'installation par le navigateur est désactivée.
 */
final readonly class SetupToken
{
    private const MIN_LENGTH = 24;

    public function __construct(private string $token) {}

    public function isConfigured(): bool
    {
        return \strlen($this->token) >= self::MIN_LENGTH;
    }

    public function matches(string $candidate): bool
    {
        return $this->isConfigured() && hash_equals($this->token, $candidate);
    }
}

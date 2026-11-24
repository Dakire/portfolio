<?php

declare(strict_types=1);

namespace Grichard\Portal\Account;

/**
 * Règle des mots de passe des clients : longueur minimale (recommandations ANSSI et NIST : la longueur prime sur les règles de
 * composition), plafond pour borner le coût d'Argon2id, et confirmation identique. Aucune règle de caractères imposés.
 */
final class PasswordPolicy
{
    public const MIN_LENGTH = 12;
    public const MAX_LENGTH = 4096;

    /** @return string|null message d'erreur, ou null si le mot de passe est accepté */
    public static function check(string $password, string $confirm): ?string
    {
        $length = mb_strlen($password);
        if ($length < self::MIN_LENGTH) {
            return \sprintf('Le mot de passe doit faire au moins %d caractères (une phrase de passe convient très bien).', self::MIN_LENGTH);
        }
        if ($length > self::MAX_LENGTH) {
            return 'Le mot de passe est trop long.';
        }
        if ($password !== $confirm) {
            return 'Les deux mots de passe ne correspondent pas.';
        }

        return null;
    }
}

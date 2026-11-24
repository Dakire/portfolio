<?php

declare(strict_types=1);

namespace Grichard\Portal\Security;

use Grichard\Portal\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Connexion refusée tant que l'adresse e-mail n'est pas confirmée. Contrôle fait APRÈS la vérification du mot de passe : le
 * message particulier ne révèle donc l'existence d'un compte qu'à qui en connaît déjà le mot de passe.
 */
final class UserChecker implements UserCheckerInterface
{
    public const UNVERIFIED = 'unverified';

    public function checkPreAuth(UserInterface $user): void {}

    public function checkPostAuth(UserInterface $user, ?\Symfony\Component\Security\Core\Authentication\Token\TokenInterface $token = null): void
    {
        if ($user instanceof User && !$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException(self::UNVERIFIED);
        }
    }
}

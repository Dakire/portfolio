<?php

declare(strict_types=1);

namespace Grichard\Portal\Account;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Entity\UserToken;
use Grichard\Portal\Repository\UserTokenRepository;

/**
 * Jetons à usage unique des liens envoyés par e-mail. Le jeton en clair (256 bits aléatoires) ne vit que dans le lien ; la base
 * garde son empreinte SHA-256. Un nouveau lien annule le précédent pour le même usage ; un lien sert une seule fois.
 */
final readonly class TokenService
{
    public const VERIFY_TTL = 'PT48H';
    public const RESET_TTL = 'PT1H';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserTokenRepository $tokens,
    ) {}

    /** @return non-empty-string le jeton en clair, à placer dans le lien */
    public function issue(User $user, string $purpose): string
    {
        $this->tokens->deleteExpired();
        $this->tokens->deleteFor($user, $purpose);
        $raw = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        if ('' === $raw) {
            throw new \LogicException('Jeton vide.'); // impossible : 32 octets donnent 43 caractères
        }
        $ttl = UserToken::VERIFY === $purpose ? self::VERIFY_TTL : self::RESET_TTL;
        $this->entityManager->persist(new UserToken($user, $purpose, self::hash($raw), new \DateTimeImmutable()->add(new \DateInterval($ttl))));
        $this->entityManager->flush();

        return $raw;
    }

    /** Utilisateur du jeton s'il est valable (bon usage, non expiré), sans le consommer. */
    public function peek(string $raw, string $purpose): ?User
    {
        $token = $this->tokens->findByHash(self::hash($raw));

        return null !== $token && $token->getPurpose() === $purpose && !$token->isExpired() ? $token->getUser() : null;
    }

    /** Utilisateur du jeton s'il est valable ; le jeton est alors supprimé (usage unique). */
    public function consume(string $raw, string $purpose): ?User
    {
        $token = $this->tokens->findByHash(self::hash($raw));
        if (null === $token || $token->getPurpose() !== $purpose) {
            return null;
        }
        $user = $token->getUser();
        $expired = $token->isExpired();
        $this->entityManager->remove($token);
        $this->entityManager->flush();

        return $expired ? null : $user;
    }

    private static function hash(string $raw): string
    {
        return hash('sha256', $raw);
    }
}

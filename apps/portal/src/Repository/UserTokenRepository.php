<?php

declare(strict_types=1);

namespace Grichard\Portal\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Entity\UserToken;

/** @extends ServiceEntityRepository<UserToken> */
final class UserTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserToken::class);
    }

    public function findByHash(string $hash): ?UserToken
    {
        return $this->findOneBy(['tokenHash' => $hash]);
    }

    /** Supprime les jetons d'un utilisateur pour un usage donné (un seul lien valable à la fois). */
    public function deleteFor(User $user, string $purpose): void
    {
        $this->createQueryBuilder('t')
            ->delete()
            ->where('t.user = :user AND t.purpose = :purpose')
            ->setParameter('user', $user)
            ->setParameter('purpose', $purpose)
            ->getQuery()
            ->execute();
    }

    /** Ménage opportuniste (aucune tâche planifiée sur l'hébergement) : jetons expirés. */
    public function deleteExpired(): void
    {
        $this->createQueryBuilder('t')
            ->delete()
            ->where('t.expiresAt <= :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }
}

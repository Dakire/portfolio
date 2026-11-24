<?php

declare(strict_types=1);

namespace Grichard\Portal\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Exception as DbalException;
use Doctrine\Persistence\ManagerRegistry;
use Grichard\Portal\Entity\User;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/** @extends ServiceEntityRepository<User> */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Nombre d'utilisateurs ; 0 aussi tant que la base n'est pas initialisée (table absente).
     *
     * @phpstan-impure
     */
    public function countAll(): int
    {
        try {
            return $this->count([]);
        } catch (DbalException) {
            return 0;
        }
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => strtolower(trim($email))]);
    }

    /**
     * Ménage opportuniste (aucune tâche planifiée sur l'hébergement) : comptes jamais vérifiés après 7 jours.
     *
     * @return int nombre de comptes supprimés
     */
    public function deleteStaleUnverified(): int
    {
        $limit = new \DateTimeImmutable('-7 days');
        $stale = $this->createQueryBuilder('u')
            ->where('u.verifiedAt IS NULL AND u.createdAt < :limit')
            ->setParameter('limit', $limit)
            ->getQuery()
            ->getResult();
        $em = $this->getEntityManager();
        foreach ($stale as $user) {
            \assert($user instanceof User);
            $em->getConnection()->executeStatement('DELETE FROM user_token WHERE user_id = ?', [$user->getId()]);
            $em->remove($user);
        }
        $em->flush();

        return \count($stale);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(\sprintf('Instance de "%s" attendue.', User::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->flush();
    }
}

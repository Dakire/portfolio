<?php

declare(strict_types=1);

namespace Grichard\Portal\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Grichard\Portal\Entity\Licence;
use Grichard\Portal\Entity\User;

/** @extends ServiceEntityRepository<Licence> */
final class LicenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Licence::class);
    }

    public function findByKey(string $key): ?Licence
    {
        return $this->findOneBy(['licenceKey' => strtoupper(trim($key))]);
    }

    /** @return list<Licence> */
    public function forUser(User $user): array
    {
        return $this->findBy(['user' => $user], ['createdAt' => 'DESC']);
    }

    /** @return list<Licence> */
    public function forSubscription(string $subscriptionId): array
    {
        return $this->findBy(['paddleSubscriptionId' => $subscriptionId]);
    }

    /** @return list<Licence> */
    public function forTransaction(string $transactionId): array
    {
        return $this->findBy(['paddleTransactionId' => $transactionId]);
    }

    /** Licence perpétuelle du même client pour le même produit (prolongation des mises à jour). */
    public function findPerpetual(string $email, string $product): ?Licence
    {
        return $this->findOneBy(['email' => $email, 'product' => $product, 'validUntil' => null], ['createdAt' => 'DESC']);
    }

    /** @return list<Licence> licences sans compte (achat avant inscription), à rattacher quand le client crée son compte */
    public function unattachedFor(string $email): array
    {
        return $this->findBy(['user' => null, 'email' => $email]);
    }

    /** Rattache au compte les licences achetées avec son adresse avant l'inscription (adresse confirmée seulement). */
    public function attachPending(User $user): int
    {
        if (!$user->isVerified()) {
            return 0;
        }
        $pending = $this->unattachedFor($user->getEmail());
        foreach ($pending as $licence) {
            $licence->attachTo($user);
        }
        $this->getEntityManager()->flush();

        return \count($pending);
    }

    /** Compte supprimé : ses licences restent valables (achat payé) mais ne sont plus rattachées à aucun compte. */
    public function detachAll(User $user): void
    {
        $this->getEntityManager()->getConnection()->executeStatement('UPDATE licence SET user_id = NULL WHERE user_id = ?', [$user->getId()]);
    }

    /** @return list<Licence> */
    public function latest(int $limit = 100): array
    {
        return $this->findBy([], ['createdAt' => 'DESC'], $limit);
    }
}

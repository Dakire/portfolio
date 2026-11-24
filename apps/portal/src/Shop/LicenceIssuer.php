<?php

declare(strict_types=1);

namespace Grichard\Portal\Shop;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\Licence;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\LicenceRepository;

/** Crée ou prolonge la licence correspondant à un achat (notification Paddle, ou attribution par l'administrateur). */
final readonly class LicenceIssuer
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private LicenceRepository $licences,
    ) {}

    /**
     * @param \DateTimeImmutable|null $periodEnd fin de la période payée (abonnement)
     *
     * @return Licence|null null si la formule n'existe pas, ou si une prolongation ne trouve pas de licence à prolonger
     */
    public function issue(
        string $email,
        ?User $user,
        string $product,
        string $plan,
        ?string $transactionId = null,
        ?string $subscriptionId = null,
        ?\DateTimeImmutable $periodEnd = null,
        \DateTimeImmutable $now = new \DateTimeImmutable(),
    ): ?Licence {
        $offer = Offer::find($product, $plan);
        if (null === $offer) {
            return null;
        }
        $email = strtolower(trim($email));

        if (Offer::UPDATES === $offer['kind']) {
            $licence = $this->licences->findPerpetual($email, $product);
            if (null === $licence) {
                return null;
            }
            // Prolongation à partir de la date la plus tardive : fin actuelle des mises à jour, ou aujourd'hui
            $from = max($licence->getUpdatesUntil() ?? $now, $now);
            $licence->setUpdatesUntil($from->add(new \DateInterval($offer['updates'] ?? 'P1Y')));
            // Volontairement sans rattacher la transaction : son remboursement ne doit pas révoquer la licence perpétuelle
            $this->entityManager->flush();

            return $licence;
        }

        // Renouvellement d'abonnement : même licence, période prolongée
        if (null !== $subscriptionId && [] !== ($existing = $this->licences->forSubscription($subscriptionId))) {
            $licence = $existing[0];
            $licence->setValidUntil($periodEnd);
            $licence->reactivate();
            $licence->linkPaddle($transactionId, null);
            $this->entityManager->flush();

            return $licence;
        }

        $licence = new Licence($user, $email, $product, $plan);
        $licence->linkPaddle($transactionId, $subscriptionId);
        if (Offer::SUBSCRIPTION === $offer['kind']) {
            $licence->setValidUntil($periodEnd ?? $now->add(new \DateInterval('P1M')));
        }
        if (null !== $offer['updates']) {
            $licence->setUpdatesUntil($now->add(new \DateInterval($offer['updates'])));
        }
        $this->entityManager->persist($licence);
        $this->entityManager->flush();

        return $licence;
    }
}

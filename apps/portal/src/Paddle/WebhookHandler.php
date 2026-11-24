<?php

declare(strict_types=1);

namespace Grichard\Portal\Paddle;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Repository\UserRepository;
use Grichard\Portal\Shop\LicenceIssuer;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Effet de chaque notification Paddle (Billing) sur les licences :
 *  - transaction.completed : une licence par article payé (création, renouvellement d'abonnement ou prolongation des mises à
 *    jour). Le client est identifié par custom_data.user_id (posé par la page de paiement de l'espace client) ou, à défaut,
 *    par custom_data.email ; sans l'un ni l'autre, la licence attend d'être rattachée par l'administrateur ;
 *  - subscription.updated / subscription.canceled : fin de période et état de l'abonnement ;
 *  - adjustment.created / adjustment.updated : un remboursement approuvé révoque les licences de la transaction.
 * Les autres événements sont acceptés et ignorés. Rien de la notification n'est stocké hors de ces effets.
 */
final readonly class WebhookHandler
{
    public function __construct(
        private PriceMap $prices,
        private LicenceIssuer $issuer,
        private LicenceRepository $licences,
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        #[Autowire(service: 'monolog.logger.portal')]
        private LoggerInterface $logger,
    ) {}

    /** @param array<string, mixed> $event */
    public function handle(array $event): string
    {
        $type = \is_string($event['event_type'] ?? null) ? $event['event_type'] : '';
        $data = \is_array($event['data'] ?? null) ? $event['data'] : [];

        return match ($type) {
            'transaction.completed' => $this->transactionCompleted($data),
            'subscription.updated', 'subscription.canceled', 'subscription.activated' => $this->subscriptionChanged($data),
            'adjustment.created', 'adjustment.updated' => $this->adjustment($data),
            default => 'ignoré',
        };
    }

    /** @param array<mixed> $data */
    private function transactionCompleted(array $data): string
    {
        $transactionId = self::string($data, 'id');
        $subscriptionId = self::string($data, 'subscription_id');
        $custom = \is_array($data['custom_data'] ?? null) ? $data['custom_data'] : [];
        $user = null;
        if (isset($custom['user_id']) && is_numeric($custom['user_id'])) {
            $user = $this->users->find((int) $custom['user_id']);
        }
        $email = $user?->getEmail() ?? (\is_string($custom['email'] ?? null) ? strtolower(trim($custom['email'])) : '');
        if (null === $user && '' !== $email) {
            $user = $this->users->findByEmail($email);
            $user = $user instanceof User && $user->isVerified() ? $user : null;
        }
        $periodEnd = null;
        if (\is_array($data['billing_period'] ?? null) && \is_string($data['billing_period']['ends_at'] ?? null)) {
            $periodEnd = new \DateTimeImmutable($data['billing_period']['ends_at']);
        }

        $issued = 0;
        foreach (\is_array($data['items'] ?? null) ? $data['items'] : [] as $item) {
            $priceId = \is_array($item) && \is_array($item['price'] ?? null) ? self::string($item['price'], 'id') : null;
            $target = null === $priceId ? null : $this->prices->find($priceId);
            if (null === $target) {
                $this->logger->warning('paddle : prix inconnu, article ignoré', ['transaction' => $transactionId, 'prix' => $priceId]);
                continue;
            }
            $licence = $this->issuer->issue($email, $user, $target['product'], $target['plan'], $transactionId, $subscriptionId, $periodEnd);
            if (null === $licence) {
                $this->logger->warning('paddle : aucune licence à créer ou prolonger', ['transaction' => $transactionId, 'formule' => $target['plan']]);
                continue;
            }
            ++$issued;
        }
        $this->logger->info('paddle : transaction traitée', ['transaction' => $transactionId, 'licences' => $issued, 'client' => $user?->getId()]);

        return \sprintf('%d licence(s)', $issued);
    }

    /** @param array<mixed> $data */
    private function subscriptionChanged(array $data): string
    {
        $subscriptionId = self::string($data, 'id');
        if (null === $subscriptionId) {
            return 'ignoré';
        }
        $status = self::string($data, 'status');
        $periodEnd = \is_array($data['current_billing_period'] ?? null) && \is_string($data['current_billing_period']['ends_at'] ?? null)
            ? new \DateTimeImmutable($data['current_billing_period']['ends_at'])
            : null;
        $licences = $this->licences->forSubscription($subscriptionId);
        foreach ($licences as $licence) {
            if (null !== $periodEnd) {
                $licence->setValidUntil($periodEnd);
            }
            if ('canceled' === $status) {
                $licence->cancel();
            } elseif ('active' === $status || 'trialing' === $status) {
                $licence->reactivate();
            }
        }
        $this->entityManager->flush();

        return \sprintf('%d licence(s) mise(s) à jour', \count($licences));
    }

    /** @param array<mixed> $data */
    private function adjustment(array $data): string
    {
        $transactionId = self::string($data, 'transaction_id');
        if (null === $transactionId || 'approved' !== self::string($data, 'status') || !\in_array(self::string($data, 'action'), ['refund', 'chargeback'], true)) {
            return 'ignoré';
        }
        $licences = $this->licences->forTransaction($transactionId);
        foreach ($licences as $licence) {
            $licence->revoke();
        }
        $this->entityManager->flush();
        $this->logger->info('paddle : remboursement, licences révoquées', ['transaction' => $transactionId, 'licences' => \count($licences)]);

        return \sprintf('%d licence(s) révoquée(s)', \count($licences));
    }

    /** @param array<mixed> $data */
    private static function string(array $data, string $key): ?string
    {
        return \is_string($data[$key] ?? null) && '' !== $data[$key] ? $data[$key] : null;
    }
}

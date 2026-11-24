<?php

declare(strict_types=1);

namespace Grichard\Portal\Entity;

use Doctrine\ORM\Mapping as ORM;
use Grichard\Portal\Repository\LicenceRepository;

/**
 * Licence d'un produit (ADR 0017). Les produits la vérifient hors ligne grâce au jeton signé (Licence\LicenceSigner) et ne
 * rappellent le site qu'à échéance : l'état ici (active, résiliée, révoquée) est la référence de ces renouvellements.
 */
#[ORM\Entity(repositoryClass: LicenceRepository::class)]
#[ORM\Table(name: 'licence')]
#[ORM\UniqueConstraint(name: 'uniq_licence_key', columns: ['licence_key'])]
#[ORM\Index(name: 'idx_licence_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_licence_subscription', columns: ['paddle_subscription_id'])]
#[ORM\Index(name: 'idx_licence_transaction', columns: ['paddle_transaction_id'])]
class Licence
{
    public const ACTIVE = 'active';
    /** Abonnement résilié : la licence reste valable jusqu'à la fin de la période payée (validUntil). */
    public const CANCELLED = 'cancelled';
    /** Remboursement ou fraude : la licence ne vaut plus rien, même avant son échéance. */
    public const REVOKED = 'revoked';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 32)]
    private string $licenceKey;

    #[ORM\Column(length: 16)]
    private string $status = self::ACTIVE;

    /** Fin de validité (abonnement : fin de la période payée) ; null : licence perpétuelle. */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $validUntil = null;

    /** Fin des mises à jour ; null : sans limite. */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatesUntil = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $paddleSubscriptionId = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $paddleTransactionId = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\ManyToOne]
        #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
        private ?User $user,
        #[ORM\Column(length: 180)]
        private string $email,
        #[ORM\Column(length: 64)]
        private string $product,
        #[ORM\Column(length: 32)]
        private string $plan,
    ) {
        $this->createdAt = new \DateTimeImmutable();
        $this->licenceKey = self::newKey();
    }

    /** Clé lisible et non devinable : GR-XXXX-XXXX-XXXX-XXXX (alphabet sans 0/O ni 1/I/L). */
    public static function newKey(): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $groups = [];
        for ($g = 0; $g < 4; ++$g) {
            $chunk = '';
            for ($i = 0; $i < 4; ++$i) {
                $chunk .= $alphabet[random_int(0, \strlen($alphabet) - 1)];
            }
            $groups[] = $chunk;
        }

        return 'GR-' . implode('-', $groups);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getKey(): string
    {
        return $this->licenceKey;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function attachTo(User $user): void
    {
        $this->user = $user;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getProduct(): string
    {
        return $this->product;
    }

    public function getPlan(): string
    {
        return $this->plan;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getValidUntil(): ?\DateTimeImmutable
    {
        return $this->validUntil;
    }

    public function getUpdatesUntil(): ?\DateTimeImmutable
    {
        return $this->updatesUntil;
    }

    public function getPaddleSubscriptionId(): ?string
    {
        return $this->paddleSubscriptionId;
    }

    public function getPaddleTransactionId(): ?string
    {
        return $this->paddleTransactionId;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setValidUntil(?\DateTimeImmutable $validUntil): void
    {
        $this->validUntil = $validUntil;
    }

    public function setUpdatesUntil(?\DateTimeImmutable $updatesUntil): void
    {
        $this->updatesUntil = $updatesUntil;
    }

    public function linkPaddle(?string $transactionId, ?string $subscriptionId): void
    {
        $this->paddleTransactionId = $transactionId ?? $this->paddleTransactionId;
        $this->paddleSubscriptionId = $subscriptionId ?? $this->paddleSubscriptionId;
    }

    public function cancel(): void
    {
        if (self::REVOKED !== $this->status) {
            $this->status = self::CANCELLED;
        }
    }

    public function reactivate(): void
    {
        if (self::REVOKED !== $this->status) {
            $this->status = self::ACTIVE;
        }
    }

    public function revoke(): void
    {
        $this->status = self::REVOKED;
    }

    /** Utilisable maintenant : non révoquée, et dans sa période de validité s'il y en a une. */
    public function isUsable(\DateTimeImmutable $now = new \DateTimeImmutable()): bool
    {
        return self::REVOKED !== $this->status && (null === $this->validUntil || $this->validUntil > $now);
    }

    /** Donne droit aux mises à jour publiées à la date indiquée. */
    public function coversUpdatesAt(\DateTimeImmutable $date): bool
    {
        return $this->isUsable() && (null === $this->updatesUntil || $this->updatesUntil >= $date);
    }
}

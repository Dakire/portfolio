<?php

declare(strict_types=1);

namespace Grichard\Portal\Entity;

use Doctrine\ORM\Mapping as ORM;
use Grichard\Portal\Repository\UserTokenRepository;

/**
 * Jeton à usage unique envoyé par e-mail (vérification de l'adresse, réinitialisation du mot de passe). Seule l'empreinte
 * SHA-256 du jeton est stockée : une copie de la base ne permet pas de s'en servir.
 */
#[ORM\Entity(repositoryClass: UserTokenRepository::class)]
#[ORM\Table(name: 'user_token')]
#[ORM\UniqueConstraint(name: 'uniq_user_token_hash', columns: ['token_hash'])]
#[ORM\Index(name: 'idx_user_token_user', columns: ['user_id'])]
class UserToken
{
    public const VERIFY = 'verify';
    public const RESET = 'reset';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        #[ORM\ManyToOne]
        #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
        private User $user,
        #[ORM\Column(length: 16)]
        private string $purpose,
        #[ORM\Column(length: 64)]
        private string $tokenHash,
        #[ORM\Column]
        private \DateTimeImmutable $expiresAt,
    ) {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getPurpose(): string
    {
        return $this->purpose;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isExpired(\DateTimeImmutable $now = new \DateTimeImmutable()): bool
    {
        return $this->expiresAt <= $now;
    }
}

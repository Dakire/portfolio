<?php

declare(strict_types=1);

namespace Grichard\Portal\Entity;

use Doctrine\ORM\Mapping as ORM;
use Grichard\Portal\Repository\UserRepository;
use Scheb\TwoFactorBundle\Model\BackupCodeInterface;
use Scheb\TwoFactorBundle\Model\Totp\TotpConfiguration;
use Scheb\TwoFactorBundle\Model\Totp\TotpConfigurationInterface;
use Scheb\TwoFactorBundle\Model\Totp\TwoFactorInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'app_user')]
#[ORM\UniqueConstraint(name: 'uniq_app_user_email', columns: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface, TwoFactorInterface, BackupCodeInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** @var list<string> */
    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastLoginAt = null;

    /** Adresse e-mail confirmée par le lien reçu ; sans elle, la connexion est refusée (Security\UserChecker). */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $verifiedAt = null;

    /** Secret TOTP (base32) ; null : double authentification désactivée. */
    #[ORM\Column(length: 64, nullable: true)]
    private ?string $totpSecret = null;

    /** @var list<string> empreintes (password_hash) des codes de secours encore valables ; jamais les codes en clair */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $backupCodes = null;

    public function __construct(
        #[ORM\Column(length: 180)]
        private string $email,
        #[ORM\Column]
        private string $password,
    ) {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    /** @return non-empty-string */
    public function getUserIdentifier(): string
    {
        return '' !== $this->email ? $this->email : throw new \LogicException('Un utilisateur sans e-mail est invalide.');
    }

    /** @return list<string> */
    public function getRoles(): array
    {
        return array_values(array_unique([...$this->roles, 'ROLE_USER']));
    }

    /** @param list<string> $roles */
    public function setRoles(array $roles): void
    {
        $this->roles = $roles;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $hash): void
    {
        $this->password = $hash;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getLastLoginAt(): ?\DateTimeImmutable
    {
        return $this->lastLoginAt;
    }

    public function recordLogin(): void
    {
        $this->lastLoginAt = new \DateTimeImmutable();
    }

    public function isVerified(): bool
    {
        return null !== $this->verifiedAt;
    }

    public function getVerifiedAt(): ?\DateTimeImmutable
    {
        return $this->verifiedAt;
    }

    public function markVerified(): void
    {
        $this->verifiedAt ??= new \DateTimeImmutable();
    }

    // ---- Double authentification (scheb/2fa) ----

    public function isTotpAuthenticationEnabled(): bool
    {
        return null !== $this->totpSecret;
    }

    public function getTotpAuthenticationUsername(): string
    {
        return $this->email;
    }

    public function getTotpAuthenticationConfiguration(): ?TotpConfigurationInterface
    {
        return null === $this->totpSecret ? null : new TotpConfiguration($this->totpSecret, TotpConfiguration::ALGORITHM_SHA1, 30, 6);
    }

    /**
     * Active la double authentification et remplace les codes de secours.
     *
     * @param list<string> $backupCodes codes en clair, montrés une seule fois à l'utilisateur ; seules leurs empreintes sont gardées
     */
    public function enableTotp(string $secret, array $backupCodes): void
    {
        $this->totpSecret = $secret;
        $this->backupCodes = array_map(static fn(string $code): string => password_hash(self::normalizeCode($code), \PASSWORD_DEFAULT), $backupCodes);
    }

    public function disableTotp(): void
    {
        $this->totpSecret = null;
        $this->backupCodes = null;
    }

    public function countBackupCodes(): int
    {
        return \count($this->backupCodes ?? []);
    }

    public function isBackupCode(string $code): bool
    {
        return null !== $this->findBackupCode($code);
    }

    public function invalidateBackupCode(string $code): void
    {
        $index = $this->findBackupCode($code);
        if (null !== $index && null !== $this->backupCodes) {
            $codes = $this->backupCodes;
            unset($codes[$index]);
            $this->backupCodes = array_values($codes);
        }
    }

    private function findBackupCode(string $code): ?int
    {
        $code = self::normalizeCode($code);
        if ('' === $code) {
            return null;
        }
        foreach ($this->backupCodes ?? [] as $index => $hash) {
            if (password_verify($code, $hash)) {
                return $index;
            }
        }

        return null;
    }

    /** Tiret, espaces et casse ignorés : « ab12c-3de45 », « AB12C3DE45 » et « ab12c 3de45 » désignent le même code. */
    private static function normalizeCode(string $code): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $code) ?? '');
    }

    public function eraseCredentials(): void {}
}

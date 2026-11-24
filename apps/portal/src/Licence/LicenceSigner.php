<?php

declare(strict_types=1);

namespace Grichard\Portal\Licence;

use Grichard\Portal\Entity\Licence;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Jeton de licence signé (Ed25519) : « GRL1.<charge utile base64url>.<signature base64url> ». La charge utile est un JSON
 * court, vérifiable hors ligne par les produits avec la clé publique (voir docs/licences.md et packages/licence) :
 *   v (version du format), kid (identifiant de la clé), lic (clé de licence), prod, plan, iat (émission, secondes Unix),
 *   exp (fin de validité, avec 7 jours de grâce pour un abonnement ; null : perpétuelle), upd (fin des mises à jour ; null :
 *   sans limite).
 * Aucune donnée personnelle (ni e-mail, ni nom) dans le jeton.
 * Clé privée : private/portal.php (licence_key, base64 de 64 octets) ; sans elle, rien n'est signé.
 */
final readonly class LicenceSigner
{
    public const PREFIX = 'GRL1';
    public const GRACE = 'P7D';

    public function __construct(
        #[Autowire('%env(PORTAL_LICENCE_KEY)%')]
        private string $secretKey,
    ) {}

    public function isConfigured(): bool
    {
        return 64 === \strlen($this->secret());
    }

    /** Clé publique en base64, à intégrer dans chaque produit. */
    public function publicKey(): string
    {
        return base64_encode(sodium_crypto_sign_publickey_from_secretkey($this->requireSecret()));
    }

    /** Identifiant court de la clé (8 caractères hexadécimaux), pour préparer un éventuel changement de clé. */
    public function keyId(): string
    {
        return substr(hash('sha256', base64_decode($this->publicKey(), true) ?: ''), 0, 8);
    }

    public function token(Licence $licence, \DateTimeImmutable $now = new \DateTimeImmutable()): string
    {
        $validUntil = $licence->getValidUntil();
        $payload = [
            'v' => 1,
            'kid' => $this->keyId(),
            'lic' => $licence->getKey(),
            'prod' => $licence->getProduct(),
            'plan' => $licence->getPlan(),
            'iat' => $now->getTimestamp(),
            'exp' => $validUntil?->add(new \DateInterval(self::GRACE))->getTimestamp(),
            'upd' => $licence->getUpdatesUntil()?->getTimestamp(),
        ];
        $body = self::b64(json_encode($payload, \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES));
        $signature = sodium_crypto_sign_detached(self::PREFIX . '.' . $body, $this->requireSecret());

        return self::PREFIX . '.' . $body . '.' . self::b64($signature);
    }

    /**
     * Charge utile d'un jeton dont la signature est valable (sans contrôle d'échéance : à l'appelant d'en décider).
     *
     * @return array<string, mixed>|null
     */
    public function verify(string $token): ?array
    {
        $parts = explode('.', trim($token));
        if (3 !== \count($parts) || self::PREFIX !== $parts[0]) {
            return null;
        }
        $signature = self::unb64($parts[2]);
        $json = self::unb64($parts[1]);
        $public = base64_decode($this->publicKey(), true);
        if (null === $signature || null === $json || false === $public || '' === $public || \SODIUM_CRYPTO_SIGN_BYTES !== \strlen($signature)) {
            return null;
        }
        if (!sodium_crypto_sign_verify_detached($signature, self::PREFIX . '.' . $parts[1], $public)) {
            return null;
        }
        $payload = json_decode($json, true);

        return \is_array($payload) ? $payload : null;
    }

    private function secret(): string
    {
        $raw = base64_decode($this->secretKey, true);

        return false === $raw ? '' : $raw;
    }

    /** @return non-empty-string */
    private function requireSecret(): string
    {
        $secret = $this->secret();
        if (64 !== \strlen($secret)) {
            throw new \LogicException('Clé de signature des licences absente ou invalide (private/portal.php : licence_key).');
        }

        return $secret;
    }

    private static function b64(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private static function unb64(string $text): ?string
    {
        $raw = base64_decode(strtr($text, '-_', '+/'), true);

        return false === $raw ? null : $raw;
    }
}

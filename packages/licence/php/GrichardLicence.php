<?php
/**
 * Vérification des licences grichard.eu pour les modules PrestaShop (ADR 0017, docs/licences.md).
 *
 * Un seul fichier, sans espace de noms ni dépendance, compatible PHP 7.2 à 8.x : à copier dans le module (classes/).
 * Ed25519 par l'extension sodium (fournie avec PHP depuis 7.2) ou, si l'hébergeur l'a désactivée, par paragonie/sodium_compat
 * chargé par le module. Le jeton se vérifie HORS LIGNE ; l'API n'est appelée que pour le renouveler ou chercher une mise à jour.
 *
 * Format : « GRL1.<charge utile base64url>.<signature Ed25519 base64url> » ; charge utile { v, kid, lic, prod, plan, iat, exp,
 * upd } (secondes Unix ; exp et upd valent null sans limite).
 */
final class GrichardLicence
{
    const PREFIX = 'GRL1';
    const REFRESH_BEFORE = 259200; // 3 jours
    const REFRESH_AFTER = 604800; // 7 jours

    /** @var string */
    private $publicKey;

    /** @var string */
    private $product;

    /**
     * @param string $publicKeyBase64 clé publique (GET /espace/api/licence/cle-publique), intégrée au module
     * @param string $product         identifiant du produit, ex. « prevenez-moi-rupture »
     */
    public function __construct($publicKeyBase64, $product)
    {
        $key = base64_decode((string) $publicKeyBase64, true);
        if (false === $key || 32 !== strlen($key)) {
            throw new InvalidArgumentException('Clé publique Ed25519 invalide.');
        }
        $this->publicKey = $key;
        $this->product = (string) $product;
    }

    /**
     * @param string   $token jeton collé dans la configuration du module
     * @param int|null $now   secondes Unix (tests)
     *
     * @return array{valid: bool, reason: string, payload: array|null, needsRefresh: bool}
     *               reason : ok, format, signature, produit ou expiree
     */
    public function verify($token, $now = null)
    {
        $now = null === $now ? time() : (int) $now;
        $parts = explode('.', trim((string) $token));
        if (3 !== count($parts) || self::PREFIX !== $parts[0]) {
            return self::result('format');
        }
        $json = self::fromBase64Url($parts[1]);
        $signature = self::fromBase64Url($parts[2]);
        $payload = null === $json ? null : json_decode($json, true);
        if (!is_array($payload) || !isset($payload['v']) || 1 !== $payload['v'] || null === $signature || 64 !== strlen($signature)) {
            return self::result('format');
        }
        if (!sodium_crypto_sign_verify_detached($signature, self::PREFIX . '.' . $parts[1], $this->publicKey)) {
            return self::result('signature');
        }
        if (!isset($payload['prod']) || $payload['prod'] !== $this->product) {
            return self::result('produit', $payload);
        }
        $exp = isset($payload['exp']) ? (int) $payload['exp'] : null;
        if (null !== $exp && $exp <= $now) {
            return self::result('expiree', $payload, true);
        }
        $iat = isset($payload['iat']) ? (int) $payload['iat'] : 0;
        $needsRefresh = (null !== $exp && $exp - $now < self::REFRESH_BEFORE) || $now - $iat > self::REFRESH_AFTER;

        return array('valid' => true, 'reason' => 'ok', 'payload' => $payload, 'needsRefresh' => $needsRefresh);
    }

    /**
     * La licence couvre-t-elle une version publiée à cette date ? (mises à jour incluses jusqu'à « upd »)
     *
     * @param array $payload
     * @param int   $publishedAt secondes Unix
     */
    public static function coversUpdate(array $payload, $publishedAt)
    {
        return !isset($payload['upd']) || (int) $payload['upd'] >= (int) $publishedAt;
    }

    /** @return string|null */
    private static function fromBase64Url($text)
    {
        $raw = base64_decode(strtr((string) $text, '-_', '+/'), true);

        return false === $raw ? null : $raw;
    }

    private static function result($reason, $payload = null, $needsRefresh = false)
    {
        return array('valid' => false, 'reason' => $reason, 'payload' => $payload, 'needsRefresh' => $needsRefresh);
    }
}

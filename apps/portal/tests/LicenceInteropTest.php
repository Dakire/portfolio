<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Grichard\Portal\Licence\LicenceSigner;
use Grichard\Portal\Shop\LicenceIssuer;

/**
 * Le vérificateur embarqué dans les modules PrestaShop (packages/licence/php/GrichardLicence.php) doit accepter exactement les
 * jetons que signe le portail, et refuser le reste.
 */
final class LicenceInteropTest extends PortalTestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once \dirname(__DIR__, 3) . '/packages/licence/php/GrichardLicence.php';
    }

    public function testModuleVerifierAcceptsPortalTokensAndRejectsOthers(): void
    {
        $this->migratedClient();
        $signer = $this->service(LicenceSigner::class);
        $licence = $this->service(LicenceIssuer::class)->issue('m@example.org', null, 'prevenez-moi-rupture', 'licence');
        self::assertNotNull($licence);
        $token = $signer->token($licence);

        $verifier = new \GrichardLicence($signer->publicKey(), 'prevenez-moi-rupture');
        $check = $verifier->verify($token);
        self::assertTrue($check['valid']);
        self::assertSame($licence->getKey(), $check['payload']['lic'] ?? null);
        self::assertFalse($check['needsRefresh']);
        self::assertTrue(\GrichardLicence::coversUpdate((array) $check['payload'], time()));

        self::assertSame('produit', new \GrichardLicence($signer->publicKey(), 'standup-slack')->verify($token)['reason']);
        $otherKey = base64_encode(sodium_crypto_sign_publickey(sodium_crypto_sign_seed_keypair(str_repeat('x', 32))));
        self::assertSame('signature', new \GrichardLicence($otherKey, 'prevenez-moi-rupture')->verify($token)['reason']);
        self::assertSame('format', $verifier->verify('GRL1.pas.unjeton')['reason']);
    }

    public function testSubscriptionTokenExpiresWithItsGracePeriod(): void
    {
        $this->migratedClient();
        $signer = $this->service(LicenceSigner::class);
        $end = new \DateTimeImmutable('+10 days');
        $licence = $this->service(LicenceIssuer::class)->issue('s@example.org', null, 'youtube-regarder-plus-tard', 'pro', null, 'sub_x', $end);
        self::assertNotNull($licence);
        $verifier = new \GrichardLicence($signer->publicKey(), 'youtube-regarder-plus-tard');
        $token = $signer->token($licence);

        self::assertTrue($verifier->verify($token)['valid']);
        $graceEnd = $end->add(new \DateInterval(LicenceSigner::GRACE))->getTimestamp();
        self::assertTrue($verifier->verify($token, $graceEnd - 3600)['needsRefresh']);
        self::assertSame('expiree', $verifier->verify($token, $graceEnd)['reason']);
    }
}

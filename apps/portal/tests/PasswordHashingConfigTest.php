<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\NativePasswordHasher;
use Symfony\Component\Yaml\Yaml;

/** Les tests tournent avec un hachage bon marché ; ici on vérifie les paramètres RÉELS de production (security.yaml). */
final class PasswordHashingConfigTest extends TestCase
{
    public function testProductionUsesArgon2idWithAcceptedParameters(): void
    {
        $config = Yaml::parseFile(\dirname(__DIR__) . '/config/packages/security.yaml');
        self::assertIsArray($config);
        $hasher = $config['security']['password_hashers']['Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface'];

        self::assertSame('argon2id', $hasher['algorithm']);
        self::assertGreaterThanOrEqual(12288, $hasher['memory_cost'], 'minimum OWASP : 12 Mio');
        self::assertGreaterThanOrEqual(3, $hasher['time_cost']);

        $native = new NativePasswordHasher(opsLimit: $hasher["time_cost"], memLimit: $hasher["memory_cost"] * 1024, algorithm: PASSWORD_ARGON2ID);
        $hash = $native->hash('un mot de passe assez long');
        self::assertStringStartsWith('$argon2id$', $hash);
        self::assertTrue($native->verify($hash, 'un mot de passe assez long'));
        self::assertFalse($native->verify($hash, 'un autre mot de passe'));
    }
}

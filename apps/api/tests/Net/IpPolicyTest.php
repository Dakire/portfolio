<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Net;

use Grichard\Api\Net\IpPolicy;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class IpPolicyTest extends TestCase
{
    /** @return iterable<string, array{string}> */
    public static function blocked(): iterable
    {
        foreach ([
            '0.0.0.0', '10.0.0.1', '10.255.255.255', '100.64.0.1', '127.0.0.1', '127.255.0.9', '169.254.169.254',
            '172.16.0.1', '172.31.255.255', '192.0.0.8', '192.0.2.10', '192.168.1.1', '198.18.0.1', '198.51.100.7',
            '203.0.113.5', '224.0.0.1', '239.255.255.250', '240.0.0.1', '255.255.255.255',
            '::', '::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '::ffff:8.8.8.8', '64:ff9b::7f00:1', '2001::1',
            '2001:db8::1', '2002:7f00:1::1', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'fec0::1', 'ff02::1',
            'pas-une-ip', '', '1.2.3', '256.1.1.1',
        ] as $ip) {
            yield '« ' . $ip . ' »' => [$ip];
        }
    }

    /** @return iterable<string, array{string}> */
    public static function allowed(): iterable
    {
        foreach (['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.15.255.255', '172.32.0.1', '100.63.255.255', '100.128.0.1', '2606:4700:4700::1111', '2a00:1450:4007:80e::200e'] as $ip) {
            yield $ip => [$ip];
        }
    }

    #[DataProvider('blocked')]
    public function testRefusesNonPublicAddresses(string $ip): void
    {
        self::assertFalse(IpPolicy::isPublic($ip));
    }

    #[DataProvider('allowed')]
    public function testAcceptsPublicAddresses(string $ip): void
    {
        self::assertTrue(IpPolicy::isPublic($ip));
    }
}

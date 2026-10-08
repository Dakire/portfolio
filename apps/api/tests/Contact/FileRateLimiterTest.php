<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Contact;

use Grichard\Api\Contact\FileRateLimiter;
use PHPUnit\Framework\TestCase;

final class FileRateLimiterTest extends TestCase
{
    private string $file;
    private int $now = 1_800_000_000;

    protected function setUp(): void
    {
        $this->file = tempnam(sys_get_temp_dir(), 'rate') ?: self::fail('fichier temporaire impossible');
    }

    protected function tearDown(): void
    {
        @unlink($this->file);
    }

    private function limiter(int $maxPerHour = 15, int $maxPerIp = 3): FileRateLimiter
    {
        return new FileRateLimiter($this->file, $maxPerHour, $maxPerIp, 'sel', fn(): int => $this->now);
    }

    public function testVisitorIsLimitedAfterItsQuota(): void
    {
        $limiter = $this->limiter();

        self::assertFalse($limiter->tooMany('203.0.113.1'));
        self::assertFalse($limiter->tooMany('203.0.113.1'));
        self::assertFalse($limiter->tooMany('203.0.113.1'));
        self::assertTrue($limiter->tooMany('203.0.113.1'));
    }

    public function testAnotherVisitorIsNotAffected(): void
    {
        $limiter = $this->limiter();
        for ($i = 0; $i < 3; ++$i) {
            $limiter->tooMany('203.0.113.1');
        }

        self::assertFalse($limiter->tooMany('203.0.113.2'));
    }

    public function testGlobalCeilingProtectsTheMailbox(): void
    {
        $limiter = $this->limiter(maxPerHour: 4, maxPerIp: 100);
        for ($i = 1; $i <= 4; ++$i) {
            self::assertFalse($limiter->tooMany('198.51.100.' . $i));
        }

        self::assertTrue($limiter->tooMany('198.51.100.99'));
    }

    public function testQuotaIsRestoredAfterOneHour(): void
    {
        $limiter = $this->limiter();
        for ($i = 0; $i < 3; ++$i) {
            $limiter->tooMany('203.0.113.1');
        }
        self::assertTrue($limiter->tooMany('203.0.113.1'));

        $this->now += 3601;

        self::assertFalse($limiter->tooMany('203.0.113.1'));
    }

    public function testRefusedAttemptsAreNotCounted(): void
    {
        $limiter = $this->limiter();
        for ($i = 0; $i < 3; ++$i) {
            $limiter->tooMany('203.0.113.1'); // trois envois acceptés à t0
        }
        $this->now += 1800;
        for ($i = 0; $i < 5; ++$i) {
            self::assertTrue($limiter->tooMany('203.0.113.1')); // refusés à t0 + 30 min : ne doivent pas être retenus
        }
        $this->now += 1801; // t0 + 1 h 00 min 01 s : les trois envois acceptés expirent

        self::assertFalse($limiter->tooMany('203.0.113.1'));
    }

    public function testOnlyAHashOfTheAddressIsStored(): void
    {
        $this->limiter()->tooMany('203.0.113.77');

        self::assertStringNotContainsString('203.0.113.77', (string) file_get_contents($this->file));
    }

    public function testCorruptedStateIsIgnored(): void
    {
        file_put_contents($this->file, '{"pas":"une liste", "[": ');

        self::assertFalse($this->limiter()->tooMany('203.0.113.1'));
    }
}

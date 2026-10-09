<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Net;

use Grichard\Api\Net\CurlExchange;
use PHPUnit\Framework\TestCase;

final class CurlExchangeTest extends TestCase
{
    public function testStopsReadingBeyondTheCap(): void
    {
        $exchange = new CurlExchange(10);
        self::assertSame(6, $exchange->write('abcdef'));
        self::assertSame(0, $exchange->write('ghijkl'), 'renvoyer 0 interrompt le transfert cURL');
        self::assertSame('abcdefghij', $exchange->body);
        self::assertTrue($exchange->truncated);
    }

    public function testCollectsHeadersOfTheLastResponseOnly(): void
    {
        $exchange = new CurlExchange(100);
        $exchange->header("HTTP/1.1 100 Continue\r\n");
        $exchange->header("X-Avant: 1\r\n");
        $exchange->header("HTTP/2 200\r\n");
        $exchange->header("Set-Cookie: a=1\r\n");
        $exchange->header("set-cookie: b=2\r\n");
        $exchange->header("Content-Type: text/html; charset=utf-8\r\n");
        self::assertSame(['set-cookie' => ['a=1', 'b=2'], 'content-type' => ['text/html; charset=utf-8']], $exchange->headers);
    }
}

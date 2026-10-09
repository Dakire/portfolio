<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Tools;

use Grichard\Api\Contact\RateLimiter;
use Grichard\Api\Contact\TurnstileVerifier;
use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;
use Grichard\Api\Tools\ToolGuard;
use PHPUnit\Framework\TestCase;

final class ToolGuardTest extends TestCase
{
    private const TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    /** @var list<string> */
    public array $calls = [];
    public bool $limited = false;

    private function guard(string $secret = 'secret'): ToolGuard
    {
        $test = $this;
        $turnstile = new class ($test) implements TurnstileVerifier {
            public function __construct(private readonly ToolGuardTest $test) {}

            public function verify(string $token, string $ip): bool
            {
                $this->test->calls[] = 'captcha';

                return 'jeton-valide' === $token;
            }
        };
        $limiter = new class ($test) implements RateLimiter {
            public function __construct(private readonly ToolGuardTest $test) {}

            public function tooMany(string $ip): bool
            {
                $this->test->calls[] = 'quota';

                return $this->test->limited;
            }
        };

        return new ToolGuard(['grichard.eu'], $secret, $turnstile, $limiter);
    }

    /** @param array<string, mixed> $body */
    private static function post(
        array $body = ['url' => 'https://exemple.fr/', 'turnstileToken' => 'jeton-valide'],
        string $origin = 'https://grichard.eu',
        string $header = self::TOKEN,
        string $cookie = self::TOKEN,
        string $method = 'POST',
    ): Request {
        return new Request($method, $origin, '203.0.113.1', json_encode($body, JSON_THROW_ON_ERROR), $header, [ToolGuard::COOKIE => $cookie]);
    }

    /** @param Response|array<array-key, mixed> $result */
    private static function code(Response|array $result): ?string
    {
        return $result instanceof Response ? $result->code : null;
    }

    public function testAcceptsAValidRequestAndReturnsItsBody(): void
    {
        $result = $this->guard()->check(self::post());
        self::assertIsArray($result);
        self::assertSame('https://exemple.fr/', $result['url']);
        self::assertSame(['captcha', 'quota'], $this->calls);
    }

    public function testRefusesOtherMethodsAndOrigins(): void
    {
        self::assertSame('method', self::code($this->guard()->check(self::post(method: 'GET'))));
        self::assertSame('origin', self::code($this->guard()->check(self::post(origin: 'https://evil.example'))));
        self::assertSame('origin', self::code($this->guard()->check(self::post(origin: ''))), 'origine absente');
        self::assertSame('origin', self::code($this->guard()->check(self::post(origin: 'https://grichard.eu.evil.example'))));
    }

    public function testRefusesAMissingOrMismatchedCsrfToken(): void
    {
        self::assertSame('csrf', self::code($this->guard()->check(self::post(header: ''))));
        self::assertSame('csrf', self::code($this->guard()->check(self::post(cookie: ''))));
        self::assertSame('csrf', self::code($this->guard()->check(self::post(header: str_repeat('b', 64)))));
        self::assertSame('csrf', self::code($this->guard()->check(self::post(header: 'court', cookie: 'court'))));
        self::assertSame([], $this->calls, 'ni captcha ni quota consommés');
    }

    public function testRefusesBadJsonFailedCaptchaAndOverQuota(): void
    {
        $bad = new Request('POST', 'https://grichard.eu', '203.0.113.1', 'pas du json', self::TOKEN, [ToolGuard::COOKIE => self::TOKEN]);
        self::assertSame('invalid_request', self::code($this->guard()->check($bad)));
        self::assertSame('captcha', self::code($this->guard()->check(self::post(['url' => 'x', 'turnstileToken' => 'faux']))));
        self::assertSame('unavailable', self::code($this->guard('')->check(self::post())), 'échec fermé sans secret');
        $this->limited = true;
        $response = $this->guard()->check(self::post());
        self::assertInstanceOf(Response::class, $response);
        self::assertSame(429, $response->status);
        self::assertSame('3600', $response->headers['Retry-After']);
    }

    public function testIssuesAHostOnlyHttpOnlyStrictCookie(): void
    {
        $response = ToolGuard::issueToken();
        self::assertIsArray($response->data);
        $token = $response->data['csrf'];
        self::assertIsString($token);
        self::assertSame(64, \strlen($token));
        $cookie = $response->headers['Set-Cookie'];
        self::assertStringStartsWith(ToolGuard::COOKIE . '=' . $token . ';', $cookie);
        foreach (['Path=/', 'Secure', 'HttpOnly', 'SameSite=Strict'] as $flag) {
            self::assertStringContainsString($flag, $cookie);
        }
        self::assertStringNotContainsString('Domain', $cookie);
        self::assertNotSame($token, ToolGuard::issueToken()->data['csrf'] ?? null, 'jeton aléatoire');
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Tools;

use Grichard\Api\Contact\RateLimiter;
use Grichard\Api\Contact\TurnstileVerifier;
use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;
use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\Url;
use Grichard\Api\Tools\ToolGuard;
use Grichard\Api\Tools\ToolsHandler;
use PHPUnit\Framework\TestCase;

final class ToolsHandlerTest extends TestCase
{
    private const TOKEN = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

    /** @var list<string> */
    private array $logs = [];

    private function handler(\Closure $seo): ToolsHandler
    {
        $turnstile = new class implements TurnstileVerifier {
            public function verify(string $token, string $ip): bool
            {
                return 'ok' === $token;
            }
        };
        $limiter = new class implements RateLimiter {
            public function tooMany(string $ip): bool
            {
                return false;
            }
        };

        return new ToolsHandler(['seo' => new ToolGuard(['grichard.eu'], 'secret', $turnstile, $limiter)], ['seo' => $seo]);
    }

    /** @param array<string, mixed> $body */
    private static function post(array $body): Request
    {
        return new Request('POST', 'https://grichard.eu', '203.0.113.9', json_encode($body, JSON_THROW_ON_ERROR), self::TOKEN, [ToolGuard::COOKIE => self::TOKEN]);
    }

    private function handle(Request $request, ?\Closure $seo = null): Response
    {
        return $this->handler($seo ?? static fn(Url $url): array => ['finalUrl' => $url->toString()])
            ->handle($request, function (string $message): void {
                $this->logs[] = $message;
            });
    }

    public function testIssuesACsrfTokenOnGet(): void
    {
        $response = $this->handle(new Request('GET', '', '203.0.113.9', '', query: 'csrf'));
        self::assertSame(200, $response->status);
        self::assertArrayHasKey('Set-Cookie', $response->headers);
        self::assertSame('invalid_request', $this->handle(new Request('GET', '', '203.0.113.9', ''))->code);
        self::assertSame('method', $this->handle(new Request('PUT', '', '203.0.113.9', ''))->code);
    }

    public function testRunsTheToolOnANormalizedUrl(): void
    {
        $response = $this->handle(self::post(['tool' => 'seo', 'url' => 'Exemple.fr', 'turnstileToken' => 'ok']));
        self::assertSame(200, $response->status);
        self::assertSame(['finalUrl' => 'https://exemple.fr/'], $response->data);
        self::assertStringContainsString('"data":{"finalUrl":"https://exemple.fr/"}', $response->json());
    }

    public function testRefusesUnknownToolsAndInvalidUrls(): void
    {
        self::assertSame('unknown_tool', $this->handle(self::post(['tool' => 'nmap', 'url' => 'exemple.fr']))->code);
        self::assertSame('captcha', $this->handle(self::post(['tool' => 'seo', 'url' => 'exemple.fr', 'turnstileToken' => 'non']))->code);
        $invalid = $this->handle(self::post(['tool' => 'seo', 'url' => 'ftp://exemple.fr/', 'turnstileToken' => 'ok']));
        self::assertSame(422, $invalid->status);
        self::assertSame('invalid_url', $invalid->code);
    }

    public function testTranslatesFetchErrorsIntoStableCodes(): void
    {
        $blocked = $this->handle(
            self::post(['tool' => 'seo', 'url' => 'http://127.0.0.1/', 'turnstileToken' => 'ok']),
            static fn(Url $url): array => throw new FetchError(FetchError::BLOCKED, $url->host),
        );
        self::assertSame(422, $blocked->status);
        self::assertSame('blocked_address', $blocked->code);
        self::assertStringNotContainsString('127.0.0.1', $blocked->json(), 'aucun détail interne renvoyé');

        $timeout = $this->handle(
            self::post(['tool' => 'seo', 'url' => 'exemple.fr', 'turnstileToken' => 'ok']),
            static fn(Url $url): array => throw new FetchError(FetchError::TIMEOUT),
        );
        self::assertSame(504, $timeout->status);
    }

    public function testUnexpectedErrorsAreLoggedWithoutTheUrl(): void
    {
        $response = $this->handle(
            self::post(['tool' => 'seo', 'url' => 'https://secret-client.fr/page', 'turnstileToken' => 'ok']),
            static fn(Url $url): array => throw new \RuntimeException('boom ' . $url->toString()),
        );
        self::assertSame(500, $response->status);
        self::assertSame('internal', $response->code);
        self::assertCount(1, $this->logs);
        self::assertStringNotContainsString('secret-client', $this->logs[0]);
        self::assertStringNotContainsString('secret-client', $response->json());
    }
}

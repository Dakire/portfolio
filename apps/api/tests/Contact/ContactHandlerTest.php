<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Contact;

use Grichard\Api\Contact\ContactHandler;
use Grichard\Api\Contact\ContactMessage;
use Grichard\Api\Contact\Mailer;
use Grichard\Api\Contact\RateLimiter;
use Grichard\Api\Contact\TurnstileVerifier;
use Grichard\Api\Http\Request;
use Grichard\Api\Http\Response;
use PHPUnit\Framework\TestCase;

final class ContactHandlerTest extends TestCase
{
    private bool $captchaOk = true;
    private bool $limited = false;
    private bool $mailOk = true;
    /** @var list<ContactMessage> */
    private array $sent = [];
    /** @var list<string> */
    private array $logs = [];
    /** @var list<string> */
    private array $order = [];

    private function handle(Request $request, string $secret = 'secret'): Response
    {
        $test = $this;
        $turnstile = new class ($test) implements TurnstileVerifier {
            public function __construct(private readonly ContactHandlerTest $test) {}

            public function verify(string $token, string $ip): bool
            {
                $this->test->record('captcha');

                return $this->test->captchaOk() && 'jeton-valide' === $token;
            }
        };
        $limiter = new class ($test) implements RateLimiter {
            public function __construct(private readonly ContactHandlerTest $test) {}

            public function tooMany(string $ip): bool
            {
                $this->test->record('limite');

                return $this->test->limited();
            }
        };
        $mailer = new class ($test) implements Mailer {
            public function __construct(private readonly ContactHandlerTest $test) {}

            public function send(ContactMessage $message): bool
            {
                $this->test->record('envoi');
                $this->test->remember($message);

                return $this->test->mailOk();
            }
        };

        $handler = new ContactHandler($secret, ['grichard.eu', 'www.grichard.eu'], $turnstile, $limiter, $mailer);

        return $handler->handle($request, function (string $message): void {
            $this->logs[] = $message;
        });
    }

    public function record(string $step): void
    {
        $this->order[] = $step;
    }

    public function captchaOk(): bool
    {
        return $this->captchaOk;
    }

    public function limited(): bool
    {
        return $this->limited;
    }

    public function mailOk(): bool
    {
        return $this->mailOk;
    }

    public function remember(ContactMessage $message): void
    {
        $this->sent[] = $message;
    }

    /** @param array<string, mixed> $override */
    private static function post(array $override = [], string $origin = 'https://grichard.eu'): Request
    {
        $body = array_replace(['name' => 'Jean', 'email' => 'jean@example.org', 'message' => 'Bonjour', 'website' => '', 'turnstileToken' => 'jeton-valide'], $override);

        return new Request('POST', $origin, '203.0.113.1', json_encode($body, JSON_THROW_ON_ERROR));
    }

    public function testValidMessageIsSent(): void
    {
        $response = $this->handle(self::post());

        self::assertSame(200, $response->status);
        self::assertTrue($response->success);
        self::assertCount(1, $this->sent);
        self::assertSame('jean@example.org', $this->sent[0]->email);
        self::assertSame(['captcha', 'limite', 'envoi'], $this->order);
    }

    public function testOnlyPostIsAllowed(): void
    {
        $response = $this->handle(new Request('GET', '', '203.0.113.1', ''));

        self::assertSame(405, $response->status);
        self::assertSame(['Allow' => 'POST'], $response->headers);
    }

    public function testForeignOriginIsRefused(): void
    {
        self::assertSame(403, $this->handle(self::post(origin: 'https://autre.example'))->status);
        self::assertSame(403, $this->handle(self::post(origin: 'https://grichard.eu.evil.example'))->status);
        self::assertSame([], $this->order);
    }

    public function testRequestWithoutOriginHeaderIsAccepted(): void
    {
        self::assertSame(200, $this->handle(self::post(origin: ''))->status);
    }

    public function testBodyThatIsNotJsonIsRefused(): void
    {
        self::assertSame(400, $this->handle(new Request('POST', '', '203.0.113.1', 'pas du json'))->status);
        self::assertSame(400, $this->handle(new Request('POST', '', '203.0.113.1', '"texte"'))->status);
    }

    public function testHoneypotAnswersOkWithoutSendingAnything(): void
    {
        $response = $this->handle(self::post(['website' => 'http://spam.example']));

        self::assertSame(200, $response->status);
        self::assertSame([], $this->sent);
        self::assertSame([], $this->order, 'ni captcha ni envoi : le robot ne doit rien apprendre');
    }

    public function testMissingSecretFailsClosedAndIsLoggedButNeverShown(): void
    {
        $response = $this->handle(self::post(), secret: '');

        self::assertSame(500, $response->status);
        self::assertSame([], $this->sent);
        self::assertCount(1, $this->logs);
        self::assertStringNotContainsString('Turnstile', $response->message);
    }

    public function testCaptchaIsCheckedBeforeTheContentIsValidated(): void
    {
        $this->captchaOk = false;

        $response = $this->handle(self::post(['email' => 'pas-un-mail']));

        self::assertSame(403, $response->status, 'un robot ne doit pas apprendre quelles données sont invalides');
    }

    public function testInvalidDataIsRefused(): void
    {
        self::assertSame(400, $this->handle(self::post(['email' => 'pas-un-mail']))->status);
        self::assertSame([], $this->sent);
    }

    public function testRateLimitedMessageIsRefusedAndNotSent(): void
    {
        $this->limited = true;

        self::assertSame(429, $this->handle(self::post())->status);
        self::assertSame([], $this->sent);
    }

    public function testInvalidMessageDoesNotConsumeTheQuota(): void
    {
        $this->handle(self::post(['message' => '']));

        self::assertNotContains('limite', $this->order);
    }

    public function testMailFailureIsReportedAndLogged(): void
    {
        $this->mailOk = false;

        $response = $this->handle(self::post());

        self::assertSame(500, $response->status);
        self::assertCount(1, $this->logs);
    }

    public function testResponseJsonCarriesOnlySuccessAndMessage(): void
    {
        $decoded = json_decode($this->handle(self::post())->json(), true);

        self::assertSame(['success', 'message'], array_keys(\is_array($decoded) ? $decoded : []));
    }
}

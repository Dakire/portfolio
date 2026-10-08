<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Contact;

use Grichard\Api\Contact\CloudflareTurnstileVerifier;
use Grichard\Api\Tests\Support\RecordingHttpClient;
use PHPUnit\Framework\TestCase;

final class CloudflareTurnstileVerifierTest extends TestCase
{
    private RecordingHttpClient $http;

    private function verifier(?string $response): CloudflareTurnstileVerifier
    {
        $this->http = new RecordingHttpClient($response);

        return new CloudflareTurnstileVerifier('secret-de-test', ['grichard.eu', 'www.grichard.eu'], $this->http);
    }

    public function testTokenIssuedForOurSiteIsAccepted(): void
    {
        $verifier = $this->verifier('{"success":true,"hostname":"grichard.eu"}');

        self::assertTrue($verifier->verify('jeton', '203.0.113.1'));
        self::assertSame(['secret' => 'secret-de-test', 'response' => 'jeton', 'remoteip' => '203.0.113.1'], $this->http->sent);
    }

    public function testTokenWithoutHostnameIsRejected(): void
    {
        self::assertFalse($this->verifier('{"success":true}')->verify('jeton', '203.0.113.1'));
        self::assertFalse($this->verifier('{"success":true,"hostname":""}')->verify('jeton', '203.0.113.1'));
    }

    public function testTokenIssuedForAnotherSiteIsRejected(): void
    {
        self::assertFalse($this->verifier('{"success":true,"hostname":"autre-site.example"}')->verify('jeton', '203.0.113.1'));
        self::assertFalse($this->verifier('{"success":true,"hostname":"grichard.eu.evil.example"}')->verify('jeton', '203.0.113.1'));
    }

    public function testFailedChallengeIsRejected(): void
    {
        self::assertFalse($this->verifier('{"success":false,"hostname":"grichard.eu"}')->verify('jeton', '203.0.113.1'));
    }

    public function testUnreachableOrGarbledServiceIsRejected(): void
    {
        self::assertFalse($this->verifier(null)->verify('jeton', '203.0.113.1'));
        self::assertFalse($this->verifier('pas du json')->verify('jeton', '203.0.113.1'));
        self::assertFalse($this->verifier('"success"')->verify('jeton', '203.0.113.1'));
    }

    public function testEmptyOrOversizedTokenNeverReachesTheService(): void
    {
        $verifier = $this->verifier('{"success":true,"hostname":"grichard.eu"}');

        self::assertFalse($verifier->verify('', '203.0.113.1'));
        self::assertFalse($verifier->verify(str_repeat('a', 2049), '203.0.113.1'));
        self::assertSame([], $this->http->sent);
    }
}

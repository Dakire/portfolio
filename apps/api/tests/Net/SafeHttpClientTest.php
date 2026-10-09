<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Net;

use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\HttpResponse;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\TransportResult;
use Grichard\Api\Net\Url;
use Grichard\Api\Tests\Support\FakeResolver;
use Grichard\Api\Tests\Support\FakeTransport;
use PHPUnit\Framework\TestCase;

final class SafeHttpClientTest extends TestCase
{
    private const DNS = [
        'exemple.fr' => ['93.184.216.34'],
        'www.exemple.fr' => ['93.184.216.34'],
        'interne.exemple.fr' => ['10.0.0.5'],
        'mixte.exemple.fr' => ['93.184.216.35', '127.0.0.1'],
        'double.exemple.fr' => ['2606:4700::1', '93.184.216.36'],
        'metadata.exemple.fr' => ['169.254.169.254'],
    ];

    private float $now = 1000.0;

    /**
     * @param array<string, TransportResult> $responses
     *
     * @param-out FakeTransport $transport
     */
    private function client(array $responses, ?FakeTransport &$transport = null, float $budget = 20.0): SafeHttpClient
    {
        $transport = new FakeTransport($responses);

        return new SafeHttpClient($transport, new FakeResolver(self::DNS), $budget, clock: fn(): float => $this->now);
    }

    private static function url(string $raw): Url
    {
        return Url::parse($raw) ?? self::fail('URL de test invalide : ' . $raw);
    }

    private static function error(callable $call): FetchError
    {
        try {
            $call();
        } catch (FetchError $error) {
            return $error;
        }
        self::fail('FetchError attendue');
    }

    public function testFetchesAPublicSitePinnedOnTheValidatedIp(): void
    {
        $client = $this->client(['https://exemple.fr/' => FakeTransport::ok('<h1>ok</h1>')], $transport);
        $response = $client->fetch(self::url('https://exemple.fr/'));
        self::assertSame(200, $response->status);
        self::assertSame('<h1>ok</h1>', $response->body);
        self::assertSame('93.184.216.34', $transport->sent[0]->ip);
        self::assertSame(SafeHttpClient::USER_AGENT, $transport->sent[0]->headers['User-Agent']);
    }

    public function testRefusesPrivateLoopbackAndMetadataAddresses(): void
    {
        $client = $this->client([]);
        foreach (['https://interne.exemple.fr/', 'http://127.0.0.1/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/', 'https://metadata.exemple.fr/'] as $raw) {
            self::assertSame(FetchError::BLOCKED, self::error(fn() => $client->fetch(self::url($raw)))->reason, $raw);
        }
    }

    public function testRefusesAHostWhenOneOfItsAddressesIsPrivate(): void
    {
        $client = $this->client(['https://mixte.exemple.fr/' => FakeTransport::ok()], $transport);
        self::assertSame(FetchError::BLOCKED, self::error(fn() => $client->fetch(self::url('https://mixte.exemple.fr/')))->reason);
        self::assertSame([], $transport->sent, 'aucune connexion ne doit partir');
    }

    public function testPrefersIpv4(): void
    {
        $client = $this->client(['https://double.exemple.fr/' => FakeTransport::ok()], $transport);
        $client->fetch(self::url('https://double.exemple.fr/'));
        self::assertSame('93.184.216.36', $transport->sent[0]->ip);
    }

    public function testFollowsRedirectsAndRecordsTheChain(): void
    {
        $client = $this->client([
            'http://exemple.fr/' => FakeTransport::redirect('https://exemple.fr/'),
            'https://exemple.fr/' => FakeTransport::redirect('/accueil/', 302),
            'https://exemple.fr/accueil/' => FakeTransport::ok('fin'),
        ]);
        $response = $client->fetch(self::url('http://exemple.fr/'));
        self::assertSame('https://exemple.fr/accueil/', $response->url->toString());
        self::assertSame(
            [['url' => 'http://exemple.fr/', 'status' => 301], ['url' => 'https://exemple.fr/', 'status' => 302]],
            $response->redirects,
        );
    }

    public function testRevalidatesEveryRedirect(): void
    {
        $client = $this->client([
            'https://exemple.fr/' => FakeTransport::redirect('http://127.0.0.1/admin'),
            'https://www.exemple.fr/' => FakeTransport::redirect('https://interne.exemple.fr/'),
            'https://exemple.fr/f' => FakeTransport::redirect('file:///etc/passwd'),
            'https://exemple.fr/p' => FakeTransport::redirect('http://exemple.fr:6379/'),
        ], $transport);
        self::assertSame(FetchError::BLOCKED, self::error(fn() => $client->fetch(self::url('https://exemple.fr/')))->reason);
        self::assertSame(FetchError::BLOCKED, self::error(fn() => $client->fetch(self::url('https://www.exemple.fr/')))->reason);
        self::assertSame(FetchError::INVALID_URL, self::error(fn() => $client->fetch(self::url('https://exemple.fr/f')))->reason);
        self::assertSame(FetchError::INVALID_URL, self::error(fn() => $client->fetch(self::url('https://exemple.fr/p')))->reason);
        foreach ($transport->sent as $request) {
            self::assertNotSame('127.0.0.1', $request->ip);
            self::assertNotSame('10.0.0.5', $request->ip);
        }
    }

    public function testStopsAfterFiveRedirects(): void
    {
        $responses = [];
        for ($i = 0; $i < 7; ++$i) {
            $responses['https://exemple.fr/' . $i] = FakeTransport::redirect('/' . ($i + 1));
        }
        $client = $this->client($responses);
        self::assertSame(FetchError::TOO_MANY_REDIRECTS, self::error(fn() => $client->fetch(self::url('https://exemple.fr/0')))->reason);
    }

    public function testReportsDnsFailuresAndTransportErrors(): void
    {
        $client = $this->client(['https://exemple.fr/' => TransportResult::failed(FetchError::TIMEOUT)]);
        self::assertSame(FetchError::DNS, self::error(fn() => $client->fetch(self::url('https://inconnu.exemple.fr/')))->reason);
        self::assertSame(FetchError::TIMEOUT, self::error(fn() => $client->fetch(self::url('https://exemple.fr/')))->reason);
    }

    public function testStopsWhenTheGlobalBudgetIsSpent(): void
    {
        $client = $this->client(['https://exemple.fr/' => FakeTransport::ok()], $transport, budget: 5.0);
        $this->now += 4.8;
        self::assertSame(FetchError::TIMEOUT, self::error(fn() => $client->fetch(self::url('https://exemple.fr/')))->reason);
        self::assertSame([], $transport->sent);
    }

    public function testCapsTimeoutsToTheRemainingBudget(): void
    {
        $client = $this->client(['https://exemple.fr/' => FakeTransport::ok()], $transport, budget: 5.0);
        $this->now += 3.0;
        $client->fetch(self::url('https://exemple.fr/'));
        self::assertEqualsWithDelta(2.0, $transport->sent[0]->timeoutSeconds, 0.01);
    }

    public function testFetchesSeveralUrlsAndKeepsTheirKeys(): void
    {
        $client = $this->client([
            'https://exemple.fr/a' => FakeTransport::ok('a'),
            'https://exemple.fr/b' => FakeTransport::redirect('/c'),
            'https://exemple.fr/c' => FakeTransport::ok('c', 404),
        ]);
        $results = $client->fetchAll([
            'x' => self::url('https://exemple.fr/a'),
            'y' => self::url('https://exemple.fr/b'),
            'z' => self::url('https://interne.exemple.fr/'),
        ], 'HEAD');
        self::assertSame(['x', 'y', 'z'], array_keys($results));
        self::assertInstanceOf(HttpResponse::class, $results['x']);
        self::assertInstanceOf(HttpResponse::class, $results['y']);
        self::assertSame(404, $results['y']->status);
        self::assertInstanceOf(FetchError::class, $results['z']);
    }

    public function testReportsAMissingCurlExtension(): void
    {
        $client = new SafeHttpClient(new FakeTransport([], available: false), new FakeResolver(self::DNS));
        self::assertFalse($client->available());
        self::assertSame(FetchError::UNAVAILABLE, self::error(fn() => $client->fetch(self::url('https://exemple.fr/')))->reason);
    }
}

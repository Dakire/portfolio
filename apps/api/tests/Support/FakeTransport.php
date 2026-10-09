<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Support;

use Grichard\Api\Net\Transport;
use Grichard\Api\Net\TransportRequest;
use Grichard\Api\Net\TransportResult;

/** Faux transport : répond selon une table « URL -> réponse » et enregistre chaque requête (URL, IP épinglée, méthode). */
final class FakeTransport implements Transport
{
    /** @var list<TransportRequest> */
    public array $sent = [];

    /** @param array<string, TransportResult> $responses */
    public function __construct(private array $responses, private bool $available = true) {}

    /** @param array<string, list<string>> $headers */
    public static function ok(string $body = '<html></html>', int $status = 200, array $headers = []): TransportResult
    {
        return new TransportResult($status, $headers + ['content-type' => ['text/html; charset=utf-8']], $body, false, 0.1, 0.05);
    }

    public static function redirect(string $location, int $status = 301): TransportResult
    {
        return new TransportResult($status, ['location' => [$location]], '', false, 0.05, 0.05);
    }

    public function available(): bool
    {
        return $this->available;
    }

    public function sendAll(array $requests): array
    {
        $out = [];
        foreach ($requests as $key => $request) {
            $this->sent[] = $request;
            $out[$key] = $this->responses[$request->url->toString()] ?? TransportResult::failed('connection_failed');
        }

        return $out;
    }
}

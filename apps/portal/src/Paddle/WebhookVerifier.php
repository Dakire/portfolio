<?php

declare(strict_types=1);

namespace Grichard\Portal\Paddle;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Signature des notifications Paddle (Billing) : en-tête « Paddle-Signature: ts=<secondes>;h1=<hmac> », où h1 est le
 * HMAC-SHA256 de « <ts>:<corps brut> » avec le secret de la destination de notification. Plusieurs h1 peuvent coexister
 * pendant un changement de secret. Un horodatage de plus de 5 minutes est refusé (rejeu).
 */
final readonly class WebhookVerifier
{
    public const TOLERANCE = 300;

    public function __construct(
        #[Autowire('%env(PORTAL_PADDLE_WEBHOOK_SECRET)%')]
        private string $secret,
    ) {}

    public function isConfigured(): bool
    {
        return '' !== $this->secret;
    }

    public function isValid(string $header, string $body, int $now = 0): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }
        $now = 0 === $now ? time() : $now;
        $timestamp = null;
        $signatures = [];
        foreach (explode(';', $header) as $part) {
            [$name, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            if ('ts' === $name && ctype_digit($value)) {
                $timestamp = (int) $value;
            } elseif ('h1' === $name && '' !== $value) {
                $signatures[] = $value;
            }
        }
        if (null === $timestamp || [] === $signatures || abs($now - $timestamp) > self::TOLERANCE) {
            return false;
        }
        $expected = hash_hmac('sha256', $timestamp . ':' . $body, $this->secret);
        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }

    /** Pour les tests et la documentation : en-tête que Paddle enverrait pour ce corps. */
    public function sign(string $body, int $timestamp): string
    {
        return 'ts=' . $timestamp . ';h1=' . hash_hmac('sha256', $timestamp . ':' . $body, $this->secret);
    }
}

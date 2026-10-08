<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

use Closure;

/**
 * Compteur dans un fichier : lecture, contrôle et écriture se font sous un seul verrou, donc deux requêtes simultanées
 * ne peuvent pas dépasser la limite. Seule une empreinte salée de l'IP est conservée, au plus une heure
 * (voir la politique de confidentialité, section « Protection contre les abus »).
 */
final readonly class FileRateLimiter implements RateLimiter
{
    private const WINDOW_SECONDS = 3600;

    /** @param Closure(): int $clock horloge injectable (secondes Unix) */
    public function __construct(
        private string $file,
        private int $maxPerHour,
        private int $maxPerIpPerHour,
        private string $salt,
        private Closure $clock,
    ) {}

    public function tooMany(string $ip): bool
    {
        $handle = @fopen($this->file, 'c+');
        if (false === $handle || !flock($handle, LOCK_EX)) {
            // Panne de stockage : on ne bloque pas un visiteur légitime (Turnstile reste exigé en amont).
            return false;
        }

        $now = ($this->clock)();
        $hits = $this->recentHits((string) stream_get_contents($handle), $now);

        $ipKey = hash('sha256', $this->salt . '|' . $ip);
        $fromThisIp = \count(array_filter($hits, static fn(array $hit): bool => $hit['ip'] === $ipKey));
        $limited = \count($hits) >= $this->maxPerHour || $fromThisIp >= $this->maxPerIpPerHour;

        if (!$limited) {
            $hits[] = ['t' => $now, 'ip' => $ipKey];
        }
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($hits, JSON_THROW_ON_ERROR));
        flock($handle, LOCK_UN);
        fclose($handle);

        return $limited;
    }

    /**
     * @return list<array{t: int, ip: string}> envois de la dernière heure ; toute entrée mal formée est ignorée
     */
    private function recentHits(string $stored, int $now): array
    {
        $decoded = json_decode($stored, true);
        $hits = [];
        foreach (\is_array($decoded) ? $decoded : [] as $hit) {
            if (\is_array($hit) && \is_int($hit['t'] ?? null) && \is_string($hit['ip'] ?? null) && $hit['t'] > $now - self::WINDOW_SECONDS) {
                $hits[] = ['t' => $hit['t'], 'ip' => $hit['ip']];
            }
        }

        return $hits;
    }
}

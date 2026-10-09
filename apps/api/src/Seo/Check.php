<?php

declare(strict_types=1);

namespace Grichard\Api\Seo;

/**
 * Résultat d'un contrôle du rapport. Le serveur ne renvoie que des identifiants et des valeurs : les textes (titre,
 * explication, recommandation) sont rédigés côté site, en français et en anglais.
 */
final readonly class Check implements \JsonSerializable
{
    public const PASS = 'pass';
    public const WARN = 'warn';
    public const FAIL = 'fail';
    public const INFO = 'info';

    public const CRITICAL = 'critical';
    public const IMPORTANT = 'important';
    public const MINOR = 'info';

    /** @param array<string, mixed> $data */
    public function __construct(
        public string $id,
        public string $category,
        public string $severity,
        public string $status,
        public array $data = [],
    ) {}

    /** Poids dans le score global : un contrôle critique compte dix fois plus qu'un contrôle mineur. */
    public function weight(): int
    {
        return match ($this->severity) {
            self::CRITICAL => 10,
            self::IMPORTANT => 4,
            default => 1,
        };
    }

    /** @return array{id: string, category: string, severity: string, status: string, data: array<string, mixed>} */
    public function jsonSerialize(): array
    {
        return ['id' => $this->id, 'category' => $this->category, 'severity' => $this->severity, 'status' => $this->status, 'data' => $this->data];
    }
}

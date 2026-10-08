<?php

declare(strict_types=1);

namespace Grichard\Api\Http;

/** Réponse JSON {success, message} : l'envoi est séparé de la construction pour que les tests n'émettent aucun en-tête. */
final readonly class Response
{
    /** @param array<string, string> $headers */
    private function __construct(
        public int $status,
        public bool $success,
        public string $message,
        public array $headers = [],
    ) {}

    public static function ok(string $message): self
    {
        return new self(200, true, $message);
    }

    /** @param array<string, string> $headers */
    public static function error(int $status, string $message, array $headers = []): self
    {
        return new self($status, false, $message, $headers);
    }

    public function json(): string
    {
        return json_encode(
            ['success' => $this->success, 'message' => $this->message],
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );
    }

    /** Émet l'état, les en-têtes et le corps (jamais d'erreur PHP dans la réponse : elles pourraient révéler des chemins). */
    public function send(): never
    {
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
        echo $this->json();

        exit;
    }
}

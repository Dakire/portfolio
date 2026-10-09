<?php

declare(strict_types=1);

namespace Grichard\Api\Http;

/**
 * Réponse JSON {success, message} (+ code et data pour les outils) : l'envoi est séparé de la construction pour que les
 * tests n'émettent aucun en-tête. « code » est un identifiant stable que le front traduit ; « message » reste en français.
 */
final readonly class Response
{
    /**
     * @param array<string, string>      $headers
     * @param array<string, mixed>|null  $data
     */
    private function __construct(
        public int $status,
        public bool $success,
        public string $message,
        public array $headers = [],
        public ?string $code = null,
        public ?array $data = null,
    ) {}

    public static function ok(string $message): self
    {
        return new self(200, true, $message);
    }

    /**
     * @param array<string, mixed>  $data
     * @param array<string, string> $headers
     */
    public static function data(array $data, array $headers = []): self
    {
        return new self(200, true, 'OK', $headers, null, $data);
    }

    /** @param array<string, string> $headers */
    public static function error(int $status, string $message, array $headers = [], ?string $code = null): self
    {
        return new self($status, false, $message, $headers, $code);
    }

    public function json(): string
    {
        $body = ['success' => $this->success, 'message' => $this->message];
        if (null !== $this->code) {
            $body['code'] = $this->code;
        }
        if (null !== $this->data) {
            $body['data'] = $this->data;
        }

        return json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
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

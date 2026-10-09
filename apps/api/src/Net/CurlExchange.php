<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** État d'un échange cURL en cours : en-têtes reçus et corps lu (plafonné). */
final class CurlExchange
{
    /** @var array<string, list<string>> noms en minuscules */
    public array $headers = [];
    public string $body = '';
    public bool $truncated = false;

    public function __construct(public readonly int $maxBytes) {}

    /** Ligne d'en-tête reçue ; une nouvelle ligne d'état (100 Continue…) remet les en-têtes à zéro. */
    public function header(string $line): int
    {
        $trimmed = trim($line);
        if (str_starts_with($trimmed, 'HTTP/')) {
            $this->headers = [];
        } elseif (str_contains($trimmed, ':')) {
            [$name, $value] = explode(':', $trimmed, 2);
            $this->headers[strtolower(trim($name))][] = trim($value);
        }

        return \strlen($line);
    }

    /** Morceau de corps reçu ; au-delà du plafond, renvoie 0 pour interrompre le transfert (CURLE_WRITE_ERROR). */
    public function write(string $chunk): int
    {
        $room = $this->maxBytes - \strlen($this->body);
        if (\strlen($chunk) > $room) {
            $this->body .= substr($chunk, 0, max(0, $room));
            $this->truncated = true;

            return 0;
        }
        $this->body .= $chunk;

        return \strlen($chunk);
    }
}

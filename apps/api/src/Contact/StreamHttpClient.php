<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** POST via les flux PHP (allow_url_fopen, disponible sur l'hébergement) : aucune dépendance. */
final class StreamHttpClient implements HttpClient
{
    public function postForm(string $url, array $fields, int $timeoutSeconds): ?string
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query($fields),
                'timeout' => $timeoutSeconds,
            ],
        ]);
        $body = @file_get_contents($url, false, $context);

        return false === $body ? null : $body;
    }
}

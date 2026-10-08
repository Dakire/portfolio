<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Support;

use Grichard\Api\Contact\HttpClient;

/** Faux client HTTP : renvoie une réponse imposée et garde les champs reçus. */
final class RecordingHttpClient implements HttpClient
{
    /** @var array<string, string> */
    public array $sent = [];

    public function __construct(private readonly ?string $response) {}

    public function postForm(string $url, array $fields, int $timeoutSeconds): ?string
    {
        $this->sent = $fields;

        return $this->response;
    }
}

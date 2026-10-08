<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Client HTTP minimal (POST de formulaire) : une interface pour tester la vérification Turnstile sans réseau. */
interface HttpClient
{
    /**
     * @param array<string, string> $fields
     *
     * @return string|null corps de la réponse, ou null si l'appel a échoué
     */
    public function postForm(string $url, array $fields, int $timeoutSeconds): ?string;
}

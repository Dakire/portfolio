<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Vérifie qu'un jeton anti-robot est valide. */
interface TurnstileVerifier
{
    public function verify(string $token, string $ip): bool;
}

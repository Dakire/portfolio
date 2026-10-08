<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Limite le nombre de messages : globalement (protège la boîte de réception) et par visiteur (un seul client ne peut pas épuiser le plafond global). */
interface RateLimiter
{
    /** Vrai si l'envoi doit être refusé. Un envoi accepté est comptabilisé. */
    public function tooMany(string $ip): bool;
}

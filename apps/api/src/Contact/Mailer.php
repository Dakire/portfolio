<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Envoie le message de contact au propriétaire du site. */
interface Mailer
{
    public function send(ContactMessage $message): bool;
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Contact;

/** Envoi par la fonction mail() de l'hébergeur (OVH exige une adresse d'expéditeur du domaine). */
final readonly class PhpMailer implements Mailer
{
    public function __construct(
        private string $to,
        private string $from,
    ) {}

    public function send(ContactMessage $message): bool
    {
        $subject = mb_encode_mimeheader('Nouveau contact Portfolio : ' . $message->name, 'UTF-8');
        $body = "Nouveau message depuis le portfolio.\n\nNom : {$message->name}\nEmail : {$message->email}\n\nMessage :\n{$message->message}\n";

        return $this->deliver($subject, $body, $this->headers($message));
    }

    /**
     * Le nom (nettoyé) n'apparaît que dans le sujet encodé ; Reply-To est une adresse déjà validée sans espace,
     * guillemet ni caractère de contrôle : aucun CR/LF ne peut atteindre les en-têtes.
     */
    public function headers(ContactMessage $message): string
    {
        return implode("\r\n", [
            'From: ' . $this->from,
            'Reply-To: ' . $message->email,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
        ]);
    }

    protected function deliver(string $subject, string $body, string $headers): bool
    {
        return mail($this->to, $subject, $body, $headers);
    }
}

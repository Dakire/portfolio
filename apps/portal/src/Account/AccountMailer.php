<?php

declare(strict_types=1);

namespace Grichard\Portal\Account;

use Grichard\Portal\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Twig\Environment;

/**
 * E-mails du compte, en texte brut (meilleure délivrabilité, aucun suivi ni image). Expéditeur et transport viennent de
 * private/portal.php (mail_from, mailer_dsn) ; sur l'hébergement, le transport par défaut est la fonction mail() de PHP.
 */
final readonly class AccountMailer
{
    public function __construct(
        private MailerInterface $mailer,
        private Environment $twig,
        #[Autowire('%env(PORTAL_MAIL_FROM)%')]
        private string $from,
    ) {}

    public function verification(User $user, string $link): void
    {
        $this->send($user, 'Confirmez votre adresse e-mail', 'email/verify.txt.twig', ['link' => $link]);
    }

    /** Inscription demandée avec une adresse déjà enregistrée : on prévient le titulaire au lieu de le révéler à l'écran. */
    public function alreadyRegistered(User $user, string $loginLink, string $resetLink): void
    {
        $this->send($user, 'Vous avez déjà un compte', 'email/already_registered.txt.twig', [
            'login_link' => $loginLink,
            'reset_link' => $resetLink,
        ]);
    }

    public function passwordReset(User $user, string $link): void
    {
        $this->send($user, 'Réinitialiser votre mot de passe', 'email/reset.txt.twig', ['link' => $link]);
    }

    public function passwordChanged(User $user): void
    {
        $this->send($user, 'Votre mot de passe a été modifié', 'email/password_changed.txt.twig', []);
    }

    /** @param array<string, mixed> $context */
    private function send(User $user, string $subject, string $template, array $context): void
    {
        $this->mailer->send(
            new Email()
                ->from(Address::create($this->from))
                ->to($user->getEmail())
                ->subject($subject . ' | grichard.eu')
                ->text($this->twig->render($template, $context + ['email' => $user->getEmail()])),
        );
    }
}

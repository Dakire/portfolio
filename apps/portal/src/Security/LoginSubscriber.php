<?php

declare(strict_types=1);

namespace Grichard\Portal\Security;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

/**
 * Journal des connexions. Jamais d'e-mail ni d'adresse IP en clair : un identifiant interne pour les réussites, une empreinte
 * courte de l'identifiant saisi pour les échecs (assez pour repérer une attaque sur un compte, pas pour le retrouver).
 */
final readonly class LoginSubscriber
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        #[Autowire(service: 'monolog.logger.portal')]
        private LoggerInterface $logger,
    ) {}

    #[AsEventListener]
    public function onSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }
        $user->recordLogin();
        $this->entityManager->flush();
        $this->logger->info('connexion réussie', ['user' => $user->getId()]);
    }

    #[AsEventListener]
    public function onFailure(LoginFailureEvent $event): void
    {
        $identifier = (string) $event->getRequest()->request->get('_username', '');
        $this->logger->warning('connexion refusée', [
            'identifiant' => substr(hash('sha256', strtolower($identifier)), 0, 12),
            'raison' => new \ReflectionClass($event->getException())->getShortName(),
        ]);
    }
}

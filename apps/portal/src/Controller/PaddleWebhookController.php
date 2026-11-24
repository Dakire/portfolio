<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\WebhookEvent;
use Grichard\Portal\Paddle\WebhookHandler;
use Grichard\Portal\Paddle\WebhookVerifier;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Destination des notifications Paddle (à déclarer dans Paddle : https://grichard.eu/espace/webhooks/paddle). Signature
 * vérifiée avant toute lecture ; chaque événement n'a d'effet qu'une fois. Une erreur répond 500 pour que Paddle réessaie.
 */
#[AsController]
final class PaddleWebhookController
{
    #[Route('/webhooks/paddle', name: 'app_paddle_webhook', methods: ['POST'])]
    public function __invoke(
        Request $request,
        WebhookVerifier $verifier,
        WebhookHandler $handler,
        EntityManagerInterface $entityManager,
        #[Autowire(service: 'monolog.logger.portal')]
        LoggerInterface $logger,
    ): Response {
        if (!$verifier->isConfigured()) {
            return new JsonResponse(['erreur' => 'notifications non configurées'], Response::HTTP_SERVICE_UNAVAILABLE);
        }
        $body = $request->getContent();
        if (!$verifier->isValid((string) $request->headers->get('Paddle-Signature', ''), $body)) {
            $logger->warning('paddle : signature refusée');

            return new JsonResponse(['erreur' => 'signature invalide'], Response::HTTP_FORBIDDEN);
        }
        $event = json_decode($body, true);
        $eventId = \is_array($event) && \is_string($event['event_id'] ?? null) ? $event['event_id'] : '';
        $eventType = \is_array($event) && \is_string($event['event_type'] ?? null) ? $event['event_type'] : '';
        if (!\is_array($event) || '' === $eventId || '' === $eventType) {
            return new JsonResponse(['erreur' => 'notification illisible'], Response::HTTP_BAD_REQUEST);
        }
        if (null !== $entityManager->getRepository(WebhookEvent::class)->findOneBy(['eventId' => $eventId])) {
            return new JsonResponse(['resultat' => 'déjà traité']);
        }

        /** @var array<string, mixed> $event */
        $outcome = $entityManager->wrapInTransaction(static function () use ($handler, $event, $entityManager, $eventId, $eventType): string {
            $outcome = $handler->handle($event);
            $entityManager->persist(new WebhookEvent($eventId, $eventType));

            return $outcome;
        });

        return new JsonResponse(['resultat' => $outcome]);
    }
}

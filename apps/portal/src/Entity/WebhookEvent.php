<?php

declare(strict_types=1);

namespace Grichard\Portal\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Notification Paddle déjà traitée : Paddle peut renvoyer un même événement (réessais), il ne doit produire son effet qu'une
 * fois. On garde l'identifiant, le type et la date, jamais le contenu (données de facturation).
 */
#[ORM\Entity]
#[ORM\Table(name: 'webhook_event')]
#[ORM\UniqueConstraint(name: 'uniq_webhook_event', columns: ['event_id'])]
class WebhookEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private \DateTimeImmutable $receivedAt;

    public function __construct(
        #[ORM\Column(length: 64)]
        private string $eventId,
        #[ORM\Column(length: 64)]
        private string $eventType,
    ) {
        $this->receivedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEventId(): string
    {
        return $this->eventId;
    }

    public function getEventType(): string
    {
        return $this->eventType;
    }

    public function getReceivedAt(): \DateTimeImmutable
    {
        return $this->receivedAt;
    }
}

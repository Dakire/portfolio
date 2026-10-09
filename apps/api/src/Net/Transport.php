<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Envoi d'échanges HTTP isolés (aucune redirection suivie) : cURL en production, un faux dans les tests. */
interface Transport
{
    public function available(): bool;

    /**
     * Plusieurs échanges en parallèle ; les résultats gardent les clés des requêtes.
     *
     * @template K of array-key
     *
     * @param array<K, TransportRequest> $requests
     *
     * @return array<K, TransportResult>
     */
    public function sendAll(array $requests): array;
}

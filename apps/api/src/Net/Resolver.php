<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Résolution DNS d'un nom d'hôte (interface : les tests n'interrogent aucun serveur). */
interface Resolver
{
    /** @return list<string> adresses IPv4 et IPv6 ; vide si le nom ne se résout pas */
    public function resolve(string $host): array;
}

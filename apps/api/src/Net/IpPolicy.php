<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/**
 * Protection SSRF : seule une adresse IP publique (routable sur Internet) peut être contactée par les outils.
 * Tout le reste est refusé : réseaux privés, boucle locale, lien local (dont les métadonnées des clouds, 169.254.169.254),
 * CGNAT, plages de documentation et de test, multicast, réservées, et les adresses IPv6 qui transportent une IPv4
 * (::ffff:0:0/96, 6to4, NAT64, Teredo), dont l'IPv4 embarquée pourrait viser le réseau interne.
 */
final class IpPolicy
{
    /** @var list<string> */
    private const BLOCKED_V4 = [
        '0.0.0.0/8',        // « ce réseau »
        '10.0.0.0/8',       // privé
        '100.64.0.0/10',    // CGNAT
        '127.0.0.0/8',      // boucle locale
        '169.254.0.0/16',   // lien local, métadonnées des clouds
        '172.16.0.0/12',    // privé
        '192.0.0.0/24',     // affectations IETF
        '192.0.2.0/24',     // documentation
        '192.88.99.0/24',   // relais 6to4
        '192.168.0.0/16',   // privé
        '198.18.0.0/15',    // tests de performance
        '198.51.100.0/24',  // documentation
        '203.0.113.0/24',   // documentation
        '224.0.0.0/4',      // multicast
        '240.0.0.0/4',      // réservé, dont 255.255.255.255
    ];

    /** @var list<string> */
    private const BLOCKED_V6 = [
        '::/128',           // non spécifiée
        '::1/128',          // boucle locale
        '::ffff:0:0/96',    // IPv4 mappée (traitée à part : voir isPublic)
        '64:ff9b::/96',     // NAT64
        '64:ff9b:1::/48',   // NAT64 local
        '100::/64',         // à jeter
        '2001::/23',        // affectations IETF, dont Teredo (2001::/32)
        '2001:db8::/32',    // documentation
        '2002::/16',        // 6to4
        'fc00::/7',         // adresses locales uniques
        'fe80::/10',        // lien local
        'fec0::/10',        // site local (obsolète)
        'ff00::/8',         // multicast
    ];

    public static function isPublic(string $ip): bool
    {
        $packed = @inet_pton($ip);
        if (false === $packed) {
            return false;
        }

        if (4 === \strlen($packed)) {
            return !self::inAny($packed, self::BLOCKED_V4);
        }

        // IPv4 mappée : on juge l'IPv4 qu'elle contient (refusée de toute façon par la liste, mais explicite).
        if (str_starts_with($packed, str_repeat("\0", 10) . "\xff\xff")) {
            return false;
        }

        return !self::inAny($packed, self::BLOCKED_V6);
    }

    /** @param list<string> $ranges */
    private static function inAny(string $packed, array $ranges): bool
    {
        foreach ($ranges as $range) {
            if (self::inRange($packed, $range)) {
                return true;
            }
        }

        return false;
    }

    private static function inRange(string $packed, string $cidr): bool
    {
        [$network, $bits] = explode('/', $cidr) + [1 => ''];
        $net = inet_pton($network);
        if (false === $net || \strlen($net) !== \strlen($packed)) {
            return false;
        }
        $bits = (int) $bits;
        $bytes = intdiv($bits, 8);
        if (0 !== substr_compare($packed, $net, 0, $bytes)) {
            return false;
        }
        $rest = $bits % 8;
        if (0 === $rest) {
            return true;
        }
        $mask = (0xFF << (8 - $rest)) & 0xFF;

        return (\ord($packed[$bytes]) & $mask) === (\ord($net[$bytes]) & $mask);
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/** Résolveur du système (A et AAAA), avec repli sur gethostbynamel si dns_get_record est indisponible. */
final class DnsResolver implements Resolver
{
    public function resolve(string $host): array
    {
        if (false !== filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }
        $ips = [];
        $records = \function_exists('dns_get_record') ? @dns_get_record($host, DNS_A | DNS_AAAA) : false;
        if (\is_array($records)) {
            foreach ($records as $record) {
                $ip = $record['ip'] ?? $record['ipv6'] ?? null;
                if (\is_string($ip)) {
                    $ips[] = $ip;
                }
            }
        }
        if ([] === $ips) {
            $v4 = @gethostbynamel($host);
            $ips = \is_array($v4) ? $v4 : [];
        }

        return array_values(array_unique($ips));
    }
}

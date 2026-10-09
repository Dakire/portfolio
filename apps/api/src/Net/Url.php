<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/**
 * URL absolue http(s) validée, prête à être contactée par un outil : jamais d'identifiants, jamais de port exotique,
 * jamais de fragment, nom d'hôte normalisé (minuscules, IDN en punycode, sans point final).
 *
 * Les écritures « exotiques » d'une IPv4 (2130706433, 0x7f.1, 0177.0.0.1, 127.1) sont refusées : curl et la libc les
 * interprètent comme des adresses, ce qui permettrait de viser 127.0.0.1 sans l'écrire.
 */
final readonly class Url
{
    public const MAX_LENGTH = 2048;

    private function __construct(
        public string $scheme,
        public string $host,
        public int $port,
        /** Chemin et requête (commence toujours par « / »). */
        public string $path,
    ) {}

    /** Saisie d'un visiteur : le schéma https est ajouté s'il manque (« exemple.fr » -> https://exemple.fr/). */
    public static function fromInput(string $input): ?self
    {
        $input = trim($input);
        if ('' !== $input && !preg_match('~^[a-z][a-z0-9+.-]*://~i', $input)) {
            $input = 'https://' . $input;
        }

        return self::parse($input);
    }

    public static function parse(string $raw): ?self
    {
        if ('' === $raw || \strlen($raw) > self::MAX_LENGTH || preg_match('/[\x00-\x20\x7f]/', $raw)) {
            return null;
        }
        $parts = parse_url($raw);
        if (false === $parts || !isset($parts['scheme'], $parts['host'])) {
            return null;
        }
        $scheme = strtolower($parts['scheme']);
        if ('http' !== $scheme && 'https' !== $scheme) {
            return null;
        }
        if (isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }
        $default = 'https' === $scheme ? 443 : 80;
        $port = $parts['port'] ?? $default;
        if (80 !== $port && 443 !== $port) {
            return null;
        }
        $host = self::normalizeHost($parts['host']);
        if (null === $host) {
            return null;
        }
        $path = ($parts['path'] ?? '') === '' ? '/' : $parts['path'];
        if (!str_starts_with($path, '/')) {
            return null;
        }
        if (isset($parts['query'])) {
            $path .= '?' . $parts['query'];
        }

        return new self($scheme, $host, $port, $path);
    }

    /** Hôte normalisé, ou null s'il est refusé. Une IPv6 est rendue sans crochets. */
    private static function normalizeHost(string $host): ?string
    {
        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            $ip = substr($host, 1, -1);

            return false !== filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) ? strtolower($ip) : null;
        }
        $host = rtrim(strtolower($host), '.');
        if ('' === $host || \strlen($host) > 253) {
            return null;
        }
        // IPv4 : seule l'écriture canonique a.b.c.d est acceptée.
        if (preg_match('/^(?:(?:0x[0-9a-f]*|[0-9]+)\.?){1,4}$/i', $host)) {
            return false !== filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && self::canonicalV4($host) ? $host : null;
        }
        if (preg_match('/[^\x20-\x7e]/', $host)) {
            if (!\function_exists('idn_to_ascii')) {
                return null;
            }
            $ascii = idn_to_ascii($host, IDNA_DEFAULT | IDNA_NONTRANSITIONAL_TO_ASCII, INTL_IDNA_VARIANT_UTS46);
            if (false === $ascii) {
                return null;
            }
            $host = strtolower($ascii);
        }
        // Nom de domaine : au moins deux étiquettes (pas d'hôte du réseau local comme « intranet » ou « localhost »).
        if (!preg_match('/^(?=.{1,253}$)([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/', $host)) {
            return null;
        }
        if (str_ends_with($host, '.localhost') || str_ends_with($host, '.local') || str_ends_with($host, '.internal') || str_ends_with($host, '.home.arpa')) {
            return null;
        }

        return $host;
    }

    private static function canonicalV4(string $ip): bool
    {
        foreach (explode('.', $ip) as $octet) {
            if (\strlen($octet) > 1 && '0' === $octet[0]) {
                return false;
            }
        }

        return 4 === substr_count($ip, '.') + 1;
    }

    public function isIp(): bool
    {
        return false !== filter_var($this->host, FILTER_VALIDATE_IP);
    }

    /** Origine (schéma, hôte, port) : sert à distinguer liens internes et externes. */
    public function origin(): string
    {
        $default = 'https' === $this->scheme ? 443 : 80;

        return $this->scheme . '://' . $this->authority() . ($this->port === $default ? '' : ':' . $this->port);
    }

    public function authority(): string
    {
        return str_contains($this->host, ':') ? '[' . $this->host . ']' : $this->host;
    }

    public function toString(): string
    {
        return $this->origin() . $this->path;
    }

    /** Même site : même hôte, en ignorant « www. ». */
    public function sameSite(self $other): bool
    {
        return preg_replace('/^www\./', '', $this->host) === preg_replace('/^www\./', '', $other->host);
    }

    /** Résout une référence (lien, en-tête Location) par rapport à cette URL (RFC 3986, section 5.2). Le fragment est ignoré. */
    public function resolve(string $reference): ?self
    {
        $reference = trim($reference);
        $hash = strpos($reference, '#');
        if (false !== $hash) {
            $reference = substr($reference, 0, $hash);
        }
        if ('' === $reference) {
            return $this;
        }
        if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $reference)) {
            return self::parse($reference);
        }
        if (str_starts_with($reference, '//')) {
            return self::parse($this->scheme . ':' . $reference);
        }
        [$basePath] = explode('?', $this->path, 2);
        if (str_starts_with($reference, '?')) {
            return self::parse($this->origin() . $basePath . $reference);
        }
        $questionMark = strpos($reference, '?');
        $refPath = false === $questionMark ? $reference : substr($reference, 0, $questionMark);
        $query = false === $questionMark ? null : substr($reference, $questionMark + 1);
        $merged = str_starts_with($refPath, '/') ? $refPath : substr($basePath, 0, (int) strrpos($basePath, '/') + 1) . $refPath;

        return self::parse($this->origin() . self::removeDotSegments($merged) . (null !== $query ? '?' . $query : ''));
    }

    private static function removeDotSegments(string $path): string
    {
        $out = [];
        $segments = explode('/', $path);
        $last = \count($segments) - 1;
        foreach ($segments as $i => $segment) {
            if ('..' === $segment) {
                if (\count($out) > 1) {
                    array_pop($out);
                }
                if ($i === $last) {
                    $out[] = '';
                }
            } elseif ('.' === $segment) {
                if ($i === $last) {
                    $out[] = '';
                }
            } else {
                $out[] = $segment;
            }
        }
        $result = implode('/', $out);

        return str_starts_with($result, '/') ? $result : '/' . $result;
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Sitemap;

/**
 * Lecture d'un fichier sitemap (protocole sitemaps.org) en flux, mémoire bornée. Sécurité : aucune entité externe ni accès
 * réseau (LIBXML_NONET), et tout DOCTYPE est refusé (un sitemap n'en a jamais besoin ; c'est la porte des attaques XXE
 * et « billion laughs »).
 */
final class SitemapParser
{
    public const NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
    /** Au-delà, la lecture s'arrête : la limite du protocole est 50 000 URL par fichier. */
    public const MAX_ENTRIES = 50_001;

    /**
     * @return array{
     *     wellFormed: bool,
     *     error: ?string,
     *     root: ?string,
     *     namespace: ?string,
     *     entries: list<array{loc: string, lastmod: ?string, changefreq: ?string, priority: ?string}>,
     *     truncated: bool
     * }
     */
    public static function parse(string $xml): array
    {
        $result = ['wellFormed' => false, 'error' => null, 'root' => null, 'namespace' => null, 'entries' => [], 'truncated' => false];
        if (preg_match('/<!DOCTYPE/i', substr($xml, 0, 4096))) {
            $result['error'] = 'doctype';

            return $result;
        }
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();
        $reader = \XMLReader::XML($xml, null, LIBXML_NONET | LIBXML_COMPACT);
        if (!$reader instanceof \XMLReader) {
            libxml_use_internal_errors($previous);
            $result['error'] = 'empty';

            return $result;
        }

        $entry = null;
        $field = null;
        $item = null;
        try {
            while (@$reader->read()) {
                if (\XMLReader::ELEMENT === $reader->nodeType) {
                    if (null === $result['root']) {
                        $result['root'] = $reader->localName;
                        $result['namespace'] = '' === $reader->namespaceURI ? null : $reader->namespaceURI;
                        $item = 'sitemapindex' === $reader->localName ? 'sitemap' : 'url';
                        continue;
                    }
                    if ($reader->localName === $item && 1 === $reader->depth) {
                        $entry = ['loc' => '', 'lastmod' => null, 'changefreq' => null, 'priority' => null];
                    } elseif (null !== $entry && 2 === $reader->depth && \in_array($reader->localName, ['loc', 'lastmod', 'changefreq', 'priority'], true)) {
                        $field = $reader->localName;
                    }
                } elseif (null !== $entry && null !== $field && (\XMLReader::TEXT === $reader->nodeType || \XMLReader::CDATA === $reader->nodeType)) {
                    $entry[$field] = ('loc' === $field ? $entry['loc'] : '') . trim($reader->value);
                } elseif (\XMLReader::END_ELEMENT === $reader->nodeType) {
                    if (2 === $reader->depth) {
                        $field = null;
                    } elseif (1 === $reader->depth && $reader->localName === $item && null !== $entry) {
                        $result['entries'][] = $entry;
                        $entry = null;
                        if (\count($result['entries']) >= self::MAX_ENTRIES) {
                            $result['truncated'] = true;
                            break;
                        }
                    }
                }
            }
            $error = libxml_get_last_error();
            $result['wellFormed'] = $result['truncated'] || (false === $error && null !== $result['root']);
            if (!$result['wellFormed']) {
                $result['error'] = false !== $error ? \sprintf('ligne %d : %s', $error->line, trim($error->message)) : 'empty';
            }
        } finally {
            $reader->close();
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        return $result;
    }

    /** Date au format W3C Datetime (AAAA, AAAA-MM, AAAA-MM-JJ, avec heure et fuseau). */
    public static function validLastmod(string $value): bool
    {
        return 1 === preg_match('/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d))?)?)?$/', $value);
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Sitemap;

use Dom\HTMLDocument;
use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\HttpResponse;
use Grichard\Api\Net\RobotsTxt;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\Url;
use Grichard\Api\Seo\Check;

/**
 * Vérification d'un sitemap.xml : découverte (adresse directe, robots.txt, /sitemap.xml), fichiers (statut, type, taille,
 * gzip, XML bien formé, protocole sitemaps.org, 50 000 URL), index parcourus récursivement (profondeur 2, 10 fichiers),
 * URL déclarées (<loc>, <lastmod>, <priority>, <changefreq>), cohérence avec robots.txt et échantillon de 20 URL testées.
 * Rien n'est conservé.
 */
final class SitemapChecker
{
    public const MAX_DOWNLOAD = 10_000_000;      // octets téléchargés par fichier
    public const MAX_UNCOMPRESSED = 52_428_800;  // 50 Mio : limite du protocole
    public const MAX_FILES = 10;
    public const MAX_DEPTH = 2;
    public const SAMPLE = 20;

    /** @var list<Check> */
    private array $checks = [];

    /** @param (\Closure(): int)|null $now horloge injectable (secondes Unix) */
    public function __construct(private readonly SafeHttpClient $http, private readonly ?\Closure $now = null) {}

    /**
     * @throws FetchError si ni le sitemap ni le site ne répondent
     *
     * @return array<string, mixed>
     */
    public function check(Url $input): array
    {
        $this->checks = [];
        $site = Url::parse($input->origin() . '/') ?? $input;

        // 1. robots.txt (toujours lu : il sert à la découverte et à la cohérence)
        $robotsResponse = $this->http->fetchAll(['robots' => Url::parse($input->origin() . '/robots.txt') ?? $site], 'GET', 512_000)['robots'];
        $robots = $robotsResponse instanceof HttpResponse && 200 === $robotsResponse->status ? RobotsTxt::parse($robotsResponse->body) : null;

        // 2. Découverte
        $direct = 1 === preg_match('~(\.xml|\.xml\.gz|\.gz)$|sitemap~i', $input->path);
        $declared = [];
        foreach (null === $robots ? [] : $robots->sitemaps as $raw) {
            $url = Url::parse($raw);
            if (null !== $url) {
                $declared[] = $url;
            }
        }
        if ($direct) {
            $roots = [$input];
            $method = 'direct';
        } elseif ([] !== $declared) {
            $roots = \array_slice($declared, 0, 3);
            $method = 'robots';
        } else {
            $roots = [Url::parse($input->origin() . '/sitemap.xml') ?? $input];
            $method = 'default';
        }

        // 3. Fichiers, niveau par niveau (index -> sitemaps enfants)
        $files = [];
        $entries = [];
        $queue = array_map(static fn(Url $u): array => ['url' => $u, 'depth' => 0], $roots);
        $seen = [];
        while ([] !== $queue && \count($files) < self::MAX_FILES) {
            $batch = [];
            foreach ($queue as $i => $item) {
                $key = $item['url']->toString();
                if (isset($seen[$key]) || \count($files) + \count($batch) >= self::MAX_FILES) {
                    continue;
                }
                $seen[$key] = true;
                $batch['f' . $i] = $item;
            }
            $queue = [];
            if ([] === $batch) {
                break;
            }
            $responses = $this->http->fetchAll(array_map(static fn(array $item): Url => $item['url'], $batch), 'GET', self::MAX_DOWNLOAD);
            foreach ($batch as $key => $item) {
                $file = $this->readFile($item['url'], $responses[$key], $item['depth']);
                foreach ($file['children'] as $child) {
                    if ($item['depth'] < self::MAX_DEPTH) {
                        $queue[] = ['url' => $child, 'depth' => $item['depth'] + 1];
                    }
                }
                foreach ($file['entries'] as $entry) {
                    $entries[] = $entry + ['sitemap' => $file['url']];
                }
                unset($file['entries'], $file['children']);
                $files[] = $file;
            }
        }
        $skippedChildren = \count($queue);
        // Aucun fichier lisible et robots.txt injoignable : c'est le site lui-même qui ne répond pas.
        $anyFile = [] !== array_filter($files, static fn(array $f): bool => 200 === $f['status']);
        if (!$anyFile && $robotsResponse instanceof FetchError) {
            throw $robotsResponse;
        }

        // 4. Contrôles
        $this->discoveryChecks($method, $robotsResponse, $robots, $declared, $files);
        $this->fileChecks($files, $skippedChildren);
        $urls = $this->urlChecks($entries, $site, $files);
        $this->robotsConsistency($entries, $robots);
        $sample = $this->sampleChecks($entries);

        return [
            'url' => $input->toString(),
            'discovery' => ['method' => $method, 'robotsFound' => null !== $robots, 'declared' => array_map(static fn(Url $u): string => $u->toString(), $declared)],
            'files' => $files,
            'urls' => $urls,
            'sample' => $sample,
            'score' => $this->score(),
            'summary' => $this->summary(),
            'checks' => $this->checks,
        ];
    }

    /**
     * @return array{url: string, status: ?int, error: ?string, contentType: ?string, bytes: int, uncompressedBytes: int, gzip: bool, wellFormed: bool, parseError: ?string, type: ?string, namespaceOk: bool, entries: list<array{loc: string, lastmod: ?string, changefreq: ?string, priority: ?string}>, count: int, truncated: bool, children: list<Url>, depth: int}
     */
    private function readFile(Url $url, HttpResponse|FetchError $response, int $depth): array
    {
        $file = [
            'url' => $url->toString(), 'status' => null, 'error' => null, 'contentType' => null, 'bytes' => 0, 'uncompressedBytes' => 0,
            'gzip' => false, 'wellFormed' => false, 'parseError' => null, 'type' => null, 'namespaceOk' => false,
            'entries' => [], 'count' => 0, 'truncated' => false, 'children' => [], 'depth' => $depth,
        ];
        if ($response instanceof FetchError) {
            $file['error'] = $response->reason;

            return $file;
        }
        $file['status'] = $response->status;
        $file['contentType'] = $response->contentType();
        $file['bytes'] = \strlen($response->body);
        $file['truncated'] = $response->truncated;
        if (200 !== $response->status) {
            return $file;
        }
        $body = $response->body;
        $file['gzip'] = 1 === preg_match('/gzip/i', $response->header('content-encoding') ?? '');
        if (str_starts_with($body, "\x1f\x8b")) { // fichier .gz servi tel quel
            $file['gzip'] = true;
            $decoded = @gzdecode($body, self::MAX_UNCOMPRESSED + 1);
            if (false === $decoded) {
                $file['parseError'] = 'gzip';

                return $file;
            }
            $body = $decoded;
        }
        $file['uncompressedBytes'] = \strlen($body);
        $parsed = SitemapParser::parse($body);
        $file['wellFormed'] = $parsed['wellFormed'];
        $file['parseError'] = $parsed['error'];
        $file['type'] = $parsed['root'];
        $file['namespaceOk'] = SitemapParser::NAMESPACE === $parsed['namespace'];
        $file['truncated'] = $file['truncated'] || $parsed['truncated'];
        $file['count'] = \count($parsed['entries']);
        if ('sitemapindex' === $parsed['root']) {
            foreach ($parsed['entries'] as $entry) {
                $child = $url->resolve($entry['loc']);
                if (null !== $child) {
                    $file['children'][] = $child;
                }
            }
        } else {
            $file['entries'] = $parsed['entries'];
        }

        return $file;
    }

    /**
     * @param list<Url>                $declared
     * @param list<array<string, mixed>> $files
     */
    private function discoveryChecks(string $method, HttpResponse|FetchError $robotsResponse, ?RobotsTxt $robots, array $declared, array $files): void
    {
        $this->add('robots_sitemap', 'discovery', Check::IMPORTANT, null === $robots ? Check::WARN : ([] === $declared ? Check::WARN : Check::PASS), [
            'robotsStatus' => $robotsResponse instanceof HttpResponse ? $robotsResponse->status : null,
            'declared' => array_map(static fn(Url $u): string => $u->toString(), $declared),
            'method' => $method,
        ]);
        $first = $files[0] ?? null;
        $found = null !== $first && 200 === $first['status'];
        $this->add('sitemap_found', 'discovery', Check::CRITICAL, $found ? Check::PASS : Check::FAIL, [
            'url' => $first['url'] ?? null,
            'status' => $first['status'] ?? null,
            'error' => $first['error'] ?? null,
        ]);
    }

    /** @param list<array<string, mixed>> $files */
    private function fileChecks(array $files, int $skipped): void
    {
        $ok = array_values(array_filter($files, static fn(array $f): bool => 200 === $f['status']));
        $failed = array_values(array_filter($files, static fn(array $f): bool => 200 !== $f['status']));
        $this->add('files_status', 'files', Check::CRITICAL, [] === $ok ? Check::FAIL : ([] === $failed ? Check::PASS : Check::FAIL), [
            'total' => \count($files),
            'failed' => array_map(static fn(array $f): array => ['url' => $f['url'], 'status' => $f['status'], 'error' => $f['error']], \array_slice($failed, 0, 10)),
            'skipped' => $skipped,
        ]);
        if ([] === $ok) {
            return;
        }
        $badXml = array_values(array_filter($ok, static fn(array $f): bool => !$f['wellFormed']));
        $this->add('xml_valid', 'files', Check::CRITICAL, [] === $badXml ? Check::PASS : Check::FAIL, [
            'invalid' => array_map(static fn(array $f): array => ['url' => $f['url'], 'error' => $f['parseError']], \array_slice($badXml, 0, 5)),
        ]);
        $badProtocol = array_values(array_filter($ok, static fn(array $f): bool => $f['wellFormed'] && (!\in_array($f['type'], ['urlset', 'sitemapindex'], true) || !$f['namespaceOk'])));
        $this->add('protocol', 'files', Check::IMPORTANT, [] === $badProtocol ? Check::PASS : Check::FAIL, [
            'invalid' => array_map(static fn(array $f): array => ['url' => $f['url'], 'root' => $f['type'], 'namespaceOk' => $f['namespaceOk']], \array_slice($badProtocol, 0, 5)),
        ]);
        $types = array_map(static fn(array $f): string => \is_string($f['contentType']) ? $f['contentType'] : '', $ok);
        $wrongType = array_values(array_filter($types, static fn(string $t): bool => !\in_array($t, ['application/xml', 'text/xml', 'application/gzip', 'application/x-gzip', 'application/octet-stream'], true)));
        $this->add('content_type', 'files', Check::MINOR, [] === $wrongType ? Check::PASS : Check::WARN, ['types' => array_values(array_unique($types))]);

        $tooBig = array_values(array_filter($ok, static fn(array $f): bool => $f['uncompressedBytes'] > self::MAX_UNCOMPRESSED || $f['count'] > 50_000 || $f['truncated']));
        $largest = max(array_map(static fn(array $f): int => \is_int($f['uncompressedBytes']) ? $f['uncompressedBytes'] : 0, $ok));
        $most = max(array_map(static fn(array $f): int => \is_int($f['count']) ? $f['count'] : 0, $ok));
        $this->add('limits', 'files', Check::IMPORTANT, [] === $tooBig ? Check::PASS : Check::FAIL, [
            'largestBytes' => $largest,
            'mostUrls' => $most,
            'over' => array_map(static fn(array $f): string => \is_string($f['url']) ? $f['url'] : '', \array_slice($tooBig, 0, 5)),
        ]);
        $gzip = array_filter($ok, static fn(array $f): bool => true === $f['gzip']);
        $this->add('compression', 'files', Check::MINOR, \count($gzip) > 0 ? Check::PASS : ($largest > 1_000_000 ? Check::WARN : Check::INFO), ['compressed' => \count($gzip), 'files' => \count($ok)]);
        $indexes = \count(array_filter($ok, static fn(array $f): bool => 'sitemapindex' === $f['type']));
        $this->add('structure', 'files', Check::MINOR, Check::INFO, ['files' => \count($ok), 'indexes' => $indexes, 'skipped' => $skipped]);
    }

    /**
     * @param list<array{loc: string, lastmod: ?string, changefreq: ?string, priority: ?string, sitemap: mixed}> $entries
     * @param list<array<string, mixed>>                                                                       $files
     *
     * @return array<string, mixed>
     */
    private function urlChecks(array $entries, Url $site, array $files): array
    {
        $seen = [];
        $issues = ['invalid' => [], 'otherHost' => [], 'notHttps' => [], 'fragment' => [], 'duplicate' => [], 'lastmodInvalid' => [], 'lastmodFuture' => [], 'priorityInvalid' => []];
        $counts = array_fill_keys(array_keys($issues), 0);
        $withPriority = 0;
        $withChangefreq = 0;
        $withLastmod = 0;
        $now = null !== $this->now ? ($this->now)() : time();
        $note = static function (string $kind, string $value) use (&$issues, &$counts): void {
            ++$counts[$kind];
            if (\count($issues[$kind]) < 5) {
                $issues[$kind][] = mb_substr($value, 0, 300);
            }
        };
        foreach ($entries as $entry) {
            $loc = $entry['loc'];
            $url = Url::parse($loc);
            if (null === $url || !preg_match('~^https?://~i', $loc)) {
                $note('invalid', $loc);
                continue;
            }
            if (str_contains($loc, '#')) {
                $note('fragment', $loc);
            }
            if (!$url->sameSite($site)) {
                $note('otherHost', $loc);
            }
            if ('https' !== $url->scheme) {
                $note('notHttps', $loc);
            }
            if (isset($seen[$url->toString()])) {
                $note('duplicate', $loc);
            }
            $seen[$url->toString()] = true;
            if (null !== $entry['lastmod'] && '' !== $entry['lastmod']) {
                ++$withLastmod;
                if (!SitemapParser::validLastmod($entry['lastmod'])) {
                    $note('lastmodInvalid', $entry['lastmod']);
                } elseif (false !== ($t = strtotime($entry['lastmod'])) && $t > $now + 86_400) {
                    $note('lastmodFuture', $entry['lastmod']);
                }
            }
            if (null !== $entry['priority'] && '' !== $entry['priority']) {
                ++$withPriority;
                if (!preg_match('/^(0(\.\d+)?|1(\.0+)?)$/', $entry['priority'])) {
                    $note('priorityInvalid', $entry['priority']);
                }
            }
            if (null !== $entry['changefreq'] && '' !== $entry['changefreq']) {
                ++$withChangefreq;
            }
        }
        $total = \count($entries);
        $this->add('urls_present', 'urls', Check::CRITICAL, $total > 0 ? Check::PASS : Check::FAIL, ['total' => $total, 'unique' => \count($seen)]);
        if (0 === $total) {
            return ['total' => 0, 'unique' => 0, 'counts' => $counts, 'examples' => $issues];
        }
        $this->add('loc_valid', 'urls', Check::CRITICAL, 0 === $counts['invalid'] ? Check::PASS : Check::FAIL, ['count' => $counts['invalid'], 'examples' => $issues['invalid']]);
        $this->add('loc_same_host', 'urls', Check::IMPORTANT, 0 === $counts['otherHost'] ? Check::PASS : Check::FAIL, ['count' => $counts['otherHost'], 'examples' => $issues['otherHost'], 'host' => $site->host]);
        $this->add('loc_https', 'urls', Check::IMPORTANT, 0 === $counts['notHttps'] ? Check::PASS : Check::WARN, ['count' => $counts['notHttps'], 'examples' => $issues['notHttps']]);
        $this->add('loc_duplicates', 'urls', Check::IMPORTANT, 0 === $counts['duplicate'] ? Check::PASS : Check::WARN, ['count' => $counts['duplicate'], 'examples' => $issues['duplicate']]);
        $this->add('loc_fragments', 'urls', Check::MINOR, 0 === $counts['fragment'] ? Check::PASS : Check::WARN, ['count' => $counts['fragment'], 'examples' => $issues['fragment']]);
        $this->add('lastmod', 'urls', Check::IMPORTANT, 0 === $withLastmod ? Check::WARN : (0 === $counts['lastmodInvalid'] + $counts['lastmodFuture'] ? Check::PASS : Check::FAIL), [
            'with' => $withLastmod,
            'total' => $total,
            'invalid' => $counts['lastmodInvalid'],
            'future' => $counts['lastmodFuture'],
            'examples' => [...$issues['lastmodInvalid'], ...$issues['lastmodFuture']],
        ]);
        $this->add('priority_changefreq', 'urls', Check::MINOR, 0 === $withPriority + $withChangefreq ? Check::PASS : Check::INFO, [
            'priority' => $withPriority,
            'changefreq' => $withChangefreq,
            'priorityInvalid' => $counts['priorityInvalid'],
        ]);

        return ['total' => $total, 'unique' => \count($seen), 'counts' => $counts, 'examples' => $issues];
    }

    /** @param list<array{loc: string, lastmod: ?string, changefreq: ?string, priority: ?string, sitemap: mixed}> $entries */
    private function robotsConsistency(array $entries, ?RobotsTxt $robots): void
    {
        if (null === $robots || [] === $entries) {
            return;
        }
        $blocked = [];
        $count = 0;
        foreach ($entries as $entry) {
            $url = Url::parse($entry['loc']);
            if (null !== $url && !$robots->allows($url->path)) {
                ++$count;
                if (\count($blocked) < 5) {
                    $blocked[] = $url->toString();
                }
            }
        }
        $this->add('robots_blocked', 'urls', Check::CRITICAL, 0 === $count ? Check::PASS : Check::FAIL, ['count' => $count, 'examples' => $blocked]);
    }

    /**
     * @param list<array{loc: string, lastmod: ?string, changefreq: ?string, priority: ?string, sitemap: mixed}> $entries
     *
     * @return list<array<string, mixed>>
     */
    private function sampleChecks(array $entries): array
    {
        $urls = [];
        foreach ($entries as $entry) {
            $url = Url::parse($entry['loc']);
            if (null !== $url) {
                $urls[$url->toString()] = $url;
            }
        }
        $urls = array_values($urls);
        if ([] === $urls) {
            return [];
        }
        // échantillon réparti sur toute la liste (début, milieu, fin), pas seulement les premières URL
        $n = \count($urls);
        $picked = [];
        $size = min(self::SAMPLE, $n);
        for ($i = 0; $i < $size; ++$i) {
            $picked['s' . $i] = $urls[intdiv($i * $n, $size)];
        }
        $responses = $this->http->fetchAll($picked, 'GET', 512_000);
        $sample = [];
        $problems = ['error' => 0, 'redirect' => 0, 'noindex' => 0, 'canonical' => 0];
        foreach ($picked as $key => $url) {
            $response = $responses[$key];
            $row = ['url' => $url->toString(), 'status' => null, 'finalUrl' => null, 'redirects' => 0, 'noindex' => false, 'canonical' => null, 'canonicalMismatch' => false, 'error' => null];
            if ($response instanceof FetchError) {
                $row['error'] = $response->reason;
                ++$problems['error'];
            } else {
                $row['status'] = $response->status;
                $row['finalUrl'] = $response->url->toString();
                $row['redirects'] = \count($response->redirects);
                if ($response->status >= 400) {
                    ++$problems['error'];
                }
                if ($row['redirects'] > 0) {
                    ++$problems['redirect'];
                }
                [$noindex, $canonical] = self::indexing($response);
                $row['noindex'] = $noindex;
                $row['canonical'] = $canonical?->toString();
                $row['canonicalMismatch'] = null !== $canonical && $canonical->toString() !== $url->toString();
                $problems['noindex'] += (int) $noindex;
                $problems['canonical'] += (int) $row['canonicalMismatch'];
            }
            $sample[] = $row;
        }
        $checked = \count($sample);
        $this->add('sample_status', 'sample', Check::CRITICAL, 0 === $problems['error'] ? Check::PASS : Check::FAIL, ['checked' => $checked, 'errors' => $problems['error']]);
        $this->add('sample_redirects', 'sample', Check::IMPORTANT, 0 === $problems['redirect'] ? Check::PASS : Check::WARN, ['checked' => $checked, 'count' => $problems['redirect']]);
        $this->add('sample_noindex', 'sample', Check::CRITICAL, 0 === $problems['noindex'] ? Check::PASS : Check::FAIL, ['checked' => $checked, 'count' => $problems['noindex']]);
        $this->add('sample_canonical', 'sample', Check::IMPORTANT, 0 === $problems['canonical'] ? Check::PASS : Check::WARN, ['checked' => $checked, 'count' => $problems['canonical']]);

        return $sample;
    }

    /** @return array{bool, ?Url} noindex (meta ou X-Robots-Tag) et canonical déclarée */
    private static function indexing(HttpResponse $response): array
    {
        $noindex = 1 === preg_match('/noindex|none/i', $response->header('x-robots-tag') ?? '');
        $canonical = null;
        if (str_contains($response->contentType(), 'html') && '' !== $response->body) {
            $doc = HTMLDocument::createFromString($response->body, LIBXML_NOERROR);
            foreach ($doc->querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]') as $meta) {
                if (1 === preg_match('/noindex|none/i', $meta->getAttribute('content') ?? '')) {
                    $noindex = true;
                }
            }
            $href = trim($doc->querySelector('link[rel~="canonical" i]')?->getAttribute('href') ?? '');
            $canonical = '' === $href ? null : $response->url->resolve($href);
        }

        return [$noindex, $canonical];
    }

    private function score(): int
    {
        $earned = 0.0;
        $total = 0;
        foreach ($this->checks as $check) {
            if (Check::INFO === $check->status) {
                continue;
            }
            $total += $check->weight();
            $earned += match ($check->status) {
                Check::PASS => $check->weight(),
                Check::WARN => $check->weight() / 2,
                default => 0,
            };
        }

        return 0 === $total ? 0 : (int) round(100 * $earned / $total);
    }

    /** @return array<string, int> */
    private function summary(): array
    {
        $summary = ['critical' => 0, 'important' => 0, 'info' => 0, 'passed' => 0];
        foreach ($this->checks as $check) {
            if (Check::PASS === $check->status) {
                ++$summary['passed'];
            } elseif (Check::INFO !== $check->status) {
                ++$summary[$check->severity];
            }
        }

        return $summary;
    }

    /** @param array<string, mixed> $data */
    private function add(string $id, string $category, string $severity, string $status, array $data = []): void
    {
        $this->checks[] = new Check($id, $category, $severity, $status, $data);
    }
}

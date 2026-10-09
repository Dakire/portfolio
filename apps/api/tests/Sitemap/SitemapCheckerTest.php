<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Sitemap;

use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\TransportResult;
use Grichard\Api\Net\Url;
use Grichard\Api\Seo\Check;
use Grichard\Api\Sitemap\SitemapChecker;
use Grichard\Api\Tests\Support\FakeResolver;
use Grichard\Api\Tests\Support\FakeTransport;
use PHPUnit\Framework\TestCase;

final class SitemapCheckerTest extends TestCase
{
    private const NOW = 1_791_500_000; // octobre 2026

    private static function xml(string $body): TransportResult
    {
        return FakeTransport::ok($body, 200, ['content-type' => ['application/xml']]);
    }

    private static function urlset(string ...$urls): string
    {
        return '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . implode('', $urls) . '</urlset>';
    }

    /**
     * @param array<string, TransportResult> $responses
     *
     * @return array<string, mixed>
     */
    private static function checkSite(array $responses, string $input = 'https://exemple.fr/'): array
    {
        $client = new SafeHttpClient(new FakeTransport($responses), new FakeResolver(['exemple.fr' => ['93.184.216.34'], 'autre.fr' => ['93.184.216.35']]));

        return new SitemapChecker($client, static fn(): int => self::NOW)->check(Url::parse($input) ?? self::fail('URL'));
    }

    /**
     * @param array<string, mixed> $report
     *
     * @return array<string, Check>
     */
    private static function byId(array $report): array
    {
        self::assertIsArray($report['checks']);
        $out = [];
        foreach ($report['checks'] as $check) {
            self::assertInstanceOf(Check::class, $check);
            $out[$check->id] = $check;
        }

        return $out;
    }

    public function testAHealthySitemapDiscoveredThroughRobotsTxt(): void
    {
        $report = self::checkSite([
            'https://exemple.fr/robots.txt' => FakeTransport::ok("User-agent: *\nDisallow: /admin/\nSitemap: https://exemple.fr/index.xml", 200, ['content-type' => ['text/plain']]),
            'https://exemple.fr/index.xml' => self::xml('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://exemple.fr/pages.xml.gz</loc></sitemap></sitemapindex>'),
            'https://exemple.fr/pages.xml.gz' => FakeTransport::ok((string) gzencode(self::urlset(
                '<url><loc>https://exemple.fr/</loc><lastmod>2026-10-01</lastmod></url>',
                '<url><loc>https://exemple.fr/contact/</loc><lastmod>2026-09-01T10:00:00+02:00</lastmod></url>',
            )), 200, ['content-type' => ['application/gzip']]),
            'https://exemple.fr/' => FakeTransport::ok('<html><head><link rel="canonical" href="https://exemple.fr/"></head></html>'),
            'https://exemple.fr/contact/' => FakeTransport::ok('<html><head><link rel="canonical" href="/contact/"></head></html>'),
        ]);
        $checks = self::byId($report);
        self::assertIsArray($report['discovery']);
        self::assertSame('robots', $report['discovery']['method']);
        $notPassed = array_keys(array_filter($checks, static fn(Check $c): bool => Check::PASS !== $c->status && Check::INFO !== $c->status));
        self::assertSame([], $notPassed);
        self::assertSame(100, $report['score']);
        self::assertSame(['files' => 2, 'indexes' => 1, 'skipped' => 0], $checks['structure']->data);
        self::assertSame(1, $checks['compression']->data['compressed']);
    }

    public function testFallsBackToSitemapXmlAndFindsEveryUrlProblem(): void
    {
        $report = self::checkSite([
            'https://exemple.fr/robots.txt' => FakeTransport::ok("User-agent: *\nDisallow: /prive/", 200, ['content-type' => ['text/plain']]),
            'https://exemple.fr/sitemap.xml' => self::xml(self::urlset(
                '<url><loc>https://exemple.fr/a</loc><lastmod>09/10/2026</lastmod><priority>0.5</priority><changefreq>daily</changefreq></url>',
                '<url><loc>https://exemple.fr/a</loc><lastmod>2030-01-01</lastmod></url>',
                '<url><loc>http://exemple.fr/b#section</loc></url>',
                '<url><loc>https://autre.fr/c</loc></url>',
                '<url><loc>/relatif</loc></url>',
                '<url><loc>https://exemple.fr/prive/d</loc></url>',
            )),
            'https://exemple.fr/a' => FakeTransport::ok('<html><head><meta name="robots" content="noindex"><link rel="canonical" href="https://exemple.fr/autre"></head></html>'),
            'http://exemple.fr/b' => FakeTransport::redirect('https://exemple.fr/b'),
            'https://exemple.fr/b' => FakeTransport::ok(),
            'https://autre.fr/c' => FakeTransport::ok('', 404),
            'https://exemple.fr/prive/d' => FakeTransport::ok(),
        ]);
        $checks = self::byId($report);
        self::assertIsArray($report['discovery']);
        self::assertSame('default', $report['discovery']['method']);
        self::assertSame(Check::WARN, $checks['robots_sitemap']->status);
        $expected = [
            'loc_valid' => Check::FAIL, 'loc_same_host' => Check::FAIL, 'loc_https' => Check::WARN, 'loc_duplicates' => Check::WARN,
            'loc_fragments' => Check::WARN, 'lastmod' => Check::FAIL, 'priority_changefreq' => Check::INFO, 'robots_blocked' => Check::FAIL,
            'sample_status' => Check::FAIL, 'sample_redirects' => Check::WARN, 'sample_noindex' => Check::FAIL, 'sample_canonical' => Check::WARN,
        ];
        foreach ($expected as $id => $status) {
            self::assertSame($status, $checks[$id]->status, $id);
        }
        self::assertSame(1, $checks['lastmod']->data['invalid']);
        self::assertSame(1, $checks['lastmod']->data['future']);
        self::assertSame(['https://exemple.fr/prive/d'], $checks['robots_blocked']->data['examples']);
        self::assertLessThan(60, $report['score']);
    }

    public function testReportsAMissingOrBrokenSitemap(): void
    {
        $missing = self::byId(self::checkSite([
            'https://exemple.fr/robots.txt' => FakeTransport::ok('', 404),
            'https://exemple.fr/sitemap.xml' => FakeTransport::ok('Not found', 404),
        ]));
        self::assertSame(Check::FAIL, $missing['sitemap_found']->status);
        self::assertSame(Check::FAIL, $missing['urls_present']->status);

        $broken = self::byId(self::checkSite([
            'https://exemple.fr/sitemap.xml' => self::xml('<urlset><url><loc>x</url>'),
        ], 'https://exemple.fr/sitemap.xml'));
        self::assertSame(Check::FAIL, $broken['xml_valid']->status);
        self::assertSame(Check::PASS, $broken['protocol']->status, 'le protocole ne se juge que sur un XML lisible');
    }

    public function testFlagsAWrongRootOrNamespace(): void
    {
        $checks = self::byId(self::checkSite([
            'https://exemple.fr/sitemap.xml' => self::xml('<urlset><url><loc>https://exemple.fr/</loc></url></urlset>'),
            'https://exemple.fr/' => FakeTransport::ok(),
        ], 'https://exemple.fr/sitemap.xml'));
        self::assertSame(Check::FAIL, $checks['protocol']->status);
    }

    public function testTheSiteMustBeReachable(): void
    {
        $this->expectException(FetchError::class);
        self::checkSite([]);
    }
}

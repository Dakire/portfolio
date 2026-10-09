<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Sitemap;

use Grichard\Api\Sitemap\SitemapParser;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class SitemapParserTest extends TestCase
{
    public function testReadsAUrlset(): void
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            . '<url><loc>https://exemple.fr/</loc><lastmod>2026-10-01</lastmod><priority>0.8</priority></url>'
            . '<url><loc> https://exemple.fr/a?x=1&amp;y=2 </loc><changefreq>weekly</changefreq></url></urlset>';
        $parsed = SitemapParser::parse($xml);
        self::assertTrue($parsed['wellFormed']);
        self::assertSame('urlset', $parsed['root']);
        self::assertSame(SitemapParser::NAMESPACE, $parsed['namespace']);
        self::assertSame([
            ['loc' => 'https://exemple.fr/', 'lastmod' => '2026-10-01', 'changefreq' => null, 'priority' => '0.8'],
            ['loc' => 'https://exemple.fr/a?x=1&y=2', 'lastmod' => null, 'changefreq' => 'weekly', 'priority' => null],
        ], $parsed['entries']);
    }

    public function testReadsAnIndex(): void
    {
        $parsed = SitemapParser::parse('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://exemple.fr/s1.xml</loc></sitemap></sitemapindex>');
        self::assertSame('sitemapindex', $parsed['root']);
        self::assertSame('https://exemple.fr/s1.xml', $parsed['entries'][0]['loc'] ?? null);
    }

    public function testReportsMalformedXmlWithItsLine(): void
    {
        $parsed = SitemapParser::parse("<urlset>\n<url><loc>https://exemple.fr/</loc></url>\n<url><loc>x</url></urlset>");
        self::assertFalse($parsed['wellFormed']);
        self::assertStringContainsString('ligne 3', (string) $parsed['error']);
    }

    public function testRefusesDoctypesAgainstXxe(): void
    {
        $xxe = '<?xml version="1.0"?><!DOCTYPE u [<!ENTITY x SYSTEM "file:///etc/passwd">]><urlset><url><loc>&x;</loc></url></urlset>';
        $parsed = SitemapParser::parse($xxe);
        self::assertFalse($parsed['wellFormed']);
        self::assertSame('doctype', $parsed['error']);
        self::assertSame([], $parsed['entries']);
    }

    public function testStopsAfterTheProtocolLimit(): void
    {
        $xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . str_repeat('<url><loc>https://exemple.fr/p</loc></url>', 50_010) . '</urlset>';
        $parsed = SitemapParser::parse($xml);
        self::assertTrue($parsed['truncated']);
        self::assertCount(SitemapParser::MAX_ENTRIES, $parsed['entries']);
    }

    /** @return iterable<string, array{string, bool}> */
    public static function dates(): iterable
    {
        foreach (['2026' => true, '2026-10' => true, '2026-10-09' => true, '2026-10-09T14:30+02:00' => true, '2026-10-09T14:30:15Z' => true, '2026-10-09T14:30:15.5-05:00' => true,
            '09/10/2026' => false, '2026-13-01' => false, '2026-10-09 14:30' => false, '2026-10-09T14:30' => false, 'hier' => false] as $date => $valid) {
            yield (string) $date => [(string) $date, $valid];
        }
    }

    #[DataProvider('dates')]
    public function testValidatesW3cDates(string $date, bool $valid): void
    {
        self::assertSame($valid, SitemapParser::validLastmod($date));
    }
}

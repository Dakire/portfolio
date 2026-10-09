<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Net;

use Grichard\Api\Net\Url;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class UrlTest extends TestCase
{
    public function testNormalizesVisitorInput(): void
    {
        self::assertSame('https://exemple.fr/', Url::fromInput('  Exemple.FR. ')?->toString());
        self::assertSame('http://exemple.fr/a?b=1', Url::fromInput('http://exemple.fr/a?b=1#ancre')?->toString());
        self::assertSame('https://xn--caf-dma.fr/', Url::fromInput('café.fr')?->toString());
        self::assertSame('https://exemple.fr/', Url::fromInput('https://exemple.fr:443')?->toString());
        self::assertSame('https://0xabc.com/', Url::fromInput('0xabc.com')?->toString());
    }

    /** @return iterable<string, array{string}> */
    public static function refused(): iterable
    {
        foreach ([
            'ftp://exemple.fr/', 'file:///etc/passwd', 'gopher://exemple.fr/', 'javascript:alert(1)',
            'https://user:pass@exemple.fr/', 'https://exemple.fr:8080/', 'https://exemple.fr:22/',
            'http://localhost/', 'http://intranet/', 'http://machine.local/', 'http://app.internal/', 'http://box.home.arpa/',
            'http://2130706433/', 'http://0x7f.1/', 'http://0x7f000001/', 'http://0177.0.0.1/', 'http://127.1/',
            'http://[::1', 'https://exe mple.fr/', "https://exemple.fr/\n", '', 'https://' . str_repeat('a', 2100) . '.fr/',
        ] as $raw) {
            yield '« ' . substr($raw, 0, 60) . ' »' => [$raw];
        }
    }

    #[DataProvider('refused')]
    public function testRefusesDangerousOrInvalidUrls(string $raw): void
    {
        self::assertNull(Url::parse($raw));
    }

    public function testKeepsCanonicalLiteralIpsForTheIpPolicy(): void
    {
        // une IP littérale canonique passe l'analyse : c'est IpPolicy qui la refuse si elle n'est pas publique
        self::assertSame('127.0.0.1', Url::parse('http://127.0.0.1/')?->host);
        $ipv6 = Url::parse('http://[::1]/');
        self::assertNotNull($ipv6);
        self::assertSame('::1', $ipv6->host);
        self::assertSame('http://[::1]/', $ipv6->toString());
    }

    /** @return iterable<string, array{string, string}> */
    public static function references(): iterable
    {
        yield 'absolue' => ['https://autre.fr/x', 'https://autre.fr/x'];
        yield 'sans schéma' => ['//cdn.exemple.fr/a.js', 'https://cdn.exemple.fr/a.js'];
        yield 'racine' => ['/contact/', 'https://exemple.fr/contact/'];
        yield 'relative' => ['page.html', 'https://exemple.fr/blog/page.html'];
        yield 'parent' => ['../a/./b', 'https://exemple.fr/a/b'];
        yield 'trop de parents' => ['../../../../x', 'https://exemple.fr/x'];
        yield 'requête seule' => ['?p=2', 'https://exemple.fr/blog/article?p=2'];
        yield 'ancre' => ['#haut', 'https://exemple.fr/blog/article?x=1'];
    }

    #[DataProvider('references')]
    public function testResolvesReferences(string $reference, string $expected): void
    {
        $base = Url::parse('https://exemple.fr/blog/article?x=1');
        self::assertNotNull($base);
        self::assertSame($expected, $base->resolve($reference)?->toString());
    }

    public function testRefusesRedirectTargetsThatAreNotPlainHttp(): void
    {
        self::assertNull(Url::parse('https://exemple.fr/')?->resolve('file:///etc/passwd'));
        self::assertNull(Url::parse('https://exemple.fr/')?->resolve('http://user@exemple.fr/'));
    }

    public function testSameSiteIgnoresWww(): void
    {
        $a = Url::parse('https://www.exemple.fr/');
        $b = Url::parse('https://exemple.fr/x');
        $c = Url::parse('https://autre.fr/');
        self::assertNotNull($a);
        self::assertNotNull($b);
        self::assertNotNull($c);
        self::assertTrue($a->sameSite($b));
        self::assertFalse($a->sameSite($c));
    }
}

<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Seo;

use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\TransportResult;
use Grichard\Api\Net\Url;
use Grichard\Api\Seo\Check;
use Grichard\Api\Seo\SeoAnalyzer;
use Grichard\Api\Tests\Support\FakeResolver;
use Grichard\Api\Tests\Support\FakeTransport;
use PHPUnit\Framework\TestCase;

final class SeoAnalyzerTest extends TestCase
{
    private const GOOD_HEADERS = [
        'content-type' => ['text/html; charset=utf-8'],
        'content-encoding' => ['gzip'],
        'strict-transport-security' => ['max-age=31536000; includeSubDomains'],
        'content-security-policy' => ["default-src 'self'; frame-ancestors 'self'"],
        'x-content-type-options' => ['nosniff'],
        'referrer-policy' => ['strict-origin-when-cross-origin'],
        'permissions-policy' => ['camera=()'],
    ];

    private static function goodPage(): string
    {
        $words = str_repeat('Administration réseau et sécurité des systèmes pour les petites entreprises. ', 40);

        return <<<HTML
            <!doctype html>
            <html lang="fr">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Exemple : administration réseau et sécurité IT</title>
              <meta name="description" content="Conseil en administration réseau, sécurité des systèmes et formation des équipes pour les PME de la région.">
              <link rel="canonical" href="https://exemple.fr/">
              <link rel="icon" href="/favicon.svg">
              <meta property="og:title" content="Exemple"><meta property="og:description" content="Desc">
              <meta property="og:image" content="https://exemple.fr/og.png"><meta property="og:url" content="https://exemple.fr/">
              <meta name="twitter:card" content="summary_large_image">
              <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite"},{"@type":"Person"}]}</script>
            </head>
            <body>
              <a href="#contenu">Aller au contenu</a>
              <header><nav><a href="/a-propos/">À propos</a> <a href="https://autre.fr/">Partenaire</a> <a href="mailto:x@exemple.fr">Écrire</a></nav></header>
              <main id="contenu">
                <h1>Administration réseau</h1><h2>Sécurité</h2><h3>Pare-feu</h3>
                <p>{$words}</p>
                <img src="/photo.jpg" alt="Salle serveur"><img src="/deco.svg" alt="">
                <form><label for="mail">E-mail</label><input id="mail" type="email"><label>Nom <input name="nom"></label><input type="hidden" name="t"></form>
              </main>
              <footer>Pied</footer>
            </body>
            </html>
            HTML;
    }

    /**
     * @param array<string, TransportResult> $responses
     *
     * @return array<string, mixed>
     */
    private static function analyze(array $responses, string $url = 'https://exemple.fr/'): array
    {
        $client = new SafeHttpClient(new FakeTransport($responses), new FakeResolver(['exemple.fr' => ['93.184.216.34'], 'autre.fr' => ['93.184.216.35']]));

        return new SeoAnalyzer($client)->analyze(Url::parse($url) ?? self::fail('URL'));
    }

    /**
     * @param array<string, mixed> $report
     *
     * @return array<string, Check>
     */
    private static function byId(array $report): array
    {
        $checks = $report['checks'];
        self::assertIsArray($checks);
        $out = [];
        foreach ($checks as $check) {
            self::assertInstanceOf(Check::class, $check);
            $out[$check->id] = $check;
        }

        return $out;
    }

    public function testAWellBuiltPagePassesNearlyEverything(): void
    {
        $report = self::analyze([
            'https://exemple.fr/' => FakeTransport::ok(self::goodPage(), 200, self::GOOD_HEADERS),
            'https://exemple.fr/robots.txt' => FakeTransport::ok("User-agent: *\nDisallow: /admin/\nSitemap: https://exemple.fr/sitemap.xml", 200, ['content-type' => ['text/plain']]),
            'https://exemple.fr/a-propos/' => FakeTransport::ok(),
            'https://autre.fr/' => FakeTransport::ok(),
        ]);
        $checks = self::byId($report);
        $notPassed = array_keys(array_filter($checks, static fn(Check $c): bool => Check::PASS !== $c->status && Check::INFO !== $c->status));
        self::assertSame([], $notPassed);
        self::assertSame(100, $report['score']);
        self::assertSame(['internal' => 1, 'external' => 1, 'nofollow' => 0], $checks['links']->data);
        self::assertSame(['WebSite', 'Person'], $checks['structured_data']->data['types']);
        self::assertSame(2, $checks['a11y_labels']->data['total'], 'les champs cachés ne comptent pas');
    }

    public function testAPoorPageGetsPrioritisedFindings(): void
    {
        $html = '<html><head><title>Accueil</title><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, user-scalable=no">'
            . '<script type="application/ld+json">{pas du json}</script></head>'
            . '<body><h2>Sous-titre</h2><h4>Saut</h4><img src="a.png"><img src="b.png"><input name="q"><a href="/mort">x</a></body></html>';
        $report = self::analyze([
            'http://exemple.fr/' => FakeTransport::redirect('http://exemple.fr/accueil', 302),
            'http://exemple.fr/accueil' => FakeTransport::ok($html),
            'http://exemple.fr/robots.txt' => FakeTransport::ok("User-agent: *\nDisallow: /", 200, ['content-type' => ['text/plain']]),
            'http://exemple.fr/mort' => FakeTransport::ok('', 404),
        ], 'http://exemple.fr/');
        $checks = self::byId($report);
        foreach (['https', 'robots_meta', 'h1', 'images_alt', 'broken_links', 'structured_data', 'robots_txt', 'csp', 'x_content_type_options', 'a11y_labels', 'a11y_landmarks', 'lang', 'meta_description', 'word_count'] as $id) {
            self::assertSame(Check::FAIL, $checks[$id]->status, $id);
        }
        self::assertSame(Check::WARN, $checks['favicon']->status);
        self::assertSame(Check::WARN, $checks['title']->status, 'titre trop court');
        self::assertSame(Check::WARN, $checks['viewport']->status, 'zoom bloqué');
        self::assertSame(Check::WARN, $checks['headings_order']->status);
        self::assertSame(2, $checks['images_alt']->data['missing']);
        self::assertIsArray($report['summary']);
        self::assertSame(3, $report['summary']['critical'], 'https, noindex et titre');
        self::assertLessThan(40, $report['score']);
        self::assertTrue($checks['robots_txt']->data['blocksEverything']);
        self::assertSame(1, $checks['redirects']->data['count']);
    }

    public function testLinksBehindABotWallAreNotReportedAsBroken(): void
    {
        $html = '<html lang="fr"><body><main><h1>T</h1><a href="https://autre.fr/profil">LinkedIn</a></main></body></html>';
        $report = self::analyze([
            'https://exemple.fr/' => FakeTransport::ok($html),
            'https://autre.fr/profil' => new TransportResult(999, [], '', false, 0.1, 0.1),
        ]);
        $links = self::byId($report)['broken_links'];
        self::assertSame(Check::PASS, $links->status);
        self::assertSame([['url' => 'https://autre.fr/profil', 'status' => 999]], $links->data['unverified']);
    }

    public function testANonHtmlResponseIsReported(): void
    {
        $report = self::analyze(['https://exemple.fr/' => FakeTransport::ok('%PDF-1.7', 200, ['content-type' => ['application/pdf']])]);
        $checks = self::byId($report);
        self::assertSame(Check::FAIL, $checks['html']->status);
        self::assertArrayNotHasKey('title', $checks);
    }

    public function testThePageItselfMustBeReachable(): void
    {
        $this->expectException(FetchError::class);
        self::analyze([]);
    }
}

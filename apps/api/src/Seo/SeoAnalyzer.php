<?php

declare(strict_types=1);

namespace Grichard\Api\Seo;

use Dom\Element;
use Dom\HTMLDocument;
use Dom\XPath;
use Grichard\Api\Net\FetchError;
use Grichard\Api\Net\HttpResponse;
use Grichard\Api\Net\RobotsTxt;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\Url;

/**
 * Rapport SEO d'une page : une requête pour la page, puis un seul lot parallèle pour robots.txt, le favicon et un
 * échantillon de liens. Analyse HTML5 par Dom\HTMLDocument (le parseur des navigateurs, PHP 8.4+).
 * Rien n'est conservé : ni l'URL, ni la page, ni le rapport.
 */
final class SeoAnalyzer
{
    public const MAX_PAGE_BYTES = 2_000_000;
    private const SAMPLE_INTERNAL = 6;
    private const SAMPLE_EXTERNAL = 4;
    private const XHTML = 'http://www.w3.org/1999/xhtml';
    /** Réponses des sites qui refusent les robots (LinkedIn répond 999) : le lien n'est pas vérifiable, pas forcément cassé. */
    private const BOT_WALL = [401, 403, 429, 999];

    /** @var list<Check> */
    private array $checks = [];

    public function __construct(private readonly SafeHttpClient $http) {}

    /**
     * @throws FetchError si la page elle-même ne peut pas être obtenue
     *
     * @return array<string, mixed>
     */
    public function analyze(Url $url): array
    {
        $this->checks = [];
        $page = $this->http->fetch($url, 'GET', self::MAX_PAGE_BYTES);
        $isHtml = \in_array($page->contentType(), ['text/html', 'application/xhtml+xml', ''], true) && '' !== trim($page->body);

        $this->httpChecks($url, $page);
        $doc = $isHtml ? self::parse($page) : null;
        if (null === $doc) {
            $this->add('html', 'http', Check::CRITICAL, Check::FAIL, ['contentType' => $page->contentType()]);
        }

        // Lot parallèle : robots.txt, favicon par défaut (si la page n'en déclare pas) et échantillon de liens.
        $links = null !== $doc ? $this->links($doc, $page->url) : ['internal' => [], 'external' => [], 'nofollow' => 0];
        $declaredIcon = null !== $doc ? $this->declaredIcon($doc, $page->url) : null;
        $batch = ['robots' => self::at($page->url, '/robots.txt')];
        if (null === $declaredIcon) {
            $batch['favicon'] = self::at($page->url, '/favicon.ico');
        }
        $sample = [
            ...\array_slice($links['internal'], 0, self::SAMPLE_INTERNAL),
            ...\array_slice($links['external'], 0, self::SAMPLE_EXTERNAL),
        ];
        foreach ($sample as $i => $link) {
            $batch['link' . $i] = $link;
        }
        $batch = array_filter($batch, static fn(?Url $u): bool => null !== $u);
        $fetched = $this->http->fetchAll($batch, 'GET', 256_000);

        if (null !== $doc) {
            $this->meta($doc, $page);
            $this->content($doc, $page);
            $this->images($doc);
            $this->linkChecks($links, $sample, $fetched);
            $this->social($doc);
            $this->structuredData($doc);
            $this->favicon($declaredIcon, $fetched['favicon'] ?? null);
            $this->accessibility($doc);
        }
        $this->robots($fetched['robots'] ?? null, $page->url);
        $this->security($page);

        return [
            'url' => $url->toString(),
            'finalUrl' => $page->url->toString(),
            'status' => $page->status,
            'score' => $this->score(),
            'summary' => $this->summary(),
            'checks' => $this->checks,
        ];
    }

    // ---------------------------------------------------------------- HTTP

    private function httpChecks(Url $requested, HttpResponse $page): void
    {
        $status = $page->status;
        $this->add('http_status', 'http', Check::CRITICAL, 200 === $status ? Check::PASS : ($status >= 200 && $status < 300 ? Check::WARN : Check::FAIL), ['status' => $status]);
        $this->add('https', 'http', Check::CRITICAL, 'https' === $page->url->scheme ? Check::PASS : Check::FAIL, ['scheme' => $page->url->scheme]);

        $hops = \count($page->redirects);
        $this->add('redirects', 'http', Check::IMPORTANT, $hops <= 1 ? Check::PASS : ($hops <= 3 ? Check::WARN : Check::FAIL), [
            'count' => $hops,
            'chain' => [...$page->redirects, ['url' => $page->url->toString(), 'status' => $status]],
            'httpToHttps' => 'http' === $requested->scheme && 'https' === $page->url->scheme,
        ]);

        if ('https' === $page->url->scheme) {
            $hsts = $page->header('strict-transport-security');
            $maxAge = null !== $hsts && preg_match('/max-age\s*=\s*"?(\d+)/i', $hsts, $m) ? (int) $m[1] : null;
            $this->add('hsts', 'http', Check::IMPORTANT, null === $maxAge ? Check::FAIL : ($maxAge >= 15_552_000 ? Check::PASS : Check::WARN), [
                'value' => $hsts,
                'maxAge' => $maxAge,
                'includeSubDomains' => null !== $hsts && str_contains(strtolower($hsts), 'includesubdomains'),
            ]);
        }

        $seconds = round($page->seconds, 3);
        $this->add('response_time', 'http', Check::IMPORTANT, $seconds < 0.8 ? Check::PASS : ($seconds < 2.0 ? Check::WARN : Check::FAIL), [
            'seconds' => $seconds,
            'firstByte' => round($page->firstByteSeconds, 3),
            'bytes' => \strlen($page->body),
            'truncated' => $page->truncated,
        ]);

        $encoding = strtolower($page->header('content-encoding') ?? '');
        $compressed = '' !== $encoding && 1 === preg_match('/\b(gzip|br|deflate|zstd)\b/', $encoding);
        $this->add('compression', 'http', Check::IMPORTANT, $compressed ? Check::PASS : (\strlen($page->body) < 1_500 ? Check::INFO : Check::FAIL), ['encoding' => '' === $encoding ? null : $encoding]);
    }

    // ---------------------------------------------------------------- Métadonnées

    private function meta(HTMLDocument $doc, HttpResponse $page): void
    {
        $title = self::text($doc->querySelector('head title') ?? $doc->querySelector('title'));
        $length = mb_strlen($title);
        $this->add('title', 'meta', Check::CRITICAL, '' === $title ? Check::FAIL : ($length >= 30 && $length <= 60 ? Check::PASS : Check::WARN), [
            'value' => self::cut($title, 200),
            'length' => $length,
            'count' => \count($doc->querySelectorAll('title')),
        ]);

        $description = trim(self::attr($doc->querySelector('meta[name="description" i]'), 'content'));
        $length = mb_strlen($description);
        $this->add('meta_description', 'meta', Check::IMPORTANT, '' === $description ? Check::FAIL : ($length >= 70 && $length <= 160 ? Check::PASS : Check::WARN), [
            'value' => self::cut($description, 320),
            'length' => $length,
        ]);

        $canonicals = $doc->querySelectorAll('link[rel~="canonical" i]');
        $href = trim(self::attr($canonicals->item(0), 'href'));
        $canonical = '' === $href ? null : $page->url->resolve($href);
        $status = match (true) {
            '' === $href => Check::WARN,
            null === $canonical, \count($canonicals) > 1 => Check::FAIL,
            $canonical->toString() === $page->url->toString() => Check::PASS,
            default => Check::WARN, // page qui en désigne une autre : à vérifier, pas forcément une erreur
        };
        $this->add('canonical', 'meta', Check::IMPORTANT, $status, [
            'value' => '' === $href ? null : self::cut($href, 300),
            'resolved' => $canonical?->toString(),
            'self' => null !== $canonical && $canonical->toString() === $page->url->toString(),
            'count' => \count($canonicals),
        ]);

        $metaRobots = strtolower(trim(implode(', ', array_map(
            static fn(Element $e): string => $e->getAttribute('content') ?? '',
            iterator_to_array($doc->querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]')),
        ))));
        $headerRobots = strtolower($page->header('x-robots-tag') ?? '');
        $noindex = str_contains($metaRobots, 'noindex') || str_contains($metaRobots, 'none') || str_contains($headerRobots, 'noindex') || str_contains($headerRobots, 'none');
        $this->add('robots_meta', 'meta', Check::CRITICAL, $noindex ? Check::FAIL : Check::PASS, [
            'meta' => '' === $metaRobots ? null : $metaRobots,
            'header' => '' === $headerRobots ? null : $headerRobots,
            'nofollow' => str_contains($metaRobots . $headerRobots, 'nofollow'),
        ]);

        $lang = trim($doc->documentElement?->getAttribute('lang') ?? '');
        $this->add('lang', 'meta', Check::IMPORTANT, '' === $lang ? Check::FAIL : (preg_match('/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/i', $lang) ? Check::PASS : Check::WARN), ['value' => '' === $lang ? null : $lang]);

        $viewport = strtolower(self::attr($doc->querySelector('meta[name="viewport" i]'), 'content'));
        $blocksZoom = str_contains(str_replace(' ', '', $viewport), 'user-scalable=no') || (preg_match('/maximum-scale\s*=\s*([\d.]+)/', $viewport, $m) && (float) $m[1] < 2);
        $this->add('viewport', 'meta', Check::IMPORTANT, '' === $viewport ? Check::FAIL : (!str_contains($viewport, 'width=device-width') || $blocksZoom ? Check::WARN : Check::PASS), [
            'value' => '' === $viewport ? null : $viewport,
            'blocksZoom' => $blocksZoom,
        ]);
    }

    // ---------------------------------------------------------------- Contenu

    private function content(HTMLDocument $doc, HttpResponse $page): void
    {
        $headings = [];
        foreach ($doc->querySelectorAll('h1, h2, h3, h4, h5, h6') as $h) {
            $headings[] = ['level' => (int) substr(strtolower($h->localName), 1), 'text' => self::cut(self::text($h), 120)];
        }
        $h1 = \count(array_filter($headings, static fn(array $h): bool => 1 === $h['level']));
        $this->add('h1', 'content', Check::IMPORTANT, 1 === $h1 ? Check::PASS : (0 === $h1 ? Check::FAIL : Check::WARN), ['count' => $h1]);

        $skips = [];
        $previous = 0;
        foreach ($headings as $h) {
            if ($h['level'] > $previous + 1) {
                $skips[] = ['from' => $previous, 'to' => $h['level'], 'text' => $h['text']];
            }
            $previous = $h['level'];
        }
        $this->add('headings_order', 'content', Check::MINOR, [] === $headings ? Check::FAIL : ([] === $skips ? Check::PASS : Check::WARN), [
            'outline' => \array_slice($headings, 0, 40),
            'total' => \count($headings),
            'skips' => \array_slice($skips, 0, 10),
        ]);

        $text = self::visibleText($doc);
        $words = preg_match_all('/[\p{L}\p{N}][\p{L}\p{N}\'’-]*/u', $text);
        $words = false === $words ? 0 : $words;
        $this->add('word_count', 'content', Check::IMPORTANT, $words >= 300 ? Check::PASS : ($words >= 100 ? Check::WARN : Check::FAIL), ['words' => $words]);

        $ratio = '' === $page->body ? 0.0 : round(100 * \strlen($text) / \strlen($page->body), 1);
        $this->add('text_ratio', 'content', Check::MINOR, $ratio >= 10 ? Check::PASS : Check::WARN, ['percent' => $ratio, 'textBytes' => \strlen($text), 'htmlBytes' => \strlen($page->body)]);
    }

    private function images(HTMLDocument $doc): void
    {
        $images = $doc->querySelectorAll('img');
        $missing = [];
        $empty = 0;
        foreach ($images as $img) {
            if (!$img->hasAttribute('alt')) {
                $missing[] = self::cut($img->getAttribute('src') ?? '', 200);
            } elseif ('' === trim($img->getAttribute('alt') ?? '')) {
                ++$empty; // alt="" : image décorative, correct
            }
        }
        $this->add('images_alt', 'content', Check::IMPORTANT, [] === $missing ? Check::PASS : Check::FAIL, [
            'total' => \count($images),
            'missing' => \count($missing),
            'decorative' => $empty,
            'examples' => \array_slice($missing, 0, 5),
        ]);
    }

    // ---------------------------------------------------------------- Liens

    /** @return array{internal: list<Url>, external: list<Url>, nofollow: int} */
    private function links(HTMLDocument $doc, Url $base): array
    {
        $internal = [];
        $external = [];
        $nofollow = 0;
        foreach ($doc->querySelectorAll('a[href]') as $a) {
            $url = $base->resolve($a->getAttribute('href') ?? '');
            if (null === $url) {
                continue; // mailto:, tel:, javascript:… ou lien invalide
            }
            if (str_contains(strtolower($a->getAttribute('rel') ?? ''), 'nofollow')) {
                ++$nofollow;
            }
            $key = $url->toString();
            if ($key === $base->toString()) {
                continue;
            }
            if ($url->sameSite($base)) {
                $internal[$key] = $url;
            } else {
                $external[$key] = $url;
            }
        }

        return ['internal' => array_values($internal), 'external' => array_values($external), 'nofollow' => $nofollow];
    }

    /**
     * @param array{internal: list<Url>, external: list<Url>, nofollow: int} $links
     * @param list<Url>                                                        $sample
     * @param array<string, HttpResponse|FetchError>                           $fetched
     */
    private function linkChecks(array $links, array $sample, array $fetched): void
    {
        $this->add('links', 'links', Check::MINOR, Check::INFO, [
            'internal' => \count($links['internal']),
            'external' => \count($links['external']),
            'nofollow' => $links['nofollow'],
        ]);
        $broken = [];
        $unverified = [];
        $checked = 0;
        foreach ($sample as $i => $url) {
            $result = $fetched['link' . $i] ?? null;
            if (null === $result) {
                continue;
            }
            ++$checked;
            if ($result instanceof FetchError) {
                if (FetchError::BLOCKED !== $result->reason) { // un lien vers une adresse privée n'est pas « cassé » pour le visiteur
                    $broken[] = ['url' => $url->toString(), 'status' => null, 'error' => $result->reason];
                }
            } elseif (\in_array($result->status, self::BOT_WALL, true)) {
                $unverified[] = ['url' => $url->toString(), 'status' => $result->status];
            } elseif ($result->status >= 400) {
                $broken[] = ['url' => $url->toString(), 'status' => $result->status, 'error' => null];
            }
        }
        $this->add('broken_links', 'links', Check::IMPORTANT, 0 === $checked ? Check::INFO : ([] === $broken ? Check::PASS : Check::FAIL), [
            'checked' => $checked,
            'broken' => $broken,
            'unverified' => $unverified,
        ]);
    }

    // ---------------------------------------------------------------- Partage et données structurées

    private function social(HTMLDocument $doc): void
    {
        $og = [];
        foreach (['og:title', 'og:description', 'og:image', 'og:url', 'og:type'] as $property) {
            $og[$property] = self::cut(trim(self::attr($doc->querySelector('meta[property="' . $property . '" i]'), 'content')), 300) ?: null;
        }
        $essential = array_filter([$og['og:title'], $og['og:description'], $og['og:image'], $og['og:url']]);
        $this->add('open_graph', 'social', Check::IMPORTANT, 4 === \count($essential) ? Check::PASS : ([] === $essential ? Check::FAIL : Check::WARN), ['tags' => $og]);

        $card = trim(self::attr($doc->querySelector('meta[name="twitter:card" i]'), 'content'));
        $this->add('twitter_card', 'social', Check::MINOR, '' === $card ? Check::WARN : Check::PASS, [
            'card' => '' === $card ? null : self::cut($card, 50),
            'image' => '' !== trim(self::attr($doc->querySelector('meta[name="twitter:image" i]'), 'content')) || null !== $og['og:image'],
        ]);
    }

    private function structuredData(HTMLDocument $doc): void
    {
        $types = [];
        $invalid = 0;
        $blocks = $doc->querySelectorAll('script[type="application/ld+json" i]');
        foreach ($blocks as $script) {
            $data = json_decode($script->textContent ?? '', true, 64);
            if (!\is_array($data)) {
                ++$invalid;
                continue;
            }
            array_push($types, ...self::schemaTypes($data));
        }
        $types = array_values(array_unique($types));
        $this->add('structured_data', 'social', Check::IMPORTANT, 0 === \count($blocks) ? Check::WARN : (0 === $invalid ? Check::PASS : Check::FAIL), [
            'blocks' => \count($blocks),
            'invalid' => $invalid,
            'types' => \array_slice($types, 0, 20),
            'microdata' => \count($doc->querySelectorAll('[itemscope]')) > 0,
        ]);
    }

    /**
     * @param array<array-key, mixed> $data
     *
     * @return list<string>
     */
    private static function schemaTypes(array $data, int $depth = 0): array
    {
        if ($depth > 6) {
            return [];
        }
        $types = [];
        $type = $data['@type'] ?? null;
        if (\is_string($type)) {
            $types[] = $type;
        } elseif (\is_array($type)) {
            $types = [...$types, ...array_values(array_filter($type, \is_string(...)))];
        }
        foreach ($data as $value) {
            if (\is_array($value)) {
                $types = [...$types, ...self::schemaTypes($value, $depth + 1)];
            }
        }

        return $types;
    }

    private function declaredIcon(HTMLDocument $doc, Url $base): ?string
    {
        $href = trim(self::attr($doc->querySelector('link[rel~="icon" i]'), 'href'));

        return '' === $href ? null : ($base->resolve($href)?->toString() ?? $href);
    }

    private function favicon(?string $declared, HttpResponse|FetchError|null $fallback): void
    {
        $found = null !== $declared || ($fallback instanceof HttpResponse && 200 === $fallback->status && '' !== $fallback->body);
        $this->add('favicon', 'social', Check::MINOR, $found ? Check::PASS : Check::WARN, [
            'declared' => $declared,
            'defaultIco' => $fallback instanceof HttpResponse ? 200 === $fallback->status : null,
        ]);
    }

    // ---------------------------------------------------------------- robots.txt

    private function robots(HttpResponse|FetchError|null $result, Url $page): void
    {
        if (!$result instanceof HttpResponse || 404 === $result->status || 410 === $result->status) {
            $this->add('robots_txt', 'crawl', Check::IMPORTANT, Check::WARN, ['found' => false, 'status' => $result instanceof HttpResponse ? $result->status : null]);

            return;
        }
        if (200 !== $result->status) {
            $this->add('robots_txt', 'crawl', Check::IMPORTANT, Check::FAIL, ['found' => false, 'status' => $result->status]);

            return;
        }
        $robots = RobotsTxt::parse($result->body);
        $pageAllowed = $robots->allows($page->path);
        $blocksAll = $robots->blocksEverything();
        $this->add('robots_txt', 'crawl', Check::IMPORTANT, $blocksAll || !$pageAllowed ? Check::FAIL : ([] === $robots->sitemaps ? Check::WARN : Check::PASS), [
            'found' => true,
            'status' => 200,
            'groups' => \count($robots->groups),
            'sitemaps' => \array_slice($robots->sitemaps, 0, 10),
            'pageAllowed' => $pageAllowed,
            'blocksEverything' => $blocksAll,
            'unknown' => $robots->unknown,
        ]);
    }

    // ---------------------------------------------------------------- En-têtes de sécurité

    private function security(HttpResponse $page): void
    {
        $csp = $page->header('content-security-policy');
        $cspLower = strtolower($csp ?? '');
        $this->add('csp', 'security', Check::IMPORTANT, null === $csp ? Check::FAIL : (str_contains($cspLower, "'unsafe-inline'") && !str_contains($cspLower, 'nonce-') && !str_contains($cspLower, 'sha256-') ? Check::WARN : Check::PASS), [
            'value' => null === $csp ? null : self::cut($csp, 600),
            'unsafeInline' => str_contains($cspLower, "'unsafe-inline'"),
            'unsafeEval' => str_contains($cspLower, "'unsafe-eval'"),
            'reportOnly' => null !== $page->header('content-security-policy-report-only'),
        ]);

        $xfo = $page->header('x-frame-options');
        $frameAncestors = str_contains($cspLower, 'frame-ancestors');
        $this->add('x_frame_options', 'security', Check::IMPORTANT, null !== $xfo || $frameAncestors ? Check::PASS : Check::FAIL, ['value' => $xfo, 'frameAncestors' => $frameAncestors]);

        $xcto = $page->header('x-content-type-options');
        $this->add('x_content_type_options', 'security', Check::IMPORTANT, 'nosniff' === strtolower(trim($xcto ?? '')) ? Check::PASS : Check::FAIL, ['value' => $xcto]);

        $referrer = $page->header('referrer-policy');
        $this->add('referrer_policy', 'security', Check::MINOR, null === $referrer ? Check::FAIL : (str_contains(strtolower($referrer), 'unsafe-url') ? Check::WARN : Check::PASS), ['value' => $referrer]);

        $permissions = $page->header('permissions-policy');
        $this->add('permissions_policy', 'security', Check::MINOR, null === $permissions ? Check::FAIL : Check::PASS, ['value' => null === $permissions ? null : self::cut($permissions, 300)]);
    }

    // ---------------------------------------------------------------- Accessibilité de base

    private function accessibility(HTMLDocument $doc): void
    {
        $unlabeled = [];
        $total = 0;
        $controls = $doc->querySelectorAll('input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]):not([type="image" i]), select, textarea');
        foreach ($controls as $control) {
            ++$total;
            if (!self::hasLabel($doc, $control)) {
                $unlabeled[] = strtolower($control->localName) . ('input' === strtolower($control->localName) ? '[type=' . ($control->getAttribute('type') ?? 'text') . ']' : '') . (($name = $control->getAttribute('name')) ? '[name=' . self::cut($name, 40) . ']' : '');
            }
        }
        $this->add('a11y_labels', 'accessibility', Check::IMPORTANT, 0 === $total ? Check::INFO : ([] === $unlabeled ? Check::PASS : Check::FAIL), [
            'total' => $total,
            'unlabeled' => \count($unlabeled),
            'examples' => \array_slice($unlabeled, 0, 5),
        ]);

        $landmarks = [
            'main' => \count($doc->querySelectorAll('main, [role="main" i]')),
            'nav' => \count($doc->querySelectorAll('nav, [role="navigation" i]')),
            'header' => \count($doc->querySelectorAll('body > header, [role="banner" i]')),
            'footer' => \count($doc->querySelectorAll('body > footer, [role="contentinfo" i]')),
        ];
        $this->add('a11y_landmarks', 'accessibility', Check::IMPORTANT, 1 !== $landmarks['main'] ? Check::FAIL : (0 === $landmarks['nav'] ? Check::WARN : Check::PASS), $landmarks);

        $skipLink = null !== $doc->querySelector('a[href^="#"]');
        $this->add('a11y_skip_link', 'accessibility', Check::MINOR, $skipLink ? Check::PASS : Check::WARN, ['found' => $skipLink]);
    }

    private static function hasLabel(HTMLDocument $doc, Element $control): bool
    {
        foreach (['aria-label', 'aria-labelledby', 'title'] as $attribute) {
            if ('' !== trim($control->getAttribute($attribute) ?? '')) {
                return true;
            }
        }
        $id = $control->getAttribute('id') ?? '';
        if ('' !== $id) {
            foreach ($doc->querySelectorAll('label[for]') as $label) {
                if ($label->getAttribute('for') === $id) {
                    return true;
                }
            }
        }

        return null !== $control->closest('label');
    }

    // ---------------------------------------------------------------- Score

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

    /** @return array<string, int> nombre de contrôles en échec ou à surveiller, par gravité */
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

    // ---------------------------------------------------------------- Outils

    /** @param array<string, mixed> $data */
    private function add(string $id, string $category, string $severity, string $status, array $data = []): void
    {
        $this->checks[] = new Check($id, $category, $severity, $status, $data);
    }

    private static function parse(HttpResponse $page): HTMLDocument
    {
        $charset = preg_match('/charset\s*=\s*"?([\w-]+)/i', $page->header('content-type') ?? '', $m) ? $m[1] : null;
        try {
            return HTMLDocument::createFromString($page->body, LIBXML_NOERROR, $charset);
        } catch (\ValueError) {
            return HTMLDocument::createFromString($page->body, LIBXML_NOERROR);
        }
    }

    private static function visibleText(HTMLDocument $doc): string
    {
        if (null === $doc->body) {
            return '';
        }
        $xpath = new XPath($doc);
        $xpath->registerNamespace('h', self::XHTML);
        $parts = [];
        foreach ($xpath->query('//h:body//text()[not(ancestor::h:script or ancestor::h:style or ancestor::h:noscript or ancestor::h:template or ancestor::h:svg)]') as $node) {
            $value = trim($node->textContent ?? '');
            if ('' !== $value) {
                $parts[] = $value;
            }
        }

        return implode(' ', $parts);
    }

    private static function at(Url $base, string $path): ?Url
    {
        return Url::parse($base->origin() . $path);
    }

    private static function attr(?Element $element, string $name): string
    {
        return $element?->getAttribute($name) ?? '';
    }

    private static function text(?Element $element): string
    {
        return null === $element ? '' : trim(preg_replace('/\s+/u', ' ', $element->textContent ?? '') ?? '');
    }

    private static function cut(string $value, int $max): string
    {
        return mb_strlen($value) > $max ? mb_substr($value, 0, $max - 1) . '…' : $value;
    }
}

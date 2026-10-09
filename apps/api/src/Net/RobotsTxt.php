<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/**
 * Lecture d'un robots.txt selon la RFC 9309 (celle que suit Google) : groupes par User-agent, règles Allow/Disallow,
 * jokers « * » et « $ », règle la plus longue gagnante (Allow l'emporte à égalité), lignes Sitemap.
 */
final readonly class RobotsTxt
{
    /**
     * @param list<array{agents: list<string>, rules: list<array{allow: bool, path: string}>}> $groups
     * @param list<string>                                                                       $sitemaps
     * @param list<string>                                                                       $unknown  directives non reconnues (Crawl-delay, Host…)
     */
    private function __construct(
        public array $groups,
        public array $sitemaps,
        public array $unknown,
    ) {}

    public static function parse(string $content): self
    {
        $groups = [];
        $sitemaps = [];
        $unknown = [];
        /** @var list<string> $agents */
        $agents = [];
        /** @var list<array{allow: bool, path: string}> $rules */
        $rules = [];
        $lastWasAgent = false;
        // 500 Kio au plus sont pris en compte (limite de Google)
        foreach (preg_split('/\r\n|\r|\n/', substr($content, 0, 512_000)) ?: [] as $line) {
            $line = trim(preg_replace('/#.*$/', '', $line) ?? '');
            if ('' === $line || !str_contains($line, ':')) {
                continue;
            }
            [$field, $value] = explode(':', $line, 2);
            $field = strtolower(trim($field));
            $value = trim($value);
            switch ($field) {
                case 'user-agent':
                    // un User-agent qui suit des règles ouvre un nouveau groupe
                    if (!$lastWasAgent && [] !== $agents) {
                        $groups[] = ['agents' => $agents, 'rules' => $rules];
                        $agents = [];
                        $rules = [];
                    }
                    $agents[] = strtolower($value);
                    $lastWasAgent = true;
                    break;
                case 'allow':
                case 'disallow':
                    $lastWasAgent = false;
                    if ([] !== $agents && '' !== $value) {
                        $rules[] = ['allow' => 'allow' === $field, 'path' => $value];
                    }
                    break;
                case 'sitemap':
                    $sitemaps[] = $value;
                    break;
                default:
                    $lastWasAgent = false;
                    $unknown[] = $field;
            }
        }

        if ([] !== $agents) {
            $groups[] = ['agents' => $agents, 'rules' => $rules];
        }

        return new self($groups, array_values(array_unique($sitemaps)), array_values(array_unique($unknown)));
    }

    /** Vrai si le robot peut explorer ce chemin (« /page?x=1 »). */
    public function allows(string $path, string $agent = 'googlebot'): bool
    {
        $rules = $this->rulesFor(strtolower($agent));
        $best = null;
        foreach ($rules as $rule) {
            if (!self::matches($rule['path'], $path)) {
                continue;
            }
            $length = \strlen($rule['path']);
            if (null === $best || $length > $best['length'] || ($length === $best['length'] && $rule['allow'])) {
                $best = ['length' => $length, 'allow' => $rule['allow']];
            }
        }

        return null === $best || $best['allow'];
    }

    /** Vrai si tout le site est interdit à ce robot (« Disallow: / » sans exception). */
    public function blocksEverything(string $agent = 'googlebot'): bool
    {
        return !$this->allows('/', $agent) && !$this->allows('/index.html', $agent);
    }

    /** @return list<array{allow: bool, path: string}> règles du groupe le plus spécifique ; à défaut, celles de « * » */
    private function rulesFor(string $agent): array
    {
        $specific = [];
        $generic = [];
        foreach ($this->groups as $group) {
            foreach ($group['agents'] as $name) {
                if ('*' === $name) {
                    $generic = [...$generic, ...$group['rules']];
                } elseif ('' !== $name && str_starts_with($agent, $name)) {
                    $specific = [...$specific, ...$group['rules']];
                }
            }
        }

        return [] !== $specific ? $specific : $generic;
    }

    private static function matches(string $pattern, string $path): bool
    {
        $anchored = str_ends_with($pattern, '$');
        $pattern = $anchored ? substr($pattern, 0, -1) : $pattern;
        $regex = '#^' . str_replace('\*', '.*', preg_quote($pattern, '#')) . ($anchored ? '$' : '') . '#';

        return 1 === preg_match($regex, $path);
    }
}

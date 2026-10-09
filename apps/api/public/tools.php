<?php

declare(strict_types=1);

// Point d'entrée des outils serveur (rapport SEO, vérificateur de sitemap), déployé à la racine web : https://grichard.eu/tools.php
// Tout le code vit hors de la racine web : app/api/ (classes et vendor/) et private/ (configuration, quotas, journaux).
// Aucune URL analysée n'est conservée : ni journal, ni fichier, ni base.

use Grichard\Api\Contact\CloudflareTurnstileVerifier;
use Grichard\Api\Contact\ContactConfig;
use Grichard\Api\Contact\FileRateLimiter;
use Grichard\Api\Contact\StreamHttpClient;
use Grichard\Api\Http\Request;
use Grichard\Api\Net\CurlTransport;
use Grichard\Api\Net\DnsResolver;
use Grichard\Api\Net\SafeHttpClient;
use Grichard\Api\Net\Url;
use Grichard\Api\Seo\SeoAnalyzer;
use Grichard\Api\Sitemap\SitemapChecker;
use Grichard\Api\Tools\ToolGuard;
use Grichard\Api\Tools\ToolsHandler;

ini_set('display_errors', '0');
// Analyse bornée à ~25 s par le budget du client ; marge pour l'hébergeur (sans effet si set_time_limit est interdit).
@set_time_limit(45);

// Même recherche que contact.php : app/api/vendor/ et private/ sont au-dessus de www/ (développement : apps/api/vendor/).
$home = dirname(__DIR__);
$autoload = $home . '/vendor/autoload.php';
for ($dir = __DIR__, $i = 0; $i < 4; ++$i, $dir = dirname($dir)) {
    if (is_file($dir . '/app/api/vendor/autoload.php')) {
        $home = $dir;
        $autoload = $dir . '/app/api/vendor/autoload.php';
        break;
    }
}
require $autoload;

$privateDir = is_dir($home . '/private') ? $home . '/private' : sys_get_temp_dir();
ini_set('log_errors', '1');
ini_set('error_log', $privateDir . '/php-errors.log');

$file = $privateDir . '/config.php';
$loaded = is_file($file) ? require $file : [];
$config = ContactConfig::fromArray(is_array($loaded) ? $loaded : [], $privateDir);
$env = getenv('TURNSTILE_SECRET');
$secret = is_string($env) && '' !== $env ? $env : $config->turnstileSecret;

$guard = static fn(string $tool, int $perHour, int $perIpPerHour): ToolGuard => new ToolGuard(
    allowedHosts: $config->allowedHosts,
    turnstileSecret: $secret,
    turnstile: new CloudflareTurnstileVerifier($secret, $config->allowedHosts, new StreamHttpClient()),
    limiter: new FileRateLimiter(
        file: $config->stateDir . '/tools-' . $tool . '-rate.json',
        maxPerHour: $perHour,
        maxPerIpPerHour: $perIpPerHour,
        salt: hash('sha256', $config->stateDir . '|tools'),
        clock: static fn(): int => time(),
    ),
);
$client = static fn(float $budget): SafeHttpClient => new SafeHttpClient(new CurlTransport(), new DnsResolver(), $budget);

$handler = new ToolsHandler(
    // quotas par heure : global, puis par visiteur (le sitemap déclenche jusqu'à ~30 requêtes, il est plus limité)
    guards: ['seo' => $guard('seo', 150, 12), 'sitemap' => $guard('sitemap', 80, 6)],
    tools: [
        'seo' => static fn(Url $url): array => new SeoAnalyzer($client(22.0))->analyze($url),
        'sitemap' => static fn(Url $url): array => new SitemapChecker($client(25.0))->check($url),
    ],
);

$handler->handle(Request::fromGlobals(), static function (string $message): void {
    error_log($message);
})->send();

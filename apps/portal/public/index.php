<?php

declare(strict_types=1);

// Contrôleur frontal de l'espace client.
// Hébergement : www/espace/index.php ; le code est dans app/portal/ et la configuration dans private/portal.php (voisins de www/).
// Développement : apps/portal/public/index.php, avec APP_ENV, APP_SECRET et PORTAL_DB dans l'environnement.

use Grichard\Portal\Kernel;
use Symfony\Component\HttpFoundation\Request;

ini_set('display_errors', '0');

$home = dirname(__DIR__, 2);
$hosted = null;
foreach ([$home, dirname($home)] as $candidate) { // le dossier personnel est au-dessus de www/ (ou, à défaut, dans www/)
    if (is_file($candidate . '/app/portal/vendor/autoload.php')) {
        $hosted = $candidate;
        break;
    }
}
$project = null !== $hosted ? $hosted . '/app/portal' : dirname(__DIR__);
require $project . '/vendor/autoload.php';

if (null !== $hosted) {
    /** @var array<string, mixed> $settings */
    $settings = is_file($hosted . '/private/portal.php') ? (array) require $hosted . '/private/portal.php' : [];
    $env = [
        'APP_ENV' => 'prod',
        'APP_DEBUG' => '0',
        'APP_SECRET' => $settings['app_secret'] ?? '',
        'PORTAL_DB' => $hosted . '/private/portal.sqlite',
        'PORTAL_VAR_DIR' => $hosted . '/private/portal',
        'PORTAL_SETUP_TOKEN' => $settings['setup_token'] ?? '',
        'PORTAL_TRUSTED_PROXIES' => $settings['trusted_proxies'] ?? '',
    ];
    foreach ($env as $name => $value) {
        $_SERVER[$name] = $_ENV[$name] = is_string($value) ? $value : '';
    }
    ini_set('log_errors', '1');
    ini_set('error_log', $hosted . '/private/portal-php-errors.log');
}

// Derrière le proxy de l'hébergeur, HTTPS est signalé par un en-tête : sans cela le cookie de session ne serait pas « Secure ».
if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
    $_SERVER['HTTPS'] = 'on';
}

$kernel = new Kernel((string) ($_SERVER['APP_ENV'] ?? 'prod'), '1' === ($_SERVER['APP_DEBUG'] ?? '0'));
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);

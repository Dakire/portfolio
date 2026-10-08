<?php

declare(strict_types=1);

// Point d'entrée du formulaire de contact (déployé à la racine web : https://grichard.eu/contact.php).
// Tout le code vit hors de la racine web : app/api/ (classes et vendor/) et private/ (configuration, état, journaux).

use Grichard\Api\Contact\CloudflareTurnstileVerifier;
use Grichard\Api\Contact\ContactConfig;
use Grichard\Api\Contact\ContactHandler;
use Grichard\Api\Contact\FileRateLimiter;
use Grichard\Api\Contact\PhpMailer;
use Grichard\Api\Contact\StreamHttpClient;
use Grichard\Api\Http\Request;

// Jamais d'erreurs PHP dans la réponse : elles pourraient révéler des chemins du serveur.
ini_set('display_errors', '0');

// Hébergement : www/contact.php, app/api/vendor/ et private/ sont voisins. En développement : apps/api/public/ et apps/api/vendor/.
$home = dirname(__DIR__);
$autoload = is_file($home . '/app/api/vendor/autoload.php') ? $home . '/app/api/vendor/autoload.php' : $home . '/vendor/autoload.php';
require $autoload;

$privateDir = is_dir($home . '/private') ? $home . '/private' : sys_get_temp_dir();
ini_set('log_errors', '1');
ini_set('error_log', $privateDir . '/php-errors.log');

/** @return array<array-key, mixed> */
$loadConfig = static function () use ($home, $privateDir): array {
    foreach ([$privateDir . '/config.php', $home . '/contact.config.php'] as $file) {
        if (is_file($file)) {
            $config = require $file;

            return is_array($config) ? $config : [];
        }
    }

    return [];
};

$config = ContactConfig::fromArray($loadConfig(), $privateDir);
$env = getenv('TURNSTILE_SECRET');
if (is_string($env) && '' !== $env) {
    $config = new ContactConfig($env, $config->stateDir, $config->mailTo, $config->mailFrom, $config->allowedHosts, $config->maxPerHour, $config->maxPerIpPerHour);
}

$handler = new ContactHandler(
    turnstileSecret: $config->turnstileSecret,
    allowedHosts: $config->allowedHosts,
    turnstile: new CloudflareTurnstileVerifier($config->turnstileSecret, $config->allowedHosts, new StreamHttpClient()),
    limiter: new FileRateLimiter(
        file: $config->stateDir . '/contact-rate.json',
        maxPerHour: $config->maxPerHour,
        maxPerIpPerHour: $config->maxPerIpPerHour,
        salt: hash('sha256', $config->stateDir),
        clock: static fn(): int => time(),
    ),
    mailer: new PhpMailer($config->mailTo, $config->mailFrom),
);

$handler->handle(Request::fromGlobals(), static function (string $message): void {
    error_log($message);
})->send();

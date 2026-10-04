<?php
declare(strict_types=1);

// Endpoint du formulaire de contact : même origine uniquement (pas d'en-têtes CORS ouverts).
// Jamais d'erreurs PHP dans la réponse (elles pourraient révéler des chemins du serveur).
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const MAIL_TO = 'contact@grichard.eu';
const MAIL_FROM = 'noreply@grichard.eu'; // doit appartenir au domaine (anti-spam OVH)
const ALLOWED_HOSTS = ['grichard.eu', 'www.grichard.eu'];
const MAX_MESSAGES_PER_HOUR = 15; // plafond global : protège la boîte de réception en cas d'abus
const MAX_MESSAGES_PER_IP_PER_HOUR = 3; // plafond par visiteur : un seul client ne peut pas bloquer les autres

function respond(int $code, bool $success, string $message): never
{
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Secret Turnstile : variable d'environnement, sinon contact.config.php.
 * Ce fichier est cherché d'abord AU-DESSUS de la racine web (jamais servi par Apache), puis à côté de ce script.
 */
function turnstileSecret(): string
{
    $env = getenv('TURNSTILE_SECRET');
    if ($env) {
        return $env;
    }
    foreach ([dirname(__DIR__) . '/contact.config.php', __DIR__ . '/contact.config.php'] as $file) {
        if (is_file($file)) {
            $config = require $file;
            return is_array($config) ? (string) ($config['turnstile_secret'] ?? '') : '';
        }
    }
    return '';
}

function verifyTurnstile(string $token, string $secret, string $ip): bool
{
    if ($token === '' || strlen($token) > 2048) {
        return false;
    }
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $ip]),
            'timeout' => 5,
        ],
    ]);
    $raw = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    if ($raw === false) {
        return false;
    }
    $result = json_decode($raw, true);
    if (!is_array($result) || ($result['success'] ?? false) !== true) {
        return false;
    }
    // Le jeton doit avoir été émis pour notre site (et non pour un autre domaine utilisant la même clé).
    $hostname = $result['hostname'] ?? '';
    return $hostname === '' || in_array($hostname, ALLOWED_HOSTS, true);
}

/**
 * Limitation du nombre de messages, globale (protège la boîte de réception) et par adresse IP (un seul visiteur ne peut
 * pas épuiser le plafond global à lui seul). Compteur dans un fichier temporaire : lecture, contrôle et écriture se font
 * sous un seul verrou, donc deux requêtes simultanées ne peuvent pas dépasser la limite.
 * Seule une empreinte salée de l'IP est conservée, au plus une heure (voir mentions légales, section 4).
 */
function rateLimited(string $ip): bool
{
    $file = sys_get_temp_dir() . '/portfolio_contact_' . hash('sha256', __DIR__) . '.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        return false; // panne de stockage : on ne bloque pas un visiteur légitime (Turnstile reste exigé)
    }

    $now = time();
    $stored = json_decode((string) stream_get_contents($handle), true);
    $hits = [];
    foreach (is_array($stored) ? $stored : [] as $hit) {
        if (is_array($hit) && is_int($hit['t'] ?? null) && is_string($hit['ip'] ?? null) && $hit['t'] > $now - 3600) {
            $hits[] = $hit;
        }
    }

    $ipKey = hash('sha256', __DIR__ . '|' . $ip);
    $fromThisIp = count(array_filter($hits, static fn (array $h): bool => $h['ip'] === $ipKey));
    $limited = count($hits) >= MAX_MESSAGES_PER_HOUR || $fromThisIp >= MAX_MESSAGES_PER_IP_PER_HOUR;

    if (!$limited) {
        $hits[] = ['t' => $now, 'ip' => $ipKey];
    }
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($hits));
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Méthode non autorisée.');
}

// Rejette les requêtes cross-site (le front appelle ce script en same-origin).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array(parse_url($origin, PHP_URL_HOST), ALLOWED_HOSTS, true)) {
    respond(403, false, 'Origine non autorisée.');
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$input = json_decode($raw ?: '', true, 4);
if (!is_array($input)) {
    respond(400, false, 'Requête invalide.');
}

// Honeypot : les robots remplissent ce champ caché. On répond "OK" sans rien envoyer.
if (trim((string) ($input['website'] ?? '')) !== '') {
    respond(200, true, 'Message envoyé avec succès.');
}

// Captcha Cloudflare Turnstile (échec fermé si le secret n'est pas configuré).
$secret = turnstileSecret();
if ($secret === '') {
    error_log('contact.php : secret Turnstile manquant (contact.config.php ou TURNSTILE_SECRET).');
    respond(500, false, 'Service momentanément indisponible.');
}
if (!verifyTurnstile((string) ($input['turnstileToken'] ?? ''), $secret, $_SERVER['REMOTE_ADDR'] ?? '')) {
    respond(403, false, 'Vérification anti-robot échouée.');
}

// Validation (le texte reste brut : c'est un e-mail texte, l'échappement HTML n'a pas lieu d'être ici).
// Nom : sans balises ni caractères de contrôle (CR, LF, NUL, séparateurs de ligne Unicode…) pour interdire toute injection d'en-tête.
$name = trim((string) preg_replace('/[\p{Cc}\x{2028}\x{2029}]+/u', ' ', strip_tags((string) ($input['name'] ?? ''))));
$email = trim((string) ($input['email'] ?? ''));
$message = trim((string) ($input['message'] ?? ''));

if (
    $name === '' || mb_strlen($name) > 100
    || $message === '' || mb_strlen($message) > 5000
    || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || preg_match('/[\s"<>,;()\[\]\\\\]/', $email) === 1 // pas de forme exotique (guillemets, commentaires, listes) dans Reply-To
) {
    respond(400, false, 'Données invalides ou manquantes.');
}

if (rateLimited($_SERVER['REMOTE_ADDR'] ?? '')) {
    respond(429, false, 'Trop de messages pour le moment, veuillez réessayer plus tard.');
}

$subject = mb_encode_mimeheader('Nouveau contact Portfolio : ' . $name, 'UTF-8');
$body = "Nouveau message depuis le portfolio.\n\nNom : $name\nEmail : $email\n\nMessage :\n$message\n";
$headers = implode("\r\n", [
    'From: ' . MAIL_FROM,
    'Reply-To: ' . $email, // validé par FILTER_VALIDATE_EMAIL : pas de CR/LF possible
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

if (mail(MAIL_TO, $subject, $body, $headers)) {
    respond(200, true, 'Message envoyé avec succès.');
}
respond(500, false, "Erreur lors de l'envoi de l'email.");

<?php
declare(strict_types=1);

// Endpoint du formulaire de contact : même origine uniquement (pas d'en-têtes CORS ouverts).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const MAIL_TO = 'contact@grichard.eu';
const MAIL_FROM = 'noreply@grichard.eu'; // doit appartenir au domaine (anti-spam OVH)
const ALLOWED_HOSTS = ['grichard.eu', 'www.grichard.eu'];

function respond(int $code, bool $success, string $message): never
{
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Secret Turnstile : variable d'environnement, ou contact.config.php (hors dépôt Git). */
function turnstileSecret(): string
{
    $env = getenv('TURNSTILE_SECRET');
    if ($env) {
        return $env;
    }
    $file = __DIR__ . '/contact.config.php';
    if (is_file($file)) {
        $config = require $file;
        return (string) ($config['turnstile_secret'] ?? '');
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
    return is_array($result) && ($result['success'] ?? false) === true;
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
$input = json_decode($raw ?: '', true);
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
$name = trim(preg_replace('/[\r\n\t]+/', ' ', strip_tags((string) ($input['name'] ?? ''))));
$email = trim((string) ($input['email'] ?? ''));
$message = trim((string) ($input['message'] ?? ''));

if (
    $name === '' || mb_strlen($name) > 100
    || $message === '' || mb_strlen($message) > 5000
    || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    respond(400, false, 'Données invalides ou manquantes.');
}

$subject = mb_encode_mimeheader('Nouveau contact Portfolio : ' . $name, 'UTF-8');
$body = "Nouveau message depuis le portfolio.\n\nNom : $name\nEmail : $email\n\nMessage :\n$message\n";
$headers = implode("\r\n", [
    'From: ' . MAIL_FROM,
    'Reply-To: ' . $email, // validé par FILTER_VALIDATE_EMAIL : pas de CR/LF possible
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
]);

if (mail(MAIL_TO, $subject, $body, $headers)) {
    respond(200, true, 'Message envoyé avec succès.');
}
respond(500, false, "Erreur lors de l'envoi de l'email.");

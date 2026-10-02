<?php
// On indique qu'on renvoie du JSON (pratique pour React)
header('Content-Type: application/json; charset=utf-8');
// En production, tu pourras limiter le CORS à ton nom de domaine
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Récupération des données envoyées en JSON par React
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Nettoyage des données pour éviter les failles XSS
    $name = strip_tags(trim($input["name"] ?? ''));
    $email = filter_var(trim($input["email"] ?? ''), FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars(trim($input["message"] ?? ''));

    // Vérification basique
    if (empty($name) || empty($email) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Données invalides ou manquantes."]);
        exit;
    }

    // --- CONFIGURATION DE L'EMAIL ---
    $to = "guillaume.rwins@gmail.com"; // Ton adresse de réception
    $subject = "Nouveau contact Portfolio : $name";

    $body = "Tu as reçu un nouveau message depuis ton portfolio.\n\n";
    $body .= "Nom : $name\n";
    $body .= "Email : $email\n\n";
    $body .= "Message :\n$message\n";

    // IMPORTANT OVH : L'adresse 'From' DOIT idéalement être une adresse de ton domaine (ex: contact@grichard.eu)
    // sinon l'antispam d'OVH risque de bloquer l'envoi.
    $headers = "From: noreply@grichard.eu\r\n";
    $headers .= "Reply-To: $email\r\n"; // Permet de faire "Répondre" directement à l'expéditeur
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Envoi de l'email
    if (mail($to, $subject, $body, $headers)) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Message envoyé avec succès."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erreur lors de l'envoi de l'email via le serveur."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée."]);
}
?>

<?php
// Modèle : copiez ce fichier en "contact.config.php" et renseignez la clé SECRÈTE Cloudflare Turnstile.
// Sur le serveur OVH, placez-le AU-DESSUS de la racine web (à côté du dossier www/) :
// contact.php le cherche d'abord là, et Apache ne peut pas le servir.
// Ne le commitez jamais (il est ignoré par Git).
return [
    'turnstile_secret' => 'COLLER_ICI_LA_CLE_SECRETE',
];

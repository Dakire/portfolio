# Licences des produits

Comment un produit vendu sur la boutique ([ADR 0017](adr/0017-boutique-merchant-of-record.md)) vérifie sa licence. Le principe : **le jeton se vérifie hors ligne**, avec la clé publique intégrée au produit ; le site n'est appelé que pour renouveler le jeton ou chercher une mise à jour. Un site lent ou en maintenance ne bloque donc jamais un client.

## Le jeton

```
GRL1.<charge utile base64url>.<signature Ed25519 base64url>
```

La signature porte sur `GRL1.<charge utile>`. La charge utile est un JSON court, **sans donnée personnelle** :

| Champ  | Sens                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| `v`    | version du format (1)                                                                           |
| `kid`  | identifiant de la clé de signature (8 caractères), pour un éventuel changement de clé           |
| `lic`  | clé de licence lisible, `GR-XXXX-XXXX-XXXX-XXXX`                                                |
| `prod` | produit (`youtube-regarder-plus-tard`, `prevenez-moi-rupture`, `standup-slack`)                 |
| `plan` | formule (`pro`, `pro-a-vie`, `licence`, `equipe`…)                                              |
| `iat`  | date d'émission (secondes Unix)                                                                 |
| `exp`  | fin de validité, avec 7 jours de grâce pour un abonnement ; `null` pour une licence perpétuelle |
| `upd`  | fin des mises à jour ; `null` sans limite                                                       |

Le client récupère son jeton dans l'espace client (`/espace/licences`, bouton « Télécharger le jeton de licence », fichier `GR-….lic`) et le colle dans le produit.

## Règles de vérification

1. Format `GRL1.x.y`, version 1, signature Ed25519 valable avec la clé publique.
2. `prod` égal au produit qui vérifie.
3. `exp` nul ou dans le futur.
4. Pour installer une version : `upd` nul ou postérieur à sa date de publication.
5. **À renouveler** (sans bloquer l'usage) quand `exp` approche (moins de 3 jours) ou quand le jeton a plus de 7 jours : c'est ainsi qu'un remboursement ou une résiliation finit par être pris en compte, sans contrôle en ligne à chaque usage.

Ces règles sont codées une fois, et testées contre des jetons signés par le portail :

- **JavaScript** (extensions Chrome, Worker Cloudflare, Node) : [`packages/licence/src/licence.js`](../packages/licence/src/licence.js), sans dépendance (WebCrypto Ed25519 : Chrome 113+, Workers, Node 20+). `verifyLicence(jeton, { publicKey, product })`, `coversUpdate(payload, date)`, `refreshLicence(jeton)`.
- **PHP** (modules PrestaShop) : [`packages/licence/php/GrichardLicence.php`](../packages/licence/php/GrichardLicence.php), un fichier à copier dans le module, compatible PHP 7.2 à 8.x, extension sodium (ou `paragonie/sodium_compat` si l'hébergeur l'a désactivée).

## API (sans session, limitée à 120 appels par heure et par IP)

Base : `https://grichard.eu/espace/api`. Le jeton s'envoie dans l'en-tête `Authorization: Licence <jeton>`.

| Appel                                       | Réponse                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /licence/cle-publique`                 | `{ alg: "Ed25519", kid, key }` : la clé à intégrer dans le produit                                                                                   |
| `POST /licence/renouveler`                  | `{ statut, jeton }` ; 401 jeton invalide ; 410 licence expirée ou révoquée (le produit doit alors cesser de fonctionner en mode payant)              |
| `GET /mises-a-jour/<produit>`               | `{ version, couverte: true, publiee, taille, telechargement }` (lien signé valable une heure) ; 402 si la version n'est plus couverte par la licence |
| `GET /telechargement/<produit>/<version>?…` | le fichier, si la signature et l'échéance du lien sont valables                                                                                      |

## Intégration par produit

**Extension Chrome (Manifest V3).** Clé publique dans le code. Le jeton est collé dans la page d'options et rangé dans `chrome.storage.sync`. Au démarrage du service worker : `verifyLicence` ; si `valid`, fonctions payantes actives. Si `needsRefresh`, `refreshLicence` en arrière-plan : nouveau jeton enregistré, `null` (licence morte) jeton effacé, erreur réseau ancien jeton conservé. Permission d'hôte limitée à `https://grichard.eu/espace/api/*`.

**Module PrestaShop.** `GrichardLicence.php` dans `classes/`, clé publique en constante du module, jeton dans `Configuration`. Vérification à l'ouverture de la page de configuration du module et, une fois par jour au plus (horodatage en `Configuration`), appel de `/mises-a-jour/<produit>` pour proposer une nouvelle version. Le module continue de fonctionner quand les mises à jour ont expiré : seule l'installation des nouvelles versions est réservée.

**Bot Slack (Worker Cloudflare).** Le jeton de l'espace de travail est rangé dans D1 (colonne de l'espace). À chaque envoi programmé : `verifyLicence` (même bibliothèque JavaScript) ; au-delà de 5 membres sans jeton valable, le bot rappelle l'offre au lieu d'envoyer. Renouvellement par `refreshLicence` depuis le cron du Worker. La facturation passe par Paddle, plus par Stripe en direct (ADR 0017).

## Publier une version

Déposer par FTP `private/portal/downloads/<produit>/<produit>-<version>.zip` (version au format `1.2.3`). La date du fichier fait foi pour les mises à jour couvertes : ne pas réécrire un ancien fichier.

## Clé de signature

Générée une fois, gardée dans `private/portal.php` (`licence_key`, base64 de 64 octets) et dans le gestionnaire de mots de passe :

```
php -r "require 'vendor/autoload.php'; echo base64_encode(sodium_crypto_sign_secretkey(sodium_crypto_sign_keypair())), PHP_EOL;"
```

Elle ne doit jamais changer sans plan : tous les produits livrés vérifient avec la clé publique qui lui correspond (`kid` prévu pour une rotation). La clé des tests (`phpunit.xml.dist`) est publique et ne doit jamais servir en production.

#!/usr/bin/env bash
# Transfert FTP/FTPS de la livraison (dossier release/, voir assemble.mjs) vers l'hébergement OVH.
#
#   scripts/deploy/deploy.sh <production|preprod|portal> [dossier-livraison]
#
# Variables : FTP_HOST, FTP_USER, FTP_PASSWORD (obligatoires, jamais affichées)
#             FTP_PROTOCOL=ftp|sftp    (défaut ftp ; sftp : FTP_PORT=22, clé de l'hôte déjà dans ~/.ssh/known_hosts)
#             FTP_TLS=true|false        (défaut true : FTPS explicite, certificat vérifié)
#             FTP_VERIFY_CERT=true|false (défaut true)
#             FTP_APP_PREFIX=www/       (repli : app/ et private/ placés dans www/ ; vide par défaut)
#             DRY_RUN=true|false        (défaut true : rien n'est écrit sur le serveur, lftp ne fait que simuler)
#
# Ordre (un visiteur ne doit jamais voir une page qui référence un fichier pas encore transféré) :
#   1. le code de l'API (app/…) ; 2. les ressources versionnées (_astro/, js/, images, PDF…) ; 3. les pages ;
#   4. le .htaccess en dernier (il active la nouvelle CSP) ; 5. suppression des fichiers qui n'existent plus.
# Jamais touchés : private/ (secrets, état), www/espace/ (portail), et en production www/preprod/.
set -euo pipefail

target="${1:?cible manquante : production ou preprod}"
release="${2:-release}"
dry_run="${DRY_RUN:-true}"

case "$target" in
  production)
    web_local="$release/www"
    web_remote="www"
    code_local="$release/app/api"
    code_remote="app/api"
    # En production, la suppression ne doit jamais atteindre la préproduction, le portail ni ce que l'hébergeur crée (cgi-bin/).
    keep=(-x '^preprod/' -x '^espace/' -x '^cgi-bin/')
    ;;
  preprod)
    web_local="$release/www/preprod"
    web_remote="www/preprod"
    code_local="$release/app/preprod/api"
    code_remote="app/preprod/api"
    keep=()
    ;;
  portal)
    # Espace client : code dans app/portal/, point d'entrée dans www/espace/. Les données (private/) ne sont jamais concernées.
    web_local="$release/www/espace"
    web_remote="www/espace"
    code_local="$release/app/portal"
    code_remote="app/portal"
    keep=()
    ;;
  *)
    echo "cible inconnue : $target (production, preprod ou portal)" >&2
    exit 2
    ;;
esac

for dir in "$web_local" "$code_local"; do
  [ -d "$dir" ] || { echo "dossier de livraison introuvable : $dir" >&2; exit 2; }
done
[ -f "$web_local/.htaccess" ] || { echo "$web_local/.htaccess manquant" >&2; exit 2; }
for var in FTP_HOST FTP_USER FTP_PASSWORD; do
  [ -n "${!var:-}" ] || { echo "variable $var absente" >&2; exit 2; }
done
if [ -e "$release/private" ] || [ -e "$release/www/private" ]; then
  echo "private/ ne doit jamais être livré" >&2
  exit 2
fi

# Disposition de repli : si app/ et private/ doivent vivre DANS www/, FTP_APP_PREFIX=www/ (voir docs/deploiement.md).
app_prefix="${FTP_APP_PREFIX:-}"
code_remote="${app_prefix}${code_remote}"
if [ -n "$app_prefix" ] && [ "$target" = "production" ]; then
  keep+=(-x "^app/" -x "^private/") # ils sont dans www/ : la suppression finale ne doit jamais les atteindre
fi

proto="${FTP_PROTOCOL:-sftp}" # ftp (FTPS) ou sftp
auto_confirm="${FTP_SFTP_AUTO_CONFIRM:-false}"
tls="${FTP_TLS:-true}"
verify="${FTP_VERIFY_CERT:-true}"
sim=()
[ "$dry_run" = "true" ] && sim=(--dry-run)
echo "Cible : $target · TLS : $tls · simulation : $dry_run"

# lftp lit le mot de passe dans cette variable quand -u ne le donne pas.
export LFTP_PASSWORD="$FTP_PASSWORD"

script="$(mktemp)"
trap 'rm -f "$script"' EXIT
chmod 600 "$script"

{
  echo "set cmd:fail-exit yes"
  echo "set net:max-retries 3"
  echo "set net:timeout 30"
  echo "set mirror:parallel-transfer-count 4"
  echo "set mirror:set-permissions no"
  if [ "$proto" = "sftp" ]; then
    echo "set sftp:auto-confirm $auto_confirm" # faux : la clé de l'hôte doit déjà être dans ~/.ssh/known_hosts
    # lftp ne lit LFTP_PASSWORD qu'en FTP : en SFTP, le mot de passe va dans ce fichier temporaire (droits 600, supprimé en fin de script)
    pw="${FTP_PASSWORD//\\/\\\\}"
    pw="${pw//\"/\\\"}"
    echo "open -u \"$FTP_USER,$pw\" \"sftp://$FTP_HOST:${FTP_PORT:-22}\""
  else
    echo "set ftp:list-options -a" # voir les fichiers cachés (.htaccess, .well-known)
    echo "set ftp:ssl-allow $tls"
    echo "set ftp:ssl-force $tls"
    echo "set ftp:ssl-protect-data $tls"
    echo "set ssl:verify-certificate $verify"
    echo "open -u \"$FTP_USER\" \"$FTP_HOST\""
  fi

  # 1. Code de l'API (remplacé en entier : vendor/ doit correspondre au composer.lock livré)
  echo "mirror -R --delete ${sim[*]} \"$code_local\" \"$code_remote\""

  # 2. Ressources (tout sauf les pages et le .htaccess)
  echo "mirror -R ${sim[*]} --exclude-glob .htaccess --exclude-glob '*.html' --exclude-glob '*.xml' --exclude-glob '*.txt' --exclude-glob '*.json' --exclude-glob contact.php ${keep[*]} \"$web_local\" \"$web_remote\""

  # 3. Pages, flux, plans de site et fichiers de données (le dossier complet : ce qui est déjà à jour n'est pas renvoyé ;
  #    exclusions seulement, sans règles d'inclusion, pour que le résultat ne dépende pas de leur ordre)
  echo "mirror -R ${sim[*]} --exclude-glob .htaccess ${keep[*]} \"$web_local\" \"$web_remote\""

  # 4. .htaccess en dernier
  if [ "$dry_run" = "true" ]; then
    echo "echo SIMULATION : put .htaccess"
  else
    echo "put -O \"$web_remote\" \"$web_local/.htaccess\""
  fi

  # 5. Nettoyage : supprime sur le serveur ce qui n'existe plus dans la livraison (n'envoie plus rien : tout est déjà à jour)
  echo "mirror -R --delete --only-missing ${sim[*]} ${keep[*]} \"$web_local\" \"$web_remote\""
  echo "bye"
} >"$script"

lftp -f "$script"
echo "Terminé ($target, simulation : $dry_run)."

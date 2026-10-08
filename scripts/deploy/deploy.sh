#!/usr/bin/env bash
# Transfert FTP/FTPS de la livraison (dossier release/, voir assemble.mjs) vers l'hébergement OVH.
#
#   scripts/deploy/deploy.sh <production|preprod> [dossier-livraison]
#
# Variables : FTP_HOST, FTP_USER, FTP_PASSWORD (obligatoires, jamais affichées)
#             FTP_TLS=true|false        (défaut true : FTPS explicite, certificat vérifié)
#             FTP_VERIFY_CERT=true|false (défaut true)
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
  *)
    echo "cible inconnue : $target (production ou preprod)" >&2
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
  echo "set ftp:list-options -a" # voir les fichiers cachés (.htaccess, .well-known)
  echo "set ftp:ssl-allow $tls"
  echo "set ftp:ssl-force $tls"
  echo "set ftp:ssl-protect-data $tls"
  echo "set ssl:verify-certificate $verify"
  echo "set mirror:parallel-transfer-count 4"
  echo "set mirror:set-permissions no"
  echo "open -u \"$FTP_USER\" \"$FTP_HOST\"" # le mot de passe est lu dans LFTP_PASSWORD : ni dans ce fichier, ni dans la liste des processus

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

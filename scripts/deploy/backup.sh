#!/usr/bin/env bash
# Sauvegarde du site en ligne AVANT un déploiement de production : télécharge www/ et app/api/ par FTP/FTPS dans une archive.
#
#   scripts/deploy/backup.sh <archive.tar.gz>
#
# Variables : FTP_HOST, FTP_USER, FTP_PASSWORD (obligatoires), FTP_TLS, FTP_VERIFY_CERT (comme deploy.sh).
# Exclus, volontairement : private/ (secrets), www/espace/ (portail et sa base SQLite) et www/preprod/.
# L'archive ne contient donc que du contenu public et du code ; elle sert à revenir en arrière à la main si besoin
# (le retour arrière normal est de relancer le déploiement sur la version précédente : voir docs/deploiement.md).
set -euo pipefail

archive="${1:?chemin de l'archive manquant}"
for var in FTP_HOST FTP_USER FTP_PASSWORD; do
  [ -n "${!var:-}" ] || { echo "variable $var absente" >&2; exit 2; }
done

tls="${FTP_TLS:-true}"
verify="${FTP_VERIFY_CERT:-true}"
export LFTP_PASSWORD="$FTP_PASSWORD"

work="$(mktemp -d)"
script="$(mktemp)"
trap 'rm -rf "$work" "$script"' EXIT
chmod 600 "$script"
mkdir -p "$work/www" "$work/app/api"

{
  echo "set cmd:fail-exit yes"
  echo "set net:max-retries 3"
  echo "set net:timeout 30"
  echo "set ftp:list-options -a"
  echo "set ftp:ssl-allow $tls"
  echo "set ftp:ssl-force $tls"
  echo "set ftp:ssl-protect-data $tls"
  echo "set ssl:verify-certificate $verify"
  echo "open -u \"$FTP_USER\" \"$FTP_HOST\""
  echo "mirror -x '^preprod/' -x '^espace/' www \"$work/www\""
  # app/api n'existe pas avant le premier déploiement : ce n'est pas une erreur
  echo "set cmd:fail-exit no"
  echo "mirror app/api \"$work/app/api\""
  echo "bye"
} >"$script"

lftp -f "$script"
tar -czf "$archive" -C "$work" .
echo "Sauvegarde : $archive ($(du -h "$archive" | cut -f1))"

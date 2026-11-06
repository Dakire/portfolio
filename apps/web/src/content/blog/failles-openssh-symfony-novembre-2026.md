---
title: 'OpenSSH et Symfony : les failles de la semaine du 2 novembre 2026'
seoTitle: 'Faille OpenSSH 10.6p2 et correctifs Symfony : que faire'
description: 'Faille OpenSSH (CVE-2026-123158) sur les Linux sans PAM comme Alpine, et correctifs de sécurité Symfony du 4 novembre : qui est concerné, quoi mettre à jour.'
summary: "Deux sujets à traiter cette semaine si vous administrez des serveurs Linux ou des sites PHP. OpenSSH 10.6p2 corrige un contournement de l'authentification par mot de passe sur certains Linux compilés sans PAM, Alpine en tête ; le CERT-FR a publié une alerte. Symfony a publié le 4 novembre une nouvelle série de correctifs de sécurité pour toutes ses versions maintenues."
date: 2026-11-06
category: actualites
tags: ['OpenSSH', 'Symfony', 'Linux', 'Correctifs']
---

_Article rédigé le 6 novembre 2026, à partir de l'alerte du CERT-FR, des notes de version d'OpenSSH, de l'avis d'Alpine Linux et de la base d'avis de sécurité de Packagist. Sources en fin d'article._

## 1. OpenSSH : contournement de l'authentification sur certains Linux

### Ce qui est confirmé

- **La faille** : CVE-2026-123158, corrigée dans **OpenSSH 10.6p2**, publié le 5 novembre 2026. Les notes de version parlent d'un contournement de l'authentification par mot de passe, exploitable via `sshd`, sur certains systèmes Linux **compilés et utilisés sans PAM**. OpenSSH estime que la cause est hors de `sshd`, mais corrige le problème de son côté.
- **L'alerte** : le CERT-FR a publié l'alerte **CERTFR-2026-ALE-015** le 5 novembre. Il vise les systèmes Linux utilisant la bibliothèque C **musl**, compilés sans PAM ou avec PAM désactivé. Il précise que, lorsque les conditions sont réunies, la faille est « triviale à exploiter ». **Aucune exploitation active n'est signalée** à ce jour.
- **Alpine Linux** (qui utilise musl) a publié un avis le 5 novembre : toutes les branches vérifiées, de 3.16 à 3.24 et edge, sont concernées, et des paquets corrigés sont disponibles.

### Êtes-vous concerné ?

Sur Alpine, d'après son avis, il faut **toutes** ces conditions :

- `openssh-server` compilé sans PAM, ou `openssh-server-pam` avec `UsePAM no` ;
- `PasswordAuthentication yes` (la valeur par défaut) ;
- un compte dont le mot de passe vaut `*` dans `/etc/shadow` (c'est le cas de `root` sur les images de base depuis 3.16 environ) ;
- un autre compte local avec un vrai mot de passe (empreinte `$5$` ou `$6$`).

Les distributions courantes (Debian, Ubuntu, Red Hat et dérivées) utilisent glibc et PAM : elles ne correspondent pas à la description du CERT-FR, mais suivez quand même les bulletins de votre distribution. Les conteneurs Docker qui ne font pas tourner `sshd` ne sont pas concernés, selon Alpine.

### Que faire ?

1. **Mettre à jour**, puis **redémarrer `sshd`** (la mise à jour seule ne relance pas le service). Sur Alpine :
   ```sh
   apk upgrade -U -a
   rc-service sshd restart
   ```
2. **Si vous ne pouvez pas mettre à jour tout de suite**, désactiver l'authentification par mot de passe, recommandation du CERT-FR comme d'Alpine. Vérifiez d'abord que la connexion par clé fonctionne, dans une **deuxième session** que vous gardez ouverte :
   ```sh
   echo 'PasswordAuthentication no' > /etc/ssh/sshd_config.d/no-password.conf
   sshd -t && rc-service sshd restart
   sshd -T | grep -i passwordauthentication
   ```
3. **Chercher une trace de connexion suspecte** : le CERT-FR reprend la commande proposée par le chercheur, qui liste les connexions par mot de passe réussies sur les comptes dont le mot de passe est désactivé (à lancer en root ; adaptez le chemin du journal à votre système) :
   ```sh
   awk -F : '$2 == "*" {print $1}' /etc/shadow | xargs -r -I{} grep "Accepted password for {}" /var/log/messages
   ```
4. **De façon générale**, un serveur SSH exposé sur Internet devrait n'accepter que les clés. La cheatsheet [Linux et Proxmox](/cheatsheets/linux-proxmox/) rassemble les commandes `systemctl` et `journalctl` utiles pour vérifier le service et ses journaux.

## 2. Symfony : nouvelle série de correctifs de sécurité (4 novembre)

### Ce qui est confirmé

Le projet Symfony a publié le 4 novembre 2026 plusieurs avis de sécurité, corrigés dans les versions **5.4.56, 6.4.50, 7.4.23 et 8.1.11**. Le CERT-FR les a repris dans son avis **CERTFR-2026-AVI-1460**. Les versions publiées fin octobre ne contiennent pas ces correctifs. Parmi les avis (titres d'après la base de Packagist) :

- **Filesystem** : un préfixe avant « :// » est traité comme une racine, ce qui permet à un chemin de sortir du répertoire de base prévu ;
- **HttpFoundation** : des requêtes HEAD qui contournent l'option `methods` des règles `access_control` et des pare-feu (correctif incomplet d'une faille précédente) ; des URL générées qui peuvent pointer vers un hôte choisi par le client ; des règles de chemin appliquées devant PHP contournables ;
- **HttpFoundation et FrameworkBundle** : le raccourci `private_ranges` des proxys de confiance accepte à tort certaines adresses IPv6 de transition ;
- **Config** : une lecture de fichier local (XXE) dans `XmlUtils::parse()`.

### Que faire ?

1. Lancez **`composer audit`** dans chaque projet PHP : il liste les paquets concernés par un avis connu.
2. Mettez à jour les composants Symfony dans la branche que vous utilisez : `composer update 'symfony/*' --with-dependencies`, puis vos tests.
3. Si votre application est derrière un proxy ou un répartiteur de charge, vérifiez la configuration `trusted_proxies` après la mise à jour.

C'est exactement ce qui est arrivé à ce site : la CI a bloqué la mise en production tant que l'API et l'espace client n'étaient pas passés en 8.1.11 et 7.4.23. Un `composer audit` dans la chaîne de déploiement ne coûte rien et évite de livrer une version connue comme vulnérable.

## À retenir

- OpenSSH : surtout Alpine et les systèmes musl sans PAM ; mettre à jour, redémarrer `sshd`, et préférer les clés aux mots de passe.
- Symfony : passer en 5.4.56, 6.4.50, 7.4.23 ou 8.1.11 selon votre branche ; `composer audit` le signale.

## Sources

- [CERT-FR, alerte CERTFR-2026-ALE-015 : vulnérabilité dans OpenSSH](https://www.cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-015/)
- [OpenSSH 10.6p2, notes de version (en anglais)](https://www.openssh.org/txt/release-10.6p2)
- [Alpine Linux, 5 novembre 2026 : contournement de l'authentification par mot de passe dans OpenSSH (en anglais)](https://alpinelinux.org/posts/2026-11-05-openssh-password-authentication-bypass/)
- [Symfony, avis de sécurité GHSA-6prc-h956-hxjq (Filesystem) (en anglais)](https://github.com/symfony/symfony/security/advisories/GHSA-6prc-h956-hxjq)
- [Packagist, base des avis de sécurité Symfony (en anglais)](https://packagist.org/security-advisories/)

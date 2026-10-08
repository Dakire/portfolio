---
title: Mails en spam ou rejetés : méthode de diagnostic
description: Lire un message de rejet, analyser les en-têtes, vérifier SPF/DKIM/DMARC, la réputation et le reverse DNS : une démarche en étapes pour trouver la cause.
date: 2026-10-03
---

« Mon mail n'arrive pas » : voilà un ticket classique. Les causes sont très variées (authentification, réputation, contenu, configuration du destinataire), mais la démarche de diagnostic, elle, est toujours la même. L'objectif est de passer de l'intuition à des **faits** lisibles dans le message de rejet et dans les en-têtes.

## Étape 1 : lire le message de rejet (NDR)

Quand un serveur refuse un message, il renvoie un message de non-remise. Il contient un **code SMTP** et un **code d'état amélioré**, accompagnés d'un texte. Ne le survolez pas : c'est le meilleur indice.

| Code | Signification courante |
|---|---|
| `4xx` | Refus **temporaire** : nouvelle tentative automatique (greylisting, limitation de débit) |
| `5xx` | Refus **définitif** |
| `550 5.1.1` | Adresse du destinataire inexistante (faute de frappe, compte supprimé) |
| `550 5.7.26` (Gmail) | Le message ne passe pas l'authentification (SPF ou DKIM) |
| `550 5.7.509` (Exchange Online) | Le domaine expéditeur échoue à DMARC et publie une politique `reject` |
| `550 5.7.515` (Outlook.com) | Un expéditeur en volume (plus de 5 000 messages par jour) ne respecte pas les exigences SPF, DKIM et DMARC |
| `550 5.7.1` / `554 5.7.1` | Refus pour politique : liste de blocage, réputation, règle du destinataire |
| `552 5.2.2` | Boîte du destinataire pleine |

Le texte du rejet contient souvent un lien vers la documentation de l'opérateur. Suivez-le.

## Étape 2 : si le mail arrive mais en spam, lire les en-têtes

Ouvrez le message reçu, affichez les **en-têtes complets** (« Afficher l'original » dans Gmail, « Afficher les détails du message » dans Outlook), et cherchez la ligne :

```
Authentication-Results: mx.google.com;
       dkim=pass header.d=example.com;
       spf=pass smtp.mailfrom=example.com;
       dmarc=pass header.from=example.com
```

- `spf=fail` ou `softfail` : le serveur d'envoi n'est pas autorisé dans SPF.
- `dkim=none` : le message n'est pas signé. `dkim=fail` : signature invalide (message modifié en route, mauvaise clé publiée).
- `dmarc=fail` : aucun des deux ne passe **avec alignement** sur le domaine visible.

Google propose un analyseur d'en-têtes qui présente aussi les délais entre serveurs (utile pour repérer un message retardé).

## Étape 3 : vérifier le DNS

Contrôlez que ce qui est publié correspond à ce que vous croyez :

```
dig +short TXT example.com              # SPF
dig +short TXT _dmarc.example.com       # DMARC
dig +short TXT selecteur._domainkey.example.com   # DKIM
dig +short MX example.com
```

À chercher : deux SPF, un SPF au-delà de 10 résolutions DNS, un sélecteur DKIM inexistant, un MX qui pointe vers un CNAME. Les détails sont dans [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/) et [diagnostiquer le DNS avec dig et nslookup](/blog/diagnostic-dns-dig-nslookup-propagation-ttl/).

## Étape 4 : examiner l'IP et la réputation

Si le message est correctement authentifié mais refusé ou classé en spam, on regarde la **réputation** :

- L'adresse IP d'envoi est-elle sur une liste de blocage ? Plusieurs outils en ligne interrogent les principales listes en une fois.
- Pour un serveur que vous gérez : l'IP doit avoir un **reverse DNS (PTR)** cohérent, qui correspond au nom annoncé par le serveur lors de la connexion SMTP (HELO/EHLO).
- Pour Gmail, **Google Postmaster Tools** donne la réputation du domaine et de l'IP, le taux de spam et l'état de l'authentification (réservé aux domaines vérifiés qui envoient un volume suffisant).
- Pour Microsoft, le programme SNDS et le portail de délistage permettent de suivre une IP.

Sur un service mutualisé (Google Workspace, Microsoft 365), vous partagez des IP avec d'autres clients : c'est le **domaine** et la qualité de l'authentification qui comptent le plus.

## Étape 5 : regarder le contenu et le comportement

Quand tout est techniquement correct, cherchez :

- Un volume qui a brusquement augmenté, ou un envoi massif depuis une adresse qui ne l'était pas jusque-là.
- Des liens raccourcis, des pièces jointes exécutables ou protégées, un contenu uniquement composé d'images.
- Un taux de plaintes élevé : Google demande de rester sous 0,30 % de spam signalé dans Postmaster Tools, et conseille de viser moins de 0,10 %. Pour les envois marketing en volume (plus de 5 000 messages par jour), la **désinscription en un clic** est obligatoire.
- Une liste de destinataires de mauvaise qualité (adresses périmées, achetées).

## Étape 6 : tester de bout en bout

- Envoyez un message vers une adresse de test d'un service d'analyse (qui donne une note et détaille authentification et contenu).
- Envoyez vers plusieurs messageries (Gmail, Outlook.com, un domaine d'entreprise) pour voir si le problème est général ou propre à un opérateur.
- Après correction, **testez à nouveau** : les caches DNS peuvent retarder de quelques heures l'effet d'une modification.

## Checklist de diagnostic rapide

1. Quel est le code du rejet ? Qu'en dit le texte ?
2. `spf`, `dkim`, `dmarc` : `pass` ou non dans les en-têtes ?
3. Le DNS publié correspond-il à l'attendu ?
4. L'IP ou le domaine est-il listé ou en mauvaise réputation ?
5. Un changement récent (nouveau service, migration, nouvelle application d'envoi) explique-t-il le début du problème ?

Le point 5 est souvent le plus parlant : un problème de délivrabilité qui commence un jour précis coïncide le plus souvent avec une modification, par exemple après une [migration de messagerie](/blog/migration-messagerie-google-workspace-microsoft-365/).

## Sources

- [Google : règles pour les expéditeurs de messages](https://support.google.com/a/answer/81126)
- [Microsoft : codes d'erreur SMTP et rapports de non-remise dans Exchange Online](https://learn.microsoft.com/en-us/troubleshoot/exchange/email-delivery/ndr/non-delivery-reports-in-exchange-online)
- [Microsoft : nouvelles exigences d'Outlook.com pour les expéditeurs en volume](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)
- [RFC 3463 : codes d'état améliorés SMTP](https://www.rfc-editor.org/rfc/rfc3463)

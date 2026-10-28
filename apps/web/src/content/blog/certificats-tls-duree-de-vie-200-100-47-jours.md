---
title: 'Certificats TLS : 200, 100 puis 47 jours de durée de vie'
description: 'Depuis le 15 mars 2026, un certificat TLS public ne dure plus que 200 jours maximum, puis 100 jours en 2027 et 47 jours en 2029. Calendrier, impacts et préparation.'
date: 2026-10-28
category: securite
tags: ['TLS', 'Certificats', 'ACME', "Let's Encrypt", 'CAA', 'DNS']
---

Depuis le 15 mars 2026, un certificat TLS public ne peut plus être émis pour plus de **200 jours**. Ce n'est qu'une première marche : la durée maximale tombera à 100 jours en 2027, puis à 47 jours en 2029. Un certificat renouvelé « une fois par an » à la main, c'est déjà fini ; à terme, ce sera presque une fois par mois.

## Le calendrier

La règle vient du ballot SC-081v3 du CA/Browser Forum (le groupe qui réunit les autorités de certification et les éditeurs Apple, Google, Microsoft et Mozilla). Il a été adopté en avril 2025 puis intégré aux _Baseline Requirements_ (version 2.2.2 de janvier 2026). Les durées maximales s'appliquent aux certificats **émis** à partir de chaque date :

| Certificat émis       | Durée maximale | Réutilisation d'une validation de domaine |
| --------------------- | -------------- | ----------------------------------------- |
| avant le 15 mars 2026 | 398 jours      | 398 jours                                 |
| dès le 15 mars 2026   | 200 jours      | 200 jours                                 |
| dès le 15 mars 2027   | 100 jours      | 100 jours                                 |
| dès le 15 mars 2029   | 47 jours       | 10 jours                                  |

La dernière colonne compte autant que la première. Avant d'émettre, l'autorité de certification doit avoir validé que vous contrôlez le domaine, et elle ne peut réutiliser cette validation que pendant la durée indiquée. En 2029, une validation de plus de 10 jours ne servira plus : il faudra revalider presque à chaque renouvellement.

Ce sont des maximums que les autorités de certification s'engagent à respecter : aucune d'elles ne vous émettra un certificat plus long. Le texte recommande même de ne pas viser la durée maximale exacte (199, 99 et 46 jours). Autre échéance : à partir du 15 mars 2028, certaines méthodes de validation par courriel (adresses construites comme `admin@` ou `postmaster@`, ou courriel au contact CAA ou TXT) ne seront plus acceptées. La validation par modification du DNS reste prévue.

## L'automatisation devient la règle

À 47 jours, renouveler à la main n'est plus tenable. Le protocole standard est **ACME** (RFC 8555), utilisé par Let's Encrypt et par de nombreuses autorités commerciales. Un client ACME (certbot, acme.sh, Caddy, Traefik, l'intégration de votre panneau d'hébergement…) demande, valide et installe le certificat sans intervention.

Let's Encrypt a publié son propre calendrier :

- 13 mai 2026 : le profil optionnel `tlsserver` passe à 45 jours ;
- 10 février 2027 : le profil par défaut `classic` passe à 64 jours, avec 10 jours de réutilisation des validations ;
- 16 février 2028 : le profil `classic` passe à 45 jours, avec 7 heures de réutilisation.

Un point de vigilance : un client configuré pour renouveler tous les 60 jours ne suffira plus. Let's Encrypt recommande d'utiliser ACME Renewal Information (ARI), qui indique au client quand renouveler, ou à défaut de renouveler aux deux tiers de la durée du certificat.

## Validation HTTP ou DNS

Deux méthodes courantes :

- **HTTP-01** : l'autorité appelle un fichier sur le port 80 du site. Simple, mais impossible pour un certificat « wildcard » (`*.example.com`) et le serveur doit être joignable depuis Internet.
- **DNS-01** : le client publie un enregistrement TXT temporaire. Elle accepte les wildcards et fonctionne pour des services non publics, mais suppose que le client puisse modifier votre zone DNS, donc une API chez votre hébergeur DNS. Let's Encrypt conseille de limiter les droits de ces identifiants, ou de déléguer la réponse au défi par un CNAME vers une zone dédiée.

Let's Encrypt travaille aussi sur une méthode nommée DNS-PERSIST-01, dont l'enregistrement TXT ne changerait pas à chaque renouvellement. Elle est annoncée, pas encore standardisée : à surveiller, pas à planifier dessus.

## Hébergement mutualisé

Sur un hébergement mutualisé classique, le certificat est le plus souvent émis et renouvelé par l'hébergeur : vous n'avez rien à faire, et le passage à 47 jours est son problème. Deux cas échappent à cela : un certificat acheté ailleurs et importé à la main, et un certificat sur un domaine dont le DNS n'est pas géré par l'hébergeur (une validation par DNS peut alors demander une intervention de votre part). Dans le doute, vérifiez dans l'interface ou demandez à l'hébergeur : le comportement exact dépend de l'offre.

## CAA : dire qui a le droit d'émettre

Un enregistrement DNS **CAA** (RFC 8659) liste les autorités autorisées à émettre pour votre domaine :

```
example.com.  IN CAA 0 issue "letsencrypt.org"
example.com.  IN CAA 0 issuewild ";"
example.com.  IN CAA 0 iodef "mailto:securite@example.com"
```

Ici, seule Let's Encrypt peut émettre, les wildcards sont interdits, et les tentatives refusées sont signalées à une adresse. Quand vous changez d'autorité ou d'hébergeur, **pensez à mettre à jour le CAA** : sinon l'émission échoue. L'[outil DNS](/outils/dns/) du site signale l'absence ou le contenu des CAA, et le [calculateur de propagation](/outils/propagation-dns/) permet de vérifier qu'une modification est visible partout.

## Les certificats installés à la main

Le vrai risque n'est pas le site web, c'est tout ce qui ne parle pas ACME ou qu'on a oublié : pare-feu et VPN, NAS, imprimantes et contrôleurs d'accès, serveur Exchange, appliances de supervision, interfaces d'administration d'hyperviseur. Pour chacun :

1. l'inventorier (où, quel domaine, quelle échéance, qui renouvelle) ;
2. vérifier s'il sait faire de l'ACME, ou s'il peut recevoir un certificat par API ou par script ;
3. à défaut, passer par un reverse proxy qui porte le certificat, ou par un certificat d'une autorité interne si le service n'est pas public (les règles ci-dessus ne concernent que les certificats publics).

## Superviser les échéances

Même avec l'automatisation, un renouvellement peut échouer en silence (jeton DNS expiré, règle de pare-feu modifiée, CAA oublié). Mettez en place une alerte sur la **date d'expiration réellement servie**, par exemple avec une sonde qui se connecte au service et alerte à 14 puis 7 jours, plutôt qu'une simple date dans un calendrier. Let's Encrypt recommande lui aussi de surveiller les certificats non renouvelés à temps.

## Sources

- [CA/Browser Forum : ballot SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/) (25 émetteurs pour, aucun contre, 4 éditeurs pour)
- [Baseline Requirements 2.2.2 (PDF)](https://cabforum.org/working-groups/server/baseline-requirements/documents/CA-Browser-Forum-TLS-BR-2.2.2.pdf) (sections 4.2.1 et 6.3.2, dates du 15 mars 2026, 2027 et 2029)
- [Let's Encrypt : passer de 90 à 45 jours](https://letsencrypt.org/2025/12/02/from-90-to-45)
- [Let's Encrypt : types de défis (HTTP-01, DNS-01)](https://letsencrypt.org/docs/challenge-types/)
- [RFC 8555 : ACME](https://www.rfc-editor.org/rfc/rfc8555)
- [RFC 8659 : enregistrements CAA](https://www.rfc-editor.org/rfc/rfc8659)

Voir aussi [diagnostiquer le DNS avec dig et nslookup](/blog/diagnostic-dns-dig-nslookup-propagation-ttl/) et [les enregistrements DNS expliqués](/blog/enregistrements-dns-a-mx-cname-txt-expliques/).

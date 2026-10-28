---
title: 'Enregistrements DNS expliqués : A, MX, CNAME, TXT et les autres'
description: 'Le rôle de chaque enregistrement DNS (A, AAAA, CNAME, MX, TXT, NS, SOA, CAA, PTR, SRV), avec exemples, pièges classiques, messagerie (SPF, DKIM, DMARC) et commandes dig et nslookup.'
date: 2026-10-28
category: dns
tags: ['DNS', 'MX', 'CNAME', 'TXT', 'dig', 'nslookup']
---

Le DNS est l'annuaire d'Internet : il traduit un nom (`www.example.com`) en informations utiles (une adresse IP, un serveur de messagerie, une preuve de propriété). Chaque information est un **enregistrement** d'un certain type. Voici ceux que l'on rencontre vraiment, ce qu'ils font, et les erreurs qui coûtent des heures.

## Les enregistrements un par un

| Type  | Rôle                                                      | Exemple                                              |
| ----- | --------------------------------------------------------- | ---------------------------------------------------- |
| A     | nom vers adresse IPv4                                     | `www  IN A 192.0.2.10`                               |
| AAAA  | nom vers adresse IPv6 (RFC 3596)                          | `www  IN AAAA 2001:db8::10`                          |
| CNAME | alias : ce nom est un autre nom                           | `blog IN CNAME www.example.com.`                     |
| MX    | serveurs de messagerie, avec priorité                     | `@    IN MX 10 mail.example.com.`                    |
| TXT   | texte libre (SPF, DKIM, DMARC, validations de propriété)  | `@    IN TXT "v=spf1 include:_spf.example.net -all"` |
| NS    | serveurs de noms faisant autorité pour la zone            | `@    IN NS ns1.exemple-hebergeur.net.`              |
| SOA   | « carte d'identité » de la zone                           | un seul par zone, géré par l'hébergeur DNS           |
| CAA   | autorités autorisées à émettre des certificats (RFC 8659) | `@    IN CAA 0 issue "letsencrypt.org"`              |
| PTR   | résolution inverse : adresse vers nom                     | `25.2.0.192.in-addr.arpa. IN PTR mail.example.com.`  |
| SRV   | localise un service : priorité, poids, port, serveur      | `_imaps._tcp IN SRV 0 1 993 mail.example.com.`       |

Les adresses ci-dessus (`192.0.2.x`, `2001:db8::`) sont des exemples de documentation. Quelques précisions utiles :

- **MX** : plus la valeur est basse, plus le serveur est prioritaire (RFC 1035). Sans aucun MX, un serveur d'envoi se rabat sur l'adresse (A ou AAAA) du domaine, selon la RFC 5321 : c'est rarement ce que vous voulez.
- **SOA** : contient le serveur principal, une adresse de contact, un numéro de série et des durées de rafraîchissement. Son dernier champ sert en pratique de durée de mise en cache des réponses « n'existe pas » (RFC 2308).
- **PTR** : l'adresse est écrite à l'envers, sous `in-addr.arpa` pour l'IPv4 (RFC 1035) et sous `ip6.arpa`, chiffre hexadécimal par chiffre, pour l'IPv6 (RFC 3596). Le PTR est géré par celui qui possède l'adresse IP, donc en général votre fournisseur d'accès ou d'hébergement, pas votre zone.
- **SRV** : le nom prend la forme `_service._protocole.domaine` (RFC 2782) ; la cible doit avoir un enregistrement d'adresse et ne peut pas être un alias.
- **CAA** : voir [les durées de vie des certificats TLS](/blog/certificats-tls-duree-de-vie-200-100-47-jours/) pour le contexte.

## Pièges classiques

- **CNAME à la racine** (`example.com`). Un CNAME ne peut coexister avec aucun autre enregistrement sur le même nom (RFC 2181), et la racine porte au moins NS et SOA, souvent MX et TXT. Certains hébergeurs proposent un équivalent appelé ALIAS ou ANAME.
- **MX qui pointe vers un CNAME**. La cible d'un MX ou d'un NS ne doit pas être un alias (RFC 2181) : elle doit avoir un enregistrement A ou AAAA.
- **TTL trop long avant un changement**. Les résolveurs gardent la réponse jusqu'à expiration du TTL. Abaissez-le à l'avance, puis remettez-le ensuite.
- **« Propagation »** : rien ne se propage, ce sont des caches qui expirent. Voir [le diagnostic avec dig et nslookup](/blog/diagnostic-dns-dig-nslookup-propagation-ttl/) et l'outil de [propagation DNS](/outils/propagation-dns/).
- **Point final oublié** : dans un fichier de zone, `mail.example.com` sans point final devient `mail.example.com.example.com.`. Certaines interfaces ajoutent le domaine toutes seules, d'autres non.
- **Plusieurs SPF** : un seul enregistrement TXT SPF par nom ; deux rendent le SPF invalide.
- **Valeur TXT coupée** : une chaîne TXT est limitée à 255 caractères, il faut alors la découper en plusieurs chaînes dans le même enregistrement.

## La messagerie : MX, SPF, DKIM, DMARC

Pour qu'un domaine reçoive et envoie du courrier correctement, quatre éléments se complètent :

1. **MX** : où livrer le courrier destiné au domaine.
2. **SPF** (RFC 7208), un TXT à la racine : quels serveurs ont le droit d'envoyer pour ce domaine.
3. **DKIM** (RFC 6376), un TXT sous `sélecteur._domainkey.domaine` : la clé publique qui permet de vérifier la signature des messages.
4. **DMARC** (RFC 7489), un TXT sous `_dmarc.domaine` : la politique à appliquer si SPF et DKIM échouent, et où envoyer les rapports, par exemple `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com`.

Le détail est dans [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/). Pour comprendre pourquoi un message a été classé en spam ou rejeté, voir [le diagnostic de délivrabilité](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/) et [lire les en-têtes d'un courriel](/blog/lire-en-tetes-email-received-spf-dkim-dmarc/). Lors d'un changement de fournisseur, la [migration de messagerie](/blog/migration-messagerie-google-workspace-microsoft-365/) détaille les enregistrements à basculer. Un PTR cohérent avec le nom du serveur d'envoi fait aussi partie des vérifications courantes des serveurs récepteurs.

## dig et nslookup : les commandes de base

```
dig example.com A +short              # adresse IPv4
dig example.com MX +short             # serveurs de messagerie
dig example.com TXT +short            # SPF et validations
dig _dmarc.example.com TXT +short     # politique DMARC
dig -x 192.0.2.25 +short              # PTR (résolution inverse)
dig @8.8.8.8 example.com NS           # interroger un résolveur précis
```

```
nslookup -type=MX example.com
nslookup -type=TXT example.com 8.8.8.8
nslookup 192.0.2.25
```

Sous Windows, `nslookup` est livré d'office ; `Resolve-DnsName example.com -Type MX` fait la même chose en PowerShell. L'[outil DNS](/outils/dns/) du site regroupe ces vérifications (A, AAAA, MX, SPF, DKIM, DMARC, CAA…) en un rapport. Pour retenir les commandes courantes, l'[aide-mémoire réseau](/cheatsheets/reseau/) sert de pense-bête.

## Sources

- [RFC 1035 : noms de domaine, implémentation et spécification](https://www.rfc-editor.org/rfc/rfc1035) (SOA, MX, PTR)
- [RFC 2181 : clarifications sur la spécification DNS](https://www.rfc-editor.org/rfc/rfc2181) (CNAME seul sur son nom, MX et NS non alias, TTL)
- [RFC 2308 : mise en cache négative](https://www.rfc-editor.org/rfc/rfc2308)
- [RFC 2782 : enregistrements SRV](https://www.rfc-editor.org/rfc/rfc2782)
- [RFC 3596 : DNS et IPv6 (AAAA, ip6.arpa)](https://www.rfc-editor.org/rfc/rfc3596)
- [RFC 5321 : SMTP](https://www.rfc-editor.org/rfc/rfc5321) (section 5.1, MX implicite)
- [RFC 7208 : SPF](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376 : DKIM](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 7489 : DMARC](https://www.rfc-editor.org/rfc/rfc7489)
- [RFC 8659 : CAA](https://www.rfc-editor.org/rfc/rfc8659)

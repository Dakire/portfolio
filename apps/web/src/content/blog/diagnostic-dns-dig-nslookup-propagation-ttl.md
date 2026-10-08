---
title: 'Diagnostiquer le DNS avec dig et nslookup'
description: 'Interroger le bon serveur, comprendre la « propagation » et le TTL, repérer les erreurs de zone courantes (CNAME à la racine, MX, TXT, délégation).'
date: 2026-10-03
category: dns
tags: ['DNS', 'dig', 'nslookup', 'TTL']
---

Une grande partie des pannes « mystérieuses » (site inaccessible, messagerie qui ne reçoit plus, certificat qui ne se valide pas) vient du DNS. La bonne nouvelle : avec trois ou quatre commandes et une bonne compréhension du cache, on les diagnostique vite.

## Les outils

| Outil             | Plateforme                                    | Exemple                                 |
| ----------------- | --------------------------------------------- | --------------------------------------- |
| `dig`             | Linux, macOS (et Windows via les outils BIND) | `dig example.com A`                     |
| `nslookup`        | Windows, Linux, macOS                         | `nslookup -type=MX example.com`         |
| `Resolve-DnsName` | PowerShell                                    | `Resolve-DnsName example.com -Type TXT` |

`dig` est le plus précis. La commande `dig +short` n'affiche que la réponse, et `dig` seul montre aussi le **TTL**, le serveur interrogé et l'état de la réponse.

## Types d'enregistrements à connaître

- **A / AAAA** : adresse IPv4 / IPv6.
- **CNAME** : alias vers un autre nom.
- **MX** : serveurs de messagerie, avec priorité (le plus petit nombre est prioritaire).
- **TXT** : texte libre, utilisé par SPF, DKIM, DMARC et les validations de propriété de domaine.
- **NS** : serveurs de noms faisant autorité pour la zone.
- **PTR** : résolution inverse (IP vers nom), importante pour l'envoi de courrier.

## Interroger le bon serveur

La réponse dépend de **qui vous interrogez**. Votre poste interroge un résolveur (celui de votre box, de l'entreprise, ou un public), qui garde les réponses en cache. Pour savoir ce qui est réellement publié, interrogez directement un serveur **faisant autorité** :

```
dig NS example.com +short                  # quels sont les serveurs faisant autorité ?
dig @ns1.exemple-hebergeur.net example.com A   # ce qu'ils publient vraiment
dig @8.8.8.8 example.com A                 # ce que voit un résolveur public
dig +trace example.com                     # suit la chaîne de délégation depuis la racine
```

Si la réponse du serveur faisant autorité est correcte et que celle de votre résolveur ne l'est pas, le problème est un **cache**, pas la zone.

## La « propagation » et le TTL

On parle souvent de « propagation DNS », mais rien ne se propage vraiment : une modification est publiée immédiatement sur les serveurs faisant autorité, et les **caches** des résolveurs conservent l'ancienne valeur jusqu'à expiration de son **TTL** (durée de vie, en secondes).

- Un TTL de 3600 signifie qu'un résolveur peut garder l'ancienne réponse jusqu'à une heure.
- Pour une modification planifiée (changement de MX, de serveur web), **abaissez le TTL en avance** (au moins la durée de l'ancien TTL avant le changement), puis remettez-le à une valeur normale ensuite.
- Sur votre poste Windows, vider le cache local se fait avec `ipconfig /flushdns` ; sur macOS et Linux, la commande dépend du service de résolution utilisé. Cela ne purge pas le cache du résolveur de votre fournisseur.
- Si le nom interrogé n'existait pas avant la création de l'enregistrement, la réponse négative est elle aussi mise en cache (selon le TTL négatif défini dans le SOA).

## Erreurs de configuration fréquentes

- **CNAME à la racine du domaine** (`example.com`). Un CNAME ne peut pas coexister avec d'autres enregistrements sur le même nom, et la racine porte au moins NS, SOA et souvent MX et TXT. Certains hébergeurs proposent un équivalent appelé ALIAS ou ANAME.
- **MX qui pointe vers un CNAME** ou directement vers une adresse IP : un MX doit désigner un nom qui possède un enregistrement A/AAAA.
- **Deux enregistrements SPF** dans les TXT, ou un SPF qui dépasse 10 résolutions : le SPF devient invalide.
- **Point final oublié ou en trop** dans une interface qui attend un nom complet : `mail.example.com` peut être interprété comme `mail.example.com.example.com`.
- **TXT mal formaté** : guillemets, valeur coupée, caractères parasites copiés depuis un document. Une valeur de plus de 255 caractères doit être découpée en plusieurs chaînes.
- **Délégation incohérente** : les serveurs de noms déclarés chez le registrar (bureau d'enregistrement) ne sont pas ceux qui hébergent la zone que vous éditez. Vous modifiez alors une zone que personne n'interroge.
- **DNSSEC** : un enregistrement DS obsolète chez le registrar après un changement d'hébergeur DNS rend le domaine invalide pour les résolveurs qui valident DNSSEC. Le symptôme : il ne résout plus pour certains utilisateurs seulement.

## Une démarche en cinq commandes

```
dig NS example.com +short             # 1. qui fait autorité ?
dig @<ns> example.com A +noall +answer  # 2. que publient-ils ?
dig @8.8.8.8 example.com A            # 3. que voit un résolveur public ?
dig MX example.com +short             # 4. messagerie : où va le courrier ?
dig TXT example.com +short            # 5. SPF et validations
```

Comparer ces réponses suffit à localiser le problème : zone mal éditée, délégation incohérente, ou simple cache en attente d'expiration.

Pour la partie messagerie (SPF, DKIM, DMARC), voir [SPF, DKIM, DMARC expliqués](/blog/spf-dkim-dmarc-expliques/) et [le diagnostic de délivrabilité](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/).

## Sources

- [RFC 1034 : concepts et fonctionnement du DNS](https://www.rfc-editor.org/rfc/rfc1034) (un CNAME ne coexiste pas avec d'autres enregistrements)
- [RFC 2181 : clarifications sur la spécification DNS](https://www.rfc-editor.org/rfc/rfc2181) (un MX ne doit pas pointer vers un alias)
- [RFC 2308 : mise en cache négative](https://www.rfc-editor.org/rfc/rfc2308)
- [RFC 7208 : SPF](https://www.rfc-editor.org/rfc/rfc7208) (limite de 10 résolutions)

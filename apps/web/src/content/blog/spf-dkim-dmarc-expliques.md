---
title: 'SPF, DKIM et DMARC : le guide de configuration'
description: "Rôle de chaque enregistrement DNS, exemples prêts à adapter, pièges courants et plan de déploiement progressif jusqu'à DMARC en reject."
date: 2026-10-03
category: messagerie
tags: ['SPF', 'DKIM', 'DMARC', 'DNS']
---

Un e-mail se falsifie très facilement : le champ « From » n'est, à l'origine, qu'une simple déclaration. **SPF, DKIM et DMARC** sont trois mécanismes complémentaires, publiés dans le DNS de votre domaine, qui permettent aux serveurs destinataires de vérifier qu'un message vient bien de vous. Sans eux, vos mails finissent en spam, et n'importe qui peut usurper votre domaine.

## En une phrase chacun

- **SPF** : la liste des serveurs autorisés à envoyer du courrier pour votre domaine.
- **DKIM** : une signature cryptographique ajoutée à chaque message, vérifiable grâce à une clé publique publiée dans le DNS.
- **DMARC** : la règle qui dit quoi faire quand SPF et DKIM échouent, et qui demande aux destinataires de vous envoyer des rapports.

## SPF : qui a le droit d'envoyer ?

SPF est un enregistrement **TXT** à la racine du domaine :

```
example.com.  TXT  "v=spf1 include:_spf.google.com include:spf.protection.outlook.com -all"
```

- `include:` autorise les serveurs d'un fournisseur (ici Google Workspace et Microsoft 365).
- `ip4:` / `ip6:` autorise une adresse ou une plage précise (un serveur applicatif, un relais interne).
- `-all` : tout le reste est refusé. `~all` : tout le reste est suspect (softfail). Le premier est plus strict, le second plus indulgent pendant une phase de test.

Trois règles à retenir :

1. **Un seul enregistrement SPF par domaine.** Deux enregistrements `v=spf1` rendent SPF invalide (erreur « permerror »). Il faut les fusionner.
2. **Maximum 10 résolutions DNS** (`include`, `a`, `mx`, `redirect`, `exists`, `ptr`). Au-delà, SPF échoue avec une erreur « permerror ». Les `ip4:` et `ip6:` ne comptent pas. Empiler les services (newsletter, CRM, ticketing, Microsoft, Google) fait vite exploser la limite.
3. SPF vérifie le domaine de l'**adresse d'enveloppe** (Return-Path), pas celui affiché dans « From ». Il casse aussi lors d'un transfert automatique, car le serveur qui retransmet n'est pas dans votre liste. C'est pourquoi DKIM est indispensable.

## DKIM : un message signé

À l'envoi, le serveur signe certains en-têtes et le corps du message avec une **clé privée**. Le destinataire récupère la **clé publique** dans le DNS, à l'adresse `<sélecteur>._domainkey.<domaine>`, et vérifie la signature.

```
google._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqh..."
```

Points pratiques :

- Le **sélecteur** permet d'avoir plusieurs clés en parallèle (un par service d'envoi, ou pour faire une rotation).
- Utilisez des clés **2048 bits** quand le fournisseur le permet.
- Chez **Google Workspace**, la clé est générée dans la console d'administration (Applications > Google Workspace > Gmail > Authentifier les e-mails), puis publiée en TXT. Chez **Microsoft 365**, on publie deux enregistrements **CNAME** (`selector1._domainkey` et `selector2._domainkey`) qui pointent vers Microsoft, puis on active la signature dans le portail Defender.
- Certaines interfaces DNS limitent un TXT à 255 caractères par chaîne : une clé de 2048 bits doit alors être découpée en plusieurs chaînes consécutives (la plupart des hébergeurs DNS le font tout seuls).

## DMARC : la politique et les rapports

DMARC est un enregistrement TXT sur `_dmarc.<domaine>` :

```
_dmarc.example.com.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@example.com; adkim=r; aspf=r"
```

Il introduit la notion d'**alignement** : pour que DMARC soit validé, il faut que SPF _ou_ DKIM réussisse **et** que le domaine authentifié corresponde au domaine du « From » visible par l'utilisateur. C'est ce qui empêche un attaquant de faire passer SPF avec son propre domaine tout en affichant le vôtre.

Les paramètres essentiels :

| Paramètre        | Rôle                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `p=none`         | Surveillance uniquement : rien n'est bloqué, mais vous recevez des rapports                                                      |
| `p=quarantine`   | Les messages en échec vont en spam                                                                                               |
| `p=reject`       | Les messages en échec sont refusés                                                                                               |
| `rua=`           | Adresse qui reçoit les rapports agrégés (XML, quotidiens)                                                                        |
| `adkim` / `aspf` | Alignement `r` (relaxed, accepte les sous-domaines) ou `s` (strict)                                                              |
| `sp=`            | Politique appliquée aux sous-domaines existants                                                                                  |
| `np=`            | Politique appliquée aux sous-domaines qui n'existent pas dans le DNS (contre l'usurpation de sous-domaines inventés)             |
| `t=y`            | Mode test : les destinataires appliquent une politique moins sévère (`reject` devient `quarantine`, `quarantine` devient `none`) |
| `pct=`           | Ancien pourcentage de messages soumis à la politique, retiré de la norme actuelle (voir ci-dessous)                              |

> **Mise à jour de la norme.** DMARC a été révisé en mai 2026 : la [RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html) remplace la RFC 7489 de 2015. Elle retire `pct` et introduit `np` et `t`. Beaucoup de serveurs de réception comprennent encore `pct`, mais mieux vaut ne plus compter dessus pour un déploiement progressif.

## Plan de déploiement progressif

Passer directement à `p=reject` est le meilleur moyen de bloquer ses propres mails légitimes (outil d'envoi oublié, imprimante, application métier). La méthode sûre :

1. **Inventorier** tous les services qui envoient du courrier avec votre domaine : messagerie, newsletter, facturation, CRM, scanners, applications.
2. Publier SPF et DKIM pour chacun.
3. Publier DMARC en **`p=none`** avec une adresse `rua` et laisser tourner 2 à 4 semaines. Lire les rapports (un outil d'analyse DMARC rend le XML lisible).
4. Corriger les expéditeurs légitimes qui échouent.
5. Passer en **`p=quarantine`**, avec `t=y` pendant la phase de validation (ou, sur les anciens déploiements, `pct=10` puis 50 puis 100). Surveiller les rapports pendant quelques semaines.
6. Passer en **`p=reject`** quand les rapports sont propres, en retirant `t=y`.

## Pourquoi c'est devenu obligatoire

Depuis le 1er février 2024, Google (Gmail) et Yahoo exigent SPF, DKIM et DMARC des expéditeurs qui envoient plus de 5 000 messages par jour, avec au minimum `p=none`. Microsoft applique des règles équivalentes à Outlook.com depuis le 5 mai 2025 : les messages non conformes sont rejetés avec l'erreur `550 5.7.515`. Ces seuils concernent les gros volumes, mais SPF, DKIM et DMARC restent la base d'une bonne délivrabilité même pour une petite structure.

## Erreurs fréquentes

- Deux enregistrements SPF publiés par deux personnes différentes.
- Dépassement de la limite de 10 résolutions DNS après l'ajout d'un nouveau service.
- DKIM activé côté fournisseur mais enregistrement jamais publié (ou publié avec une faute de copier-coller).
- DMARC en `p=reject` posé avant l'inventaire des expéditeurs.
- Adresse `rua` hébergée sur un autre domaine sans l'enregistrement d'autorisation requis : les rapports ne sont jamais envoyés.

## Vérifier ce qui est publié

Depuis un terminal :

```
dig +short TXT example.com
dig +short TXT _dmarc.example.com
dig +short TXT google._domainkey.example.com
```

Sous Windows : `Resolve-DnsName -Type TXT example.com`. Pour valider un message réel, ouvrez ses en-têtes complets et cherchez la ligne `Authentication-Results`, qui indique `spf=pass`, `dkim=pass` et `dmarc=pass`. La méthode complète est détaillée dans l'article [diagnostiquer un problème de délivrabilité](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/).

## Sources

- [RFC 7208 : Sender Policy Framework (SPF)](https://www.rfc-editor.org/rfc/rfc7208) (limite de 10 résolutions)
- [RFC 6376 : DomainKeys Identified Mail (DKIM)](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 9989 : DMARC](https://www.rfc-editor.org/rfc/rfc9989.html) (mai 2026, remplace la RFC 7489)
- [Google : règles pour les expéditeurs de messages](https://support.google.com/a/answer/81126)
- [Microsoft : nouvelles exigences d'Outlook.com pour les expéditeurs en volume](https://techcommunity.microsoft.com/blog/microsoftdefenderforoffice365blog/strengthening-email-ecosystem-outlook%E2%80%99s-new-requirements-for-high%E2%80%90volume-senders/4399730)

---
title: "Lire les en-têtes d'un e-mail : Received, SPF, DKIM, DMARC"
description: "Où trouver les en-têtes dans Outlook, Gmail et Thunderbird, comment lire Received, Authentication-Results et DKIM-Signature, et que conclure d'un spam, d'une usurpation ou d'un retard."
date: 2026-10-28
category: messagerie
tags: ['En-têtes', 'SPF', 'DKIM', 'DMARC', 'Délivrabilité']
---

Un message suspect, un mail arrivé avec trois heures de retard, une facture « du directeur » que personne n'a demandée : dans tous ces cas, la réponse se trouve dans les **en-têtes**, la partie du message que le client de messagerie cache par défaut. Cet article montre où les récupérer, comment les lire dans le bon ordre et quoi en conclure.

## Où trouver les en-têtes

- **Gmail** : ouvrir le message, icône « Plus » à côté de « Répondre », puis « Afficher l'original ». Un bouton permet de copier le tout.
- **Outlook (nouvelle version et Outlook sur le web)** : « Plus d'actions » en haut du message, puis « Afficher », puis « Afficher les détails du message ».
- **Outlook classique (Windows)** : ouvrir le message dans sa propre fenêtre, « Fichier », « Propriétés » ; les en-têtes sont dans le cadre « En-têtes Internet ».
- **Thunderbird** : `Ctrl+U` (« View Message Source ») affiche le message brut, en-têtes compris.

Les intitulés exacts varient avec la langue et la version du client. Copiez ensuite l'ensemble des en-têtes : l'[analyseur d'en-têtes d'e-mail](/outils/en-tetes-email/) du site les décode (chemin, délais, SPF, DKIM, DMARC, alignement) et c'est utile pour vérifier votre lecture manuelle.

## Lire les `Received` de bas en haut

Chaque serveur qui prend en charge le message ajoute une ligne `Received` **au début** du message (RFC 5321). La plus ancienne est donc tout en bas, la plus récente tout en haut. On lit le trajet de bas en haut :

```
Return-Path: <bounce@mail.example.org>
Received: from mx.example.net (mx.example.net [192.0.2.25])
        by mailbox.example.com with ESMTPS id a1b2c3
        for <alice@example.com>; Tue, 27 Oct 2026 09:14:07 +0100
Received: from out.example.org (out.example.org [198.51.100.10])
        by mx.example.net with ESMTPS id d4e5f6
        for <alice@example.com>; Tue, 27 Oct 2026 09:14:05 +0100
```

Dans une ligne, `from` indique le nom annoncé par l'émetteur (EHLO) et l'adresse IP vue par le récepteur, `by` le serveur qui a reçu, `with` le protocole, et la date est celle de la réception. Le trajet ci-dessus va de `out.example.org` vers `mx.example.net`, puis vers votre boîte, en deux secondes.

Une réserve importante : ces champs sont purement informatifs (RFC 5322). Un expéditeur malveillant peut écrire de fausses lignes `Received` en bas de la pile. Seules les lignes ajoutées par **vos** serveurs, en haut, méritent confiance.

## Authentication-Results : le verdict

Cet en-tête est ajouté par le serveur qui a vérifié le message à l'arrivée (RFC 8601) :

```
Authentication-Results: mailbox.example.com;
       spf=pass smtp.mailfrom=bounce@mail.example.org;
       dkim=pass header.d=example.org header.s=sel1;
       dmarc=pass header.from=example.org
```

- **SPF** : `pass`, `fail`, `softfail` (le domaine juge l'envoi non autorisé sans l'affirmer fermement : à examiner de plus près, pas à rejeter d'office), `neutral`, `none`, `temperror` (erreur DNS passagère), `permerror` (enregistrement illisible).
- **DKIM** : `pass`, `fail`, `none` (pas de signature), `policy`, `neutral`, `temperror`, `permerror`.
- **DMARC** : `pass` (au moins un identifiant SPF ou DKIM validé est **aligné** avec le domaine de `From`), `fail` (une politique existe mais rien n'est aligné), `none` (aucune politique DMARC publiée), `temperror`, `permerror`.

Les propriétés indiquent ce qui a été vérifié : `smtp.mailfrom` (l'adresse d'enveloppe testée par SPF), `header.d` et `header.s` (domaine et sélecteur de la signature DKIM), `header.from` (le domaine du `From` visible).

Autre point de la RFC 8601 : ne faites confiance qu'à l'en-tête portant le nom de **votre** serveur de réception (l'identifiant en tête de ligne). Un expéditeur peut en insérer un faux, et un `pass` n'est jamais une preuve de bonne foi : un spam peut passer DKIM s'il est signé par son expéditeur.

## Les autres champs utiles

- **`Return-Path`** : ajouté à la livraison finale, il reprend l'adresse d'enveloppe (`MAIL FROM`) vers laquelle partent les rebonds. C'est elle que SPF contrôle.
- **`From`** : l'adresse **affichée**. L'enveloppe et le `From` peuvent légitimement différer (envoi par un prestataire), mais c'est le premier réflexe en cas de doute.
- **`Message-ID`** : identifiant censé être unique au monde, avec un nom de domaine à droite du `@`. Un domaine incohérent avec l'expéditeur est un indice de plus, pas une preuve.
- **`DKIM-Signature`** : `d=` est le domaine signataire, `s=` le sélecteur. La clé publique se trouve dans le DNS, en TXT, à `s._domainkey.d` : avec `d=example.org` et `s=sel1`, on interroge `sel1._domainkey.example.org` (voir [les enregistrements DNS](/blog/enregistrements-dns-a-mx-cname-txt-expliques/) et [le diagnostic avec dig](/blog/diagnostic-dns-dig-nslookup-propagation-ttl/)).
- **`ARC-Seal`, `ARC-Message-Signature`, `ARC-Authentication-Results`** : posés par un intermédiaire (liste de diffusion, redirection) qui modifie le message et casse parfois SPF ou DKIM. ARC conserve la trace des résultats d'origine ; `cv=pass` signifie que la chaîne est valide. Ces champs aident à comprendre un `fail` hérité d'une redirection.

## Trois cas types

### Cas 1 : le message est classé en spam

```
Authentication-Results: mailbox.example.com;
       spf=softfail smtp.mailfrom=info@example.org;
       dkim=none;
       dmarc=fail header.from=example.org
```

Le serveur d'envoi (par exemple `198.51.100.77`) n'est pas dans le SPF du domaine, rien n'est signé et rien n'est aligné. **Conclusion** : soit un tiers se fait passer pour ce domaine, soit un expéditeur légitime n'a pas configuré son authentification. Si c'est un partenaire attendu, transmettez-lui ces lignes ; la démarche complète est dans [le diagnostic de délivrabilité](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/).

### Cas 2 : une usurpation

```
From: "Direction" <direction@example.com>
Return-Path: <x7@mail.example.net>
Authentication-Results: mailbox.example.com;
       spf=pass smtp.mailfrom=x7@mail.example.net;
       dkim=pass header.d=example.net;
       dmarc=fail header.from=example.com
```

SPF et DKIM passent, mais pour `example.net`, un domaine **autre** que celui affiché. Le message est authentique pour son vrai expéditeur, pas pour `example.com` : DMARC échoue faute d'alignement. **Conclusion** : usurpation du `From`. Ne répondez pas, signalez-le, et renforcez le domaine ciblé avec [SPF, DKIM et DMARC](/blog/spf-dkim-dmarc-expliques/) en `reject` et [les réglages de base de Microsoft 365 et Google Workspace](/blog/securiser-microsoft-365-google-workspace-reglages-de-base/). L'analyseur signale aussi un nom affiché qui contient une autre adresse, ou un `Reply-To` différent.

### Cas 3 : le message arrive avec des heures de retard

Lisez les `Received` de bas en haut et comparez les dates de deux lignes consécutives : le grand écart désigne le serveur qui a gardé le message. Un délai de quelques minutes entre deux tentatives évoque une file d'attente ou un refus temporaire (greylisting, limitation de débit) ; un délai de plusieurs heures dans votre propre chaîne pointe vers votre passerelle de filtrage. Attention aux fuseaux : le décalage (`+0100`) est écrit dans chaque date, et les horloges des serveurs ne sont pas toujours parfaitement réglées.

## Sources

- [RFC 8601 : Authentication-Results](https://www.rfc-editor.org/rfc/rfc8601.html)
- [RFC 5321 : SMTP (trace, Received, Return-Path)](https://www.rfc-editor.org/rfc/rfc5321.html)
- [RFC 5322 : format des messages (From, Message-ID, champs de trace)](https://www.rfc-editor.org/rfc/rfc5322.html)
- [RFC 6376 : DKIM (DKIM-Signature, d= et s=)](https://www.rfc-editor.org/rfc/rfc6376.html)
- [RFC 7208 : SPF (résultats)](https://www.rfc-editor.org/rfc/rfc7208.html)
- [RFC 9989 : DMARC (alignement et résultats)](https://www.rfc-editor.org/rfc/rfc9989.html)
- [RFC 8617 : ARC](https://www.rfc-editor.org/rfc/rfc8617.html)
- [IANA : Email Authentication Result Names](https://www.iana.org/assignments/email-auth/email-auth.xhtml)
- [Google : afficher l'original d'un message Gmail](https://support.google.com/mail/answer/29436)
- [Microsoft : afficher les en-têtes Internet dans Outlook](https://support.microsoft.com/en-us/office/view-internet-message-headers-in-outlook-cd039382-dc6e-4264-ac74-c048563d212c)
- [Mozilla : raccourcis clavier de Thunderbird](https://support.mozilla.org/en-US/kb/keyboard-shortcuts-thunderbird)

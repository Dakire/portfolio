---
title: 'Exchange Online : la fin de SMTP AUTH par mot de passe, et vos scanners, imprimantes et applications'
description: "Microsoft va désactiver par défaut l'envoi SMTP authentifié par mot de passe dans Exchange Online fin décembre 2026. Comment repérer ce qui en dépend et le migrer."
date: 2026-10-28
category: messagerie
tags: ['Exchange Online', 'Microsoft 365', 'SMTP', 'OAuth']
---

Dans beaucoup de petites structures, le courrier ne part pas seulement des boîtes des utilisateurs. Le scanner envoie les numérisations, l'imprimante ses alertes, le logiciel de gestion ses factures, un vieux script ses rapports de sauvegarde. Souvent, tout cela passe par **un compte Microsoft 365 et son mot de passe**, via le serveur `smtp.office365.com`. C'est exactement ce que Microsoft va fermer par défaut.

## Ce qui change, et quand

Le message du centre de messages **MC786329** (mis à jour le 27 janvier 2026) et le blog de l'équipe Exchange décrivent le calendrier actuel pour l'authentification **Basic** (identifiant et mot de passe) du « client SMTP submission », aussi appelé **SMTP AUTH** :

- jusqu'en **décembre 2026**, rien ne change ;
- à la **fin de décembre 2026**, l'authentification Basic pour SMTP AUTH sera **désactivée par défaut** pour les tenants existants, mais un administrateur pourra la réactiver ;
- les tenants créés **après décembre 2026** ne l'auront pas du tout par défaut ;
- la **date de suppression définitive** sera annoncée au second semestre 2027 ;
- les dates précédentes (mars-avril 2026) sont suspendues.

Deux précisions. Ce qui disparaît, c'est le **mot de passe** : SMTP AUTH avec **OAuth 2.0** reste pris en charge. Et ce calendrier a déjà bougé plusieurs fois : relisez [le billet de l'équipe Exchange](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835) avant d'agir : Microsoft ne précise pas le jour exact de la bascule de fin décembre, à confirmer sur ce billet.

Dans tous les cas, ne comptez pas sur le report : la documentation Microsoft sur l'envoi depuis des appareils recommande déjà de ne plus utiliser Basic pour cet usage.

## Étape 1 : repérer ce qui envoie du courrier

Le meilleur point de départ est le rapport **SMTP AUTH Clients Submission** du centre d'administration Exchange (dans les rapports de flux de messagerie ; l'emplacement exact peut changer, cherchez son nom). Selon le message MC786329, il indique, avec une colonne « protocole d'authentification », si chaque client envoie en Basic ou en OAuth. C'est la liste de ce qui cassera.

Complétez avec un inventaire côté configuration. Ces commandes viennent de la [documentation SMTP AUTH de Microsoft Learn](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission), après connexion à Exchange Online PowerShell :

```powershell
Get-TransportConfig | Format-List SmtpClientAuthenticationDisabled

$Users = Get-CASMailbox -ResultSize unlimited
$Users | where {$_.SmtpClientAuthenticationDisabled -eq $false}
```

La première affiche le réglage de l'organisation (`True` : SMTP AUTH désactivé). La seconde liste les boîtes où SMTP AUTH est **explicitement activé**. Attention : cela montre qui est autorisé, pas qui envoie réellement. Une boîte qui suit le réglage de l'organisation n'apparaît pas dans cette liste. Le rapport reste donc la référence.

Pensez aussi à demander aux personnes : « quel appareil ou quel logiciel envoie un e-mail tout seul ? » Une boîte de type `scan@` ou `noreply@` est un bon indice.

## Étape 2 : choisir la bonne destination pour chaque usage

D'après la page Microsoft [Envoyer du courrier depuis un appareil ou une application](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365), les options sont les suivantes.

**SMTP AUTH avec OAuth 2.0.** Si l'application ou l'appareil le gère, c'est le changement le plus simple. Beaucoup d'anciens scanners ne savent pas faire. Il faut aussi TLS 1.2 minimum, port 587 de préférence : le port 465 n'est pas pris en charge.

**High Volume Email (HVE).** Pour les envois **vers des destinataires internes uniquement** (alertes, notifications, numérisations vers un collègue). On crée un compte HVE sans boîte aux lettres ni licence, et l'appareil se connecte à `smtp.hve.mx.microsoft` en port 587, avec TLS. Le compte s'authentifie par OAuth ou par mot de passe, et ne dépend pas du réglage SMTP AUTH de l'organisation. Le service est facturé à l'usage (paiement à l'usage Microsoft 365, avec une stratégie de facturation liée à un abonnement Azure) : sans cette stratégie, le compte ne peut pas envoyer. Limites : 50 destinataires par message, 10 Mo.

**Relais SMTP par connecteur.** Pour les appareils qui doivent écrire à l'extérieur ou ne gèrent pas l'authentification moderne. Un connecteur entrant, authentifié par certificat TLS (recommandé) ou par adresse IP publique fixe et non partagée, permet d'envoyer en port 25 vers le point MX de votre domaine, avec n'importe quelle adresse du domaine, sans boîte ni licence. Il faut un enregistrement SPF correct (voir [SPF, DKIM et DMARC expliqués](/blog/spf-dkim-dmarc-expliques/)), et ce n'est pas utilisable depuis un service hébergé chez un tiers.

**Un serveur de messagerie interne**, si vous en avez un, comme relais.

**Azure Communication Services Email**, que Microsoft cite pour envoyer à des destinataires internes et externes.

**Microsoft Graph**, pour un script ou un logiciel que vous maîtrisez : l'[API sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail) évite SMTP.

Un **envoi direct** (Direct Send) existe aussi, mais il n'arrive qu'aux boîtes Microsoft 365 de votre organisation, sans authentification. Microsoft le réserve aux cas avancés et prépare une option pour le désactiver par défaut : à éviter en dernier recours.

## Un tri rapide par type d'usage

- **Scanner ou imprimante qui envoie à vos collègues** : HVE, ou relais par connecteur si l'appareil a une IP fixe.
- **Appareil qui doit écrire à des clients** : relais par connecteur, ou un autre service.
- **ERP ou logiciel de gestion** : OAuth si l'éditeur le propose (demandez-lui) ; sinon relais ou HVE. Pensez à la mise à jour du logiciel.
- **Script maison** : Graph, ou SMTP avec OAuth.

## Étape 3 : tester, puis surveiller

1. Migrez d'abord un appareil, vérifiez l'arrivée du message et l'absence de spam.
2. Contrôlez que l'expéditeur affiché reste valable (un envoi « en tant que » demande l'autorisation _Send As_). Voir [délivrabilité : diagnostiquer les e-mails en spam](/blog/delivrabilite-diagnostiquer-mails-spam-rejetes/).
3. Revenez au rapport après quelques jours : il ne doit plus rester de client en Basic.
4. Ne réactivez pas SMTP AUTH pour toute l'organisation « pour être tranquille » : limitez-le aux boîtes qui en ont besoin. Voir aussi [sécuriser Microsoft 365 et Google Workspace](/blog/securiser-microsoft-365-google-workspace-reglages-de-base/) et l'aide-mémoire [PowerShell Microsoft 365](/cheatsheets/powershell-m365/).

Même mois, même éditeur, autre sujet : [le Patch Tuesday d'octobre 2026](/blog/patch-tuesday-octobre-2026-pme/).

## Sources

- [Billet de l'équipe Exchange : calendrier de dépréciation de SMTP AUTH Basic](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835)
- [MC786329 : copie du message du centre de messages](https://mc.merill.net/message/MC786329)
- [Microsoft Learn : activer ou désactiver SMTP AUTH dans Exchange Online](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission)
- [Microsoft Learn : configurer un appareil ou une application pour envoyer du courrier](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)
- [Microsoft Learn : High Volume Email pour Microsoft 365](https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/high-volume-mails-m365)
- [Microsoft Learn : authentifier une connexion IMAP, POP ou SMTP avec OAuth](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth)
- [Microsoft Learn : Graph, envoyer un message (sendMail)](https://learn.microsoft.com/en-us/graph/api/user-sendmail)

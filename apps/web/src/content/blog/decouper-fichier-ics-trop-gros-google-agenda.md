---
title: 'Découper un fichier ICS trop gros pour Google Agenda'
seoTitle: 'Découper un fichier ICS trop gros pour l’import'
description: 'Pourquoi un fichier .ics est refusé à l’import, comment le découper sans casser les séries récurrentes, et quelle méthode choisir selon le cas.'
summary: 'Un export de calendrier .ics refusé à l’import : la cause probable, la manière de découper sans séparer une série de ses exceptions, et le choix entre nombre d’événements, taille, année ou mois.'
date: 2026-11-20
category: messagerie
tags: ['Calendrier', 'ICS', 'Google Agenda', 'Import', 'iCalendar']
---

Un export de calendrier fait des années d'événements, et l'import échoue. Le fichier est un `.ics` (iCalendar), un simple texte : on peut donc le découper, à condition de couper au bon endroit.

## Pourquoi l'import est refusé

D'après la page d'aide de Google Agenda sur les problèmes d'importation, le fichier ne doit pas dépasser 1 Mo. Cette page d'aide date de plusieurs années : vérifiez la limite actuelle sur [l'aide Google](https://support.google.com/calendar/answer/45654) avant de décider quoi faire. L'aide propose deux solutions : réexporter une plage de dates plus courte depuis l'application d'origine, ou séparer le fichier en plusieurs fichiers plus petits.

Je ne connais pas de limite équivalente documentée pour les autres calendriers : si l'import échoue ailleurs, le message d'erreur reste la meilleure piste.

## Où couper un fichier ICS

Un fichier `.ics` contient un calendrier (`VCALENDAR`) qui enferme une suite d'événements (`VEVENT`). On ne coupe qu'entre deux événements, jamais au milieu, et chaque fichier doit rester un calendrier complet avec son en-tête et son pied.

Un cas demande de l'attention : les événements récurrents. Une série (`RRULE`) et ses exceptions (une occurrence déplacée ou annulée, repérée par `RECURRENCE-ID`) partagent le même identifiant (`UID`), défini par la [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545). Si la série part dans un fichier et ses exceptions dans un autre, le calendrier de destination les traite comme des événements séparés. Une série et ses exceptions doivent donc rester dans le même fichier.

## Quelle méthode choisir

Mon [découpeur de fichier ICS](/outils/ics-decouper/) garde les séries entières et propose six découpages :

- **Par taille**, quand l'import impose une limite : on fixe la taille maximale par fichier. Un événement plus gros que la limite reçoit son propre fichier.
- **Par nombre d'événements**, pour des lots réguliers.
- **Par année**, pour archiver ou importer une période à la fois.
- **Par mois**, quand une année reste trop lourde.
- **Un événement par fichier**, pour isoler des événements précis.
- **Par calendrier**, quand le fichier contient plusieurs calendriers mis bout à bout.

Le fichier est lu et découpé dans votre navigateur : il reste sur votre ordinateur.

## Importer les morceaux

Chaque fichier s'importe séparément. Dans Google Agenda, l'import se fait depuis la version web sur ordinateur, dans les paramètres. Si l'export est une archive ZIP, extrayez d'abord les fichiers `.ics` : un par calendrier.

Avant d'importer, choisissez bien le calendrier de destination. Pour retrouver les événements d'un calendrier source absents d'un calendrier de destination, il y a l'[outil de comparaison ICS](/outils/ics-comparer/).

## À faire, dans l'ordre

1. Réexportez une plage de dates plus courte si l'application d'origine le permet.
2. Sinon, découpez par taille, avec une marge sous la limite de l'import.
3. Importez les fichiers un par un, puis comptez les événements du calendrier de destination.

---
title: 'Calcul de masque et CIDR expliqués : /24, /27, sous-réseaux'
description: 'Comprendre la notation CIDR (/24, /27…), le masque décimal, les adresses utilisables, le découpage en sous-réseaux, les cas /31 et /32 et les adresses privées, avec des calculs vérifiés.'
date: 2026-10-28
category: dns
tags: ['Réseau', 'CIDR', 'Masque', 'Sous-réseau', 'IPv4', 'RFC 1918']
---

« Mets le serveur en 192.168.1.130/27 » : tant qu'on ne sait pas lire ce `/27`, difficile de savoir quelles machines se parlent directement, ni où s'arrête le réseau. Voici la méthode, avec des calculs qu'on peut refaire à la main (et vérifier avec le [calculateur réseau](/outils/calculateur-reseau/) du site).

## Ce que veut dire /24

Une adresse IPv4 fait 32 bits. La notation **CIDR** (RFC 4632) accole à l'adresse un nombre : le **préfixe**, c'est-à-dire le nombre de bits, en partant de la gauche, qui désignent le réseau. Les bits restants désignent la machine dans ce réseau.

- `/24` : 24 bits de réseau, 8 bits de machine ;
- `/27` : 27 bits de réseau, 5 bits de machine.

Le **masque** est la même information en décimal pointé : les bits de réseau à 1, les autres à 0. Pour `/24`, 11111111.11111111.11111111.00000000, soit `255.255.255.0`. Pour `/27`, le dernier octet vaut 11100000, soit 224 : `255.255.255.224`.

## Adresses disponibles

Avec `h` bits de machine, un réseau contient 2^h adresses. Deux sont réservées :

- la première, l'**adresse réseau** (tous les bits de machine à 0) ;
- la dernière, l'**adresse de diffusion** ou broadcast (tous à 1).

Il reste donc **2^h − 2 adresses utilisables** pour des machines (routeur compris).

| Préfixe | Masque          | Adresses | Utilisables   |
| ------- | --------------- | -------- | ------------- |
| /16     | 255.255.0.0     | 65 536   | 65 534        |
| /20     | 255.255.240.0   | 4 096    | 4 094         |
| /22     | 255.255.252.0   | 1 024    | 1 022         |
| /24     | 255.255.255.0   | 256      | 254           |
| /25     | 255.255.255.128 | 128      | 126           |
| /26     | 255.255.255.192 | 64       | 62            |
| /27     | 255.255.255.224 | 32       | 30            |
| /28     | 255.255.255.240 | 16       | 14            |
| /29     | 255.255.255.248 | 8        | 6             |
| /30     | 255.255.255.252 | 4        | 2             |
| /31     | 255.255.255.254 | 2        | voir plus bas |
| /32     | 255.255.255.255 | 1        | voir plus bas |

## Exemple 1 : 192.168.1.130/27

Le masque est `255.255.255.224`. Les blocs ont une taille de 256 − 224 = **32** adresses, donc le dernier octet tombe dans des blocs qui commencent à 0, 32, 64, 96, 128, 160… L'adresse 130 est dans le bloc qui commence à 128.

- adresse réseau : `192.168.1.128` ;
- diffusion : `192.168.1.159` (128 + 32 − 1) ;
- adresses utilisables : `192.168.1.129` à `192.168.1.158`, soit 30 machines.

## Exemple 2 : 10.20.30.77/20

Le masque est `255.255.240.0` : c'est le troisième octet qui est découpé. Taille de bloc : 256 − 240 = 16, en 3e octet. 30 tombe dans le bloc qui commence à 16 (16, 32, 48…).

- adresse réseau : `10.20.16.0` ;
- diffusion : `10.20.31.255` ;
- utilisables : `10.20.16.1` à `10.20.31.254`, soit 4 094 machines.

## Découper un réseau en sous-réseaux

Chaque bit de préfixe ajouté **divise par deux** le réseau. Pour couper `192.168.10.0/24` en quatre, on passe de `/24` à `/26` (2 bits de plus, 2² = 4 sous-réseaux de 64 adresses) :

| Sous-réseau         | Utilisables                         | Diffusion        |
| ------------------- | ----------------------------------- | ---------------- |
| `192.168.10.0/26`   | `192.168.10.1` à `192.168.10.62`    | `192.168.10.63`  |
| `192.168.10.64/26`  | `192.168.10.65` à `192.168.10.126`  | `192.168.10.127` |
| `192.168.10.128/26` | `192.168.10.129` à `192.168.10.190` | `192.168.10.191` |
| `192.168.10.192/26` | `192.168.10.193` à `192.168.10.254` | `192.168.10.255` |

Pour des besoins différents (un réseau de 50 postes, un de 20, une liaison entre deux routeurs), on découpe en tailles variables, en commençant par le plus grand. Prévoyez toujours de la marge : renuméroter un réseau coûte plus cher qu'un `/24` un peu large.

## /31 et /32

- **/30** : 4 adresses, 2 utilisables. C'était la taille classique d'une liaison point à point entre deux équipements.
- **/31** : 2 adresses seulement. Sur une liaison point à point, la RFC 3021 permet d'utiliser les deux comme adresses de machines (pas d'adresse réseau ni de diffusion), ce qui économise la moitié des adresses. Les deux extrémités doivent prendre en charge ce mode.
- **/32** : une seule adresse, désignant une machine précise. On la rencontre pour une adresse de loopback, une route vers un hôte unique ou une règle de pare-feu visant une seule machine.

## Adresses privées (RFC 1918)

Trois plages sont réservées aux réseaux internes et ne sont pas routées sur Internet :

| Plage                         | Notation         |
| ----------------------------- | ---------------- |
| 10.0.0.0 à 10.255.255.255     | `10.0.0.0/8`     |
| 172.16.0.0 à 172.31.255.255   | `172.16.0.0/12`  |
| 192.168.0.0 à 192.168.255.255 | `192.168.0.0/16` |

Piège fréquent : la plage `172.16.0.0/12` va jusqu'à `172.31`, pas au-delà. `172.32.x.x` est une adresse publique. Autre piège classique : deux sites reliés par VPN qui utilisent tous deux `192.168.1.0/24` ne peuvent pas se joindre sans NAT ; choisissez des plages distinctes dès le départ.

## Vérifier vite

Trois réflexes pour contrôler un résultat : l'adresse réseau est un multiple de la taille du bloc ; la diffusion est juste avant le bloc suivant ; un hôte et sa passerelle doivent être dans le même sous-réseau. Le [calculateur réseau](/outils/calculateur-reseau/) donne masque, plage et nombre d'hôtes pour n'importe quel préfixe. D'autres commandes réseau sont dans l'[aide-mémoire réseau](/cheatsheets/reseau/). Côté nommage, les [enregistrements DNS expliqués](/blog/enregistrements-dns-a-mx-cname-txt-expliques/) font le lien entre adresses et noms.

## Sources

- [RFC 4632 : CIDR, plan d'adressage et d'agrégation](https://www.rfc-editor.org/rfc/rfc4632)
- [RFC 1918 : adressage des réseaux privés](https://www.rfc-editor.org/rfc/rfc1918)
- [RFC 3021 : préfixes de 31 bits sur les liaisons point à point](https://www.rfc-editor.org/rfc/rfc3021)

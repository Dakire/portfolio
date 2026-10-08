---
title: Touches BIOS/UEFI et boot menu par marque de PC
description: Tableau de recherche des touches pour entrer dans le BIOS/UEFI et ouvrir le menu de démarrage : Dell, HP, Lenovo, ASUS, Acer, MSI, Surface, Mac et autres.
date: 2026-10-03
script: /js/table-filter.js
---

Pour démarrer sur une clé USB, réinstaller Windows ou modifier un réglage (Secure Boot, TPM, ordre de démarrage), il faut entrer dans le **BIOS/UEFI** ou ouvrir le **menu de démarrage** (« boot menu »). La touche à presser **change selon le constructeur, et parfois selon la série**. Voici un tableau avec recherche : tapez une marque ou une série (par exemple `thinkpad`, `dell`, `rog`).

<input type="search" data-filter-table aria-label="Rechercher une marque ou un modèle" placeholder="Rechercher une marque ou un modèle (ex. thinkpad, dell, msi)…" hidden>

| Marque | Séries / modèles | BIOS / UEFI | Menu de démarrage | Remarques |
|---|---|---|---|---|
| Acer | Aspire, Swift, Nitro, Predator, TravelMate, Extensa | F2 (Suppr sur certains PC fixes) | F12 | Sur certains modèles, il faut d'abord activer « F12 Boot Menu » dans le BIOS |
| ASUS | VivoBook, ZenBook, ExpertBook, portables en général | F2 (maintenue tout en appuyant sur Alimentation) | Échap maintenue tout en appuyant sur Alimentation, relâchée quand le menu apparaît | Procédure indiquée par ASUS pour les portables |
| ASUS | ROG, TUF Gaming (portables) | F2 | Échap maintenue au démarrage | Voir la ligne portables ASUS |
| ASUS | Cartes mères et PC fixes | Suppr (ou F2) | F8 | F8 ouvre le menu de démarrage pendant le démarrage |
| Dell | Latitude, XPS, Inspiron, Vostro, Precision, OptiPlex | F2 | F12 | Taper la touche à plusieurs reprises dès l'apparition du logo |
| HP | Pavilion, EliteBook, ProBook, ZBook, Omen, Envy, Spectre | Échap puis F10 | Échap puis F9 | Échap ouvre le menu de démarrage HP (« Startup Menu ») ; F2 ouvre les diagnostics UEFI |
| Lenovo | ThinkPad | Entrée puis F1 (ou F1 direct) | Entrée puis F12 (ou F12 direct) | Entrée ouvre le menu d'interruption de démarrage |
| Lenovo | ThinkCentre, ThinkStation | F1 | F12 | |
| Lenovo | IdeaPad, Yoga, Legion (portables) | F2 (ou Fn + F2) | F12 (ou Fn + F12) | Bouton « Novo » (petit trou près de l'alimentation) sur beaucoup de modèles : ouvre un menu avec BIOS et boot menu |
| MSI | Cartes mères, PC fixes, portables | Suppr | F11 | |
| Gigabyte, Aorus | Cartes mères et PC fixes | Suppr | F12 | |
| Gigabyte, Aorus | Portables | F2 | F12 | |
| ASRock | Cartes mères | F2 ou Suppr | F11 | |
| Microsoft | Surface Pro 6 et suivants, Laptop 2 et suivants, Go 2 et suivants, Book 2 et 3 | Maintenir Volume + puis appuyer sur Alimentation | Maintenir Volume − puis appuyer sur Alimentation | Éteindre complètement la Surface avant. Pour l'UEFI, relâcher quand le logo disparaît ; pour l'USB, relâcher quand les points tournent sous le logo. Les modèles plus anciens diffèrent |
| Apple | Mac Intel | Pas de BIOS | Maintenir Option (⌥) au démarrage | Cmd + R pour la récupération macOS |
| Apple | Mac Apple Silicon (M1 et suivants) | Pas de BIOS | Maintenir le bouton d'alimentation jusqu'aux options de démarrage | |
| Samsung | Galaxy Book, portables | F2 | F10 (ou Échap selon les modèles) | Indiqué par le support Samsung |
| Toshiba, Dynabook | Satellite, Tecra, Portégé | F2 (ou F1) | F12 | |
| Fujitsu | Lifebook, Esprimo | F2 | F12 | |
| LG | gram | F2 | F10 | |
| Huawei | MateBook | F2 | F12 | MateBook E et certains MateBook (HZ) : éteint, appuyer sur Alimentation + Volume + |
| Framework | Framework Laptop | F2 | F12 | |
| Intel | NUC | F2 | F10 | |

## Si la touche ne répond pas

Les PC modernes démarrent si vite que la fenêtre de temps pour presser la touche est très courte, surtout avec un SSD et le « démarrage rapide » activé. Plusieurs solutions :

- **Taper la touche en rafale** dès l'allumage, au lieu de la maintenir.
- **Éteindre complètement** le PC plutôt que de le redémarrer : avec le démarrage rapide de Windows, un « arrêt » n'est pas un arrêt complet. Maintenir **Maj** en cliquant sur « Arrêter » force un arrêt complet.
- Sur un portable, essayer avec la touche **Fn** (`Fn + F2`) quand les touches de fonction pilotent le volume ou la luminosité par défaut.
- Utiliser un **clavier filaire** branché directement sur le PC (certains claviers sans fil ou hubs ne sont pas reconnus assez tôt).

## Entrer dans l'UEFI depuis le système

Sur un PC démarrant en UEFI, on peut demander au système de redémarrer directement dans le firmware, sans deviner la touche.

**Windows 11 (interface)** : Paramètres > Système > Récupération > Démarrage avancé > Redémarrer maintenant, puis Dépannage > Options avancées > Paramètres du micrologiciel UEFI.

**Windows 10 (interface)** : Paramètres > Mise à jour et sécurité > Récupération > Démarrage avancé > Redémarrer maintenant, puis la même suite d'options.

**Windows (ligne de commande)**, dans une invite de commandes en administrateur :

```
shutdown /r /fw /t 0
```

**Linux (systemd)** :

```
systemctl reboot --firmware-setup
```

## Menu de démarrage ou BIOS : lequel choisir ?

- Le **menu de démarrage** (boot menu) sert à choisir *une seule fois* le périphérique de démarrage : une clé USB d'installation, un outil de diagnostic. C'est le plus simple pour réinstaller un système.
- Le **BIOS/UEFI** donne accès aux réglages permanents : ordre de démarrage, **Secure Boot**, **TPM**, virtualisation, mode SATA, etc. C'est là qu'on active par exemple le TPM 2.0 requis par Windows 11 (voir [la fin de support de Windows 10](/blog/fin-support-windows-10-passer-a-windows-11/)).

## Avertissements

- Ces touches ont été recoupées avec des sources en ligne, dont les pages d'assistance de [ASUS](https://www.asus.com/support/faq/1008829), [Samsung](https://www.samsung.com/us/support/answer/ANS10002820/), Dell, Lenovo, Acer, Microsoft, Apple, LG, Huawei, Framework et Intel. Ce sont les plus courantes, mais **elles peuvent varier selon le modèle exact et l'année** : un constructeur peut changer de touche d'une génération à l'autre. En cas d'échec, consultez le manuel ou la page de support du modèle, ou essayez les autres touches de la ligne (F2, Suppr, F12, Échap).
- Une mauvaise modification dans le BIOS peut empêcher le PC de démarrer. Notez les réglages d'origine avant de les changer.
- Sur un PC géré par une entreprise, l'accès au BIOS peut être **protégé par un mot de passe**. Ne cherchez pas à le contourner sans autorisation : adressez-vous à votre service informatique.

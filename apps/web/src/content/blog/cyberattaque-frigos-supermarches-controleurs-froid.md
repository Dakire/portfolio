---
title: "Cyberattaque des frigos de supermarchés : ce que l'on sait, et les leçons"
description: 'Dans la nuit du 11 au 12 octobre 2026, des centaines de supermarchés ont vu leurs régulateurs de froid piratés. Équipements, cause, pertes, et mesures pour tout objet connecté.'
date: 2026-10-28
category: actualites
tags: ['Cyberattaque', 'IoT', 'Fin de vie']
---

Dans la nuit du **11 au 12 octobre 2026**, des pirates ont pris la main à distance sur les régulateurs de froid de plusieurs centaines de supermarchés français : consignes de température modifiées, alarmes désactivées, produits frais et surgelés à jeter. L'attaque n'a pas été revendiquée. Deux semaines plus tard, on sait ce qui a été touché et pourquoi c'était possible. C'est un cas d'école pour toute structure qui a des objets connectés, même une petite.

## Ce qui s'est passé

- **Enseignes touchées**, confirmées par les distributeurs à l'AFP selon franceinfo : au moins 300 points de vente Intermarché/Netto, moins d'une centaine de magasins Coopérative U, 80 supermarchés Carrefour, une trentaine de Monoprix et plusieurs magasins E.Leclerc.
- **Mode opératoire** : les pirates ont atteint à distance les systèmes de régulation du fabricant danois **Danfoss**, puis ceux de **Dixell**, et ont modifié les consignes de température. Les seuils d'alarme ayant été changés eux aussi, la dérive n'a pas été détectée tout de suite.
- **Effets** : des températures très élevées dans certains magasins (de 50 à 80 °C selon les sources, chiffres non vérifiés), des équipements abîmés, des denrées détruites. Un responsable de Carrefour Market à Rennes a vu ses congélateurs programmés à 95 °C dans son application.
- **Pertes** : les estimations varient fortement, de « plusieurs millions d'euros » (franceinfo) à plusieurs dizaines de millions (The Record), soit 200 000 à 300 000 € par supermarché selon Linéaires, hors dégâts sur les équipements. Les chiffres sont provisoires.
- **Enquête** : le parquet de Paris a ouvert une enquête confiée à l'Ofac, et le Premier ministre a demandé à l'ANSSI de se saisir du dossier.

## Les équipements concernés

Le bulletin **CERTFR-2026-ALE-012** du CERT-FR, publié le 12 octobre et mis à jour les 13 et 16, cite :

- les contrôleurs **Danfoss** des séries **AK-SC** et **AK-SM** ;
- les superviseurs **Copeland xweb** ;
- les superviseurs **Dixell xweb**.

Selon Danfoss, la majorité des appareils touchés sont **anciens et en fin de vie** (notamment les modèles AK-SM 800 et AK-SC 355), et ne reçoivent plus de mises à jour de sécurité. D'autres n'étaient simplement pas à jour.

## Pourquoi c'était possible

Le point commun est un classique : des interfaces de gestion **accessibles depuis Internet**, sur du matériel qui n'est plus corrigé. Le CERT-FR le dit sans ambiguïté : exposer une interface de gestion sur Internet est contraire aux bonnes pratiques, et un équipement en fin de vie, sans correctif et exposé, a une très forte probabilité d'être compromis.

Les experts ne s'accordent pas sur la sophistication de l'attaque. L'un évoque une mise à jour non appliquée et un mot de passe très simple (une hypothèse non vérifiée), un autre des failles documentées dont les plus récentes datent d'avril 2025, un troisième juge l'opération « d'une certaine sophistication » vu le nombre d'appareils touchés en même temps. Ce qui est établi : l'origine exacte de l'intrusion reste à déterminer.

## Que faire, même avec un seul appareil connecté

Le CERT-FR détaille la marche à suivre pour les équipements concernés. Elle s'applique à tout objet connecté (régulateur de froid, alarme, caméra, automate, onduleur, imprimante) :

1. **Retirer l'exposition à Internet**, y compris pour les appareils qui ont une adresse IP publique. Avant de couper la remontée de données vers le prestataire, vérifier les clauses de son assurance.
2. **Passer par un VPN ou un réseau protégé** pour l'accès à distance. Filtrer les adresses IP du prestataire sur un pare-feu n'est qu'une solution d'urgence, pas durable.
3. **Mettre à jour le firmware**, activer le mode de sécurité le plus strict du constructeur (« Strict » chez Danfoss) et **changer les mots de passe par défaut**.
4. **Vérifier la configuration** après un incident : ici, notamment les plages de dégivrage.
5. **Ne pas se contenter d'une réinitialisation d'usine** sur un appareil compromis : elle supprime les persistances, mais l'appareil reste vulnérable et sera probablement attaqué de nouveau.
6. **Remplacer le matériel en fin de vie.** Même logique que pour [la fin de Windows 10](/blog/fin-support-windows-10-passer-a-windows-11/) : un équipement qui ne reçoit plus de correctifs ne peut pas rester exposé.

Deux ajouts de bon sens, qui sont mon avis et non une consigne officielle : **inventorier ce qui est connecté** (on ne protège pas ce qu'on ne connaît pas), et garder une **sonde de température indépendante** avec sa propre alarme, qui ne passe pas par le même réseau que le régulateur.

## Un point à retenir sur la réglementation

Le règlement européen sur la cyber-résilience (CRA) n'obligera pas les fabricants à corriger ce type de matériel. D'après The Record, qui cite l'ENISA, les obligations de traitement des vulnérabilités ne valent que pendant la période de support définie par le fabricant, et ne s'appliquent pas aux produits mis sur le marché avant le 11 décembre 2027 ou dont le support est terminé. Les contrôleurs attaqués entrent dans ce cas. En pratique, la responsabilité de les isoler ou de les remplacer reste à l'exploitant.

## À retenir

- Le matériel qui n'est plus corrigé et qui est joignable depuis Internet finit par être pris.
- Un objet connecté oublié (froid, alarme, caméra) est une porte d'entrée comme une autre.
- Le coût d'un remplacement ou d'un VPN est faible comparé à la perte d'un stock.

## Sources

- [CERT-FR : bulletin CERTFR-2026-ALE-012, incident sur les contrôleurs à distance d'installations de réfrigération](https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/)
- [franceinfo : un piratage « pas si sophistiqué que ça »](https://www.franceinfo.fr/internet/securite-sur-internet/cyberattaques/un-piratage-pas-si-sophistique-que-ca-ce-que-l-on-sait-de-la-cyberattaque-qui-a-fait-monter-en-temperature-les-frigos-de-supermarches_8235061.html)
- [Process Alimentaire : cyberattaque des supermarchés, des contrôleurs de froid vulnérables](https://www.processalimentaire.com/procedes/cyberattaque-des-supermarches-des-controleurs-de-froid-vulnerables)
- [The Record : la loi européenne n'imposera pas de correctifs pour les frigos de l'attaque française](https://therecord.media/eu-cyber-law-wont-force-fixes-for-fridges-in-french-attack)

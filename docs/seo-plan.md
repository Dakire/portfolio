# Plan SEO : requêtes ciblées, pages, suivi

**Mis à jour le 6 novembre 2026.** Aucun classement n'est garanti. Les **volumes de recherche ne sont pas renseignés** : sans export de la Search Console ou d'un outil de mots-clés fourni par Guillaume, chaque volume est « à vérifier ». Les requêtes ci-dessous viennent du vocabulaire réel des sujets (termes officiels, questions qu'on pose en support), pas de mesures.

Légende de l'état : **en ligne** (page optimisée pour la requête), **partiel** (page existante, angle ou maillage à renforcer), **prévu** (page à créer), **brouillon**.

## 1. Carte des requêtes

### Fin de Windows 10

| Requête                                                 | Type       | Page cible                                                  | État     |
| ------------------------------------------------------- | ---------- | ----------------------------------------------------------- | -------- |
| fin windows 10 (principale)                             | large      | Hub « Fin de Windows 10 » (prévu) puis article ci-dessous   | prévu    |
| fin du support windows 10 / date fin windows 10         | question   | `/blog/fin-support-windows-10-passer-a-windows-11/`         | en ligne |
| windows 10 esu / mises à jour de sécurité étendues prix | secondaire | même article (section ESU)                                  | en ligne |
| passer de windows 10 à windows 11                       | secondaire | même article                                                | en ligne |
| pc incompatible windows 11 / tpm 2.0 secure boot        | secondaire | article + `/cheatsheets/bios-uefi/`                         | partiel  |
| windows 10 end of support (EN)                          | large      | `/en/blog/windows-10-end-of-support-upgrade-to-windows-11/` | en ligne |

### GAM et Google Workspace en ligne de commande

| Requête                                     | Type          | Page cible                                 | État                                                                                                                              |
| ------------------------------------------- | ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| gam cheatsheet / gam commandes (principale) | outil         | `/cheatsheets/gam/`                        | en ligne                                                                                                                          |
| aide-mémoire gam / gam google workspace     | secondaire    | `/cheatsheets/gam/`                        | en ligne                                                                                                                          |
| gam delegate / gam déléguer boîte gmail     | longue traîne | `/cheatsheets/gam/?q=deleguer` (recherche) | partiel : la recherche répond, mais l'URL avec `?q=` n'est pas indexée ; un article « GAM : 15 commandes courantes » est envisagé |
| gam create user / gam print users           | longue traîne | `/cheatsheets/gam/`                        | partiel (contenu chargé par JavaScript pour GAM, voir docs/reference.md)                                                          |
| installer gam7                              | question      | à créer (article d'installation)           | prévu                                                                                                                             |

### Secure Boot

| Requête                                             | Type      | Page cible                                                | État     |
| --------------------------------------------------- | --------- | --------------------------------------------------------- | -------- |
| secure boot certificat 2011 expiration (principale) | actualité | `/blog/secure-boot-certificats-2011-expiration-verifier/` | en ligne |
| vérifier secure boot / confirm-securebootuefi       | question  | même article + cheatsheet Windows 11                      | en ligne |
| activer secure boot bios                            | question  | `/cheatsheets/bios-uefi/`                                 | partiel  |
| faille uefi pxe                                     | actualité | `/blog/faille-uefi-pxe-edk2-cve-2026-97631/`              | en ligne |
| secure boot (large)                                 | large     | Hub « Secure Boot » (prévu)                               | prévu    |

### Patch Tuesday

| Requête                                 | Type      | Page cible                                     | État     |
| --------------------------------------- | --------- | ---------------------------------------------- | -------- |
| patch tuesday octobre 2026 (principale) | actualité | `/blog/patch-tuesday-octobre-2026-pme/`        | en ligne |
| patch tuesday novembre 2026             | actualité | à écrire après le 10 novembre 2026             | prévu    |
| patch tuesday (large) / calendrier      | large     | Hub « Patch Tuesday » (liste mensuelle, prévu) | prévu    |

### SMTP AUTH et Exchange Online

| Requête                                                       | Type          | Page cible                                        | État     |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------- | -------- |
| smtp auth exchange online fin (principale)                    | actualité     | `/blog/exchange-online-smtp-auth-basic-fin-2026/` | en ligne |
| scanner smtp office 365 / imprimante envoi mail microsoft 365 | longue traîne | même article                                      | en ligne |
| basic authentication exchange online 2026                     | secondaire    | même article                                      | en ligne |

### Windows Server 2016

| Requête                                      | Type       | Page cible                                            | État     |
| -------------------------------------------- | ---------- | ----------------------------------------------------- | -------- |
| fin support windows server 2016 (principale) | actualité  | `/blog/fin-support-windows-server-2016-janvier-2027/` | en ligne |
| windows server 2016 esu / azure arc          | secondaire | même article                                          | en ligne |
| migrer windows server 2016 vers 2025         | question   | même article                                          | partiel  |

### TLS

| Requête                                           | Type       | Page cible                                             | État     |
| ------------------------------------------------- | ---------- | ------------------------------------------------------ | -------- |
| durée de vie certificat tls 47 jours (principale) | actualité  | `/blog/certificats-tls-duree-de-vie-200-100-47-jours/` | en ligne |
| certificat ssl 200 jours / 2029                   | secondaire | même article                                           | en ligne |

### DNS

| Requête                                    | Type     | Page cible                                                                    | État     |
| ------------------------------------------ | -------- | ----------------------------------------------------------------------------- | -------- |
| enregistrements dns expliqués (principale) | large    | `/blog/enregistrements-dns-a-mx-cname-txt-expliques/`                         | en ligne |
| vérifier dns en ligne / dns lookup         | outil    | `/outils/dns/`                                                                | en ligne |
| propagation dns                            | outil    | `/outils/propagation-dns/`                                                    | en ligne |
| nslookup dig commande                      | question | `/blog/diagnostic-dns-dig-nslookup-propagation-ttl/` + `/cheatsheets/reseau/` | en ligne |
| spf dkim dmarc                             | large    | `/blog/spf-dkim-dmarc-expliques/`                                             | en ligne |

### Active Directory, Intune, PowerShell, sécurité, IA

| Sujet            | Requête principale                        | Page cible                                                         | État                          |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| Active Directory | commandes powershell active directory     | `/cheatsheets/active-directory/`                                   | en ligne                      |
| Active Directory | id événement 4625 / 4740                  | `/cheatsheets/evenements-windows/` + article journaux              | en ligne                      |
| Intune           | commandes powershell intune               | `/cheatsheets/powershell-m365/` (catégorie Intune)                 | partiel : pas d'article dédié |
| PowerShell       | commandes powershell microsoft 365        | `/cheatsheets/powershell-m365/`                                    | en ligne                      |
| Sécurité         | sécuriser microsoft 365 pme               | `/blog/securiser-microsoft-365-google-workspace-reglages-de-base/` | en ligne                      |
| Sécurité         | que faire après une fuite de données      | article Arkéa (chantier 2)                                         | prévu                         |
| IA               | chatgpt claude gemini comparatif          | hub « IA » (chantier 3)                                            | brouillon                     |
| IA               | données à ne pas mettre dans chatgpt rgpd | article confidentialité (chantier 3)                               | brouillon                     |

## 2. Pages de sujet (hubs) prévues

Une page pilier par grand sujet, qui rassemble articles, outil et cheatsheet, répond aux questions fréquentes (FAQ visible, `FAQPage` seulement si les réponses sont sur la page) et porte une date « mis à jour le ». Ordre : Fin de Windows 10, GAM, Secure Boot, Patch Tuesday, DNS et messagerie, IA. Chaque hub créé : entrée dans le sitemap, le contrat d'URL et ce tableau.

## 3. Étapes manuelles (Guillaume)

1. **Google Search Console** (`https://search.google.com/search-console`) : propriété `grichard.eu` (domaine). Menu Sitemaps : soumettre `root-access.xml`, puis retirer `sitemap.xml` et `sitemap-0.xml` de la liste (les fichiers restent servis). Vérifier « Réussite » et le nombre d'URL découvertes.
2. **Bing Webmaster Tools** (`https://www.bing.com/webmasters`) : ajouter le site (import possible depuis la Search Console), soumettre `https://grichard.eu/root-access.xml`. Bing alimente aussi DuckDuckGo et Copilot.
3. **Demander l'indexation** des pages modifiées le 6 novembre 2026 (Inspection d'URL) : `/cheatsheets/gam/`, `/blog/fin-support-windows-10-passer-a-windows-11/`, `/blog/exchange-online-smtp-auth-basic-fin-2026/`.
4. **Suivi de position** : le plus simple et gratuit est la Search Console elle-même (Performances > Requêtes, filtrer par page, comparer sur 28 jours). Pour un suivi quotidien des requêtes de ce tableau, un outil tiers (par exemple un service de suivi de position payant) est nécessaire : à choisir par Guillaume. **M'envoyer un export CSV** des requêtes (Performances > Exporter) dans un mois permet de remplacer les « à vérifier » par des chiffres réels et de réviser ce plan.
5. **Signaux Web essentiels** : consulter le rapport de la Search Console une fois qu'il a assez de données.

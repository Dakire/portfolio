# ADR 0008 : section « Référence » (aide-mémoire) avec recherche 100 % côté client

**Statut** : accepté (2026-10-13). **2026-10-14** : la section s’appelle désormais « Cheatsheets » et vit sous `/cheatsheets/` (301 depuis `/reference/`) ; les chemins de données `/data/reference/` et les noms de fichiers sont inchangés.

**Contexte.** Le site accueille des aide-mémoire de commandes (GAM, PowerShell Microsoft 365, Windows, Active Directory…), chacun avec une recherche rapide et tolérante aux fautes de frappe. La production est statique + PHP (ADR 0002) : pas de serveur de recherche, pas de base de données, pas de CDN.

**Décision.**

- **Moteur : MiniSearch 7** (MIT), copié dans `apps/web/public/js/libs/minisearch.js` (≈ 19 Ko gzippé), régénéré depuis `node_modules` par `reference:build` et vérifié par un test. Il gère nativement le préfixe, le fuzzy, la pondération par champ et le ET logique multi-mots, ce que Fuse.js (score global, pas de vrai ET ni de préfixe) fait moins bien. Les accents et la casse sont neutralisés par `processTerm`.
- **Un composant unique** : `public/js/reference.js` + `src/styles/reference.css` + `src/components/ReferenceSearch.astro`, piloté par `data-index` (une référence) ou `data-index="all"` (recherche globale de `/reference/`). L'index n'est chargé qu'au premier focus, à la première frappe, ou si l'URL porte `?q=` / `?cat=`.
- **Données** : sources éditables `apps/web/data/reference/src/*.yml`, JSON générés dans `apps/web/public/data/reference/` et **commités**. `index.json` ne contient que les métadonnées (cartes, pages). Le générateur (`scripts/reference/`) tourne en local ; la CI ne fait que vérifier (test unitaire) que les JSON sont à jour.
- **GAM** : `pnpm reference:gam` clone `GAM-team/GAM.wiki.git`, extrait les syntaxes `gam …` des blocs de code et écrit `gam.json`. Seuls des extraits courts sont repris (syntaxe abrégée à 8 lignes, une phrase de description), chacun avec un lien vers la section d'origine du wiki ; la page rappelle la source et la licence (le dépôt GAM est sous Apache 2.0 ; le wiki n'a pas de licence séparée).
- **Sécurité** : le JS construit le DOM par `textContent`/`createElement` (jamais `innerHTML`), la CSP existante suffit (scripts et JSON en `'self'`). Liens externes en `rel="noopener noreferrer"`.
- **i18n** : le français est publié ; la structure est prête (`lang` dans chaque source, libellés `REF_UI` fr/en, `refsFor(lang)`). Une référence anglaise = un dossier de sources de plus, sans changer le moteur.

**Conséquences.** Aucune dépendance d'exécution côté serveur. Le contenu des commandes est indexable : la liste complète est aussi rendue en HTML (repliée) pour les cheatsheets de 150 entrées ou moins (2026-10-14) ; seul GAM reste limité à la recherche côté client. Auparavant, il n'était pas indexé (rendu côté client) ; les pages portent un titre, une description et une introduction propres. Les liens de documentation se contrôlent en local avec `pnpm reference:links`.

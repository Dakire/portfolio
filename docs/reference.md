# Section « Référence » (aide-mémoire)

Pages `/cheatsheets/` (accueil et recherche globale) et `/cheatsheets/<id>/`. Décisions : [ADR 0008](adr/0008-references-recherche-cote-client.md).

## Régénérer les index

Depuis la racine du dépôt (Node ≥ 22, `pnpm install` fait) :

```bash
pnpm --filter @grichard/web reference:build   # sources YAML -> public/data/cheatsheets/*.json (+ copie de MiniSearch)
pnpm --filter @grichard/web reference:gam     # GAM : clone le wiki et régénère gam.json (réseau requis)
pnpm --filter @grichard/web reference:links   # contrôle les liens de documentation (réseau requis, local uniquement)
```

Les JSON sont **commités** : après une modification d'un `.yml`, relancez `reference:build` et commitez les deux. Le test `tests/unit/reference.test.ts` échoue si un JSON n'est pas à jour. Pour GAM, passez le chemin d'un clone existant pour éviter le clonage : `pnpm --filter @grichard/web reference:gam <dossier-du-wiki>`.

## Ajouter une référence en 5 étapes

1. **Créer la source** `apps/web/data/cheatsheets/src/<id>.yml` (partir d'une existante). Bloc `meta` : `id`, `order`, `title` (unique sur le site), `h1`, `description` (60 à 300 caractères), `intro`, `card`, `cats` (catégories), `fields` (champs affichés en plus), `docs` (lien général), et au choix `docBase`/`docBases` (préfixes pour `doc:`), `top` (blocs statiques comme « Connexion »), `notice`, `source` (si le contenu vient d'un tiers).
2. **Écrire les entrées** : `name`, `cat`, `syn` et/ou `desc`, `ex` (liste d'exemples copiables), `alias`, `tags`, `doc` (suffixe) ou `url` (adresse complète), plus les champs `module`, `perms`, `pitfall`, `equiv`, `risk` (`read`, `modify`, `admin`). Mettez entre guillemets toute valeur qui contient « : » ou « # ».
3. **Générer** : `pnpm --filter @grichard/web reference:build`, puis `reference:links` pour vérifier les URL.
4. **Brancher** : rien à coder, la page `/cheatsheets/<id>/` et la carte de `/cheatsheets/` sont créées à partir de `index.json`. Ajoutez l'URL à `tests/contract/contract.json` (`"since": "web"`) et à la liste des pages de `tests/e2e/reference.spec.ts` (axe).
5. **Vérifier et pousser** : `pnpm verify`, rendu 1440/768/375 px, clavier, thèmes clair et sombre, puis commit et push (production automatique).

## Champs d'une entrée

| Champ   | Rôle                                                                  | Poids de recherche |
| ------- | --------------------------------------------------------------------- | ------------------ |
| `name`  | Commande ou cmdlet (titre du résultat)                                | 10                 |
| `alias` | Autres noms (`gci`, `ls`…)                                            | 6                  |
| `syn`   | Synopsis                                                              | 4                  |
| `desc`  | Description courte                                                    | 3                  |
| `ex`    | Exemples (le premier est affiché, les autres sont repliés)            | 2                  |
| `tags`  | Mots-clés                                                             | 1                  |
| autres  | `module`, `perms`, `equiv`, `pitfall`, catégorie, nom de la référence | 1                  |

## Tests manuels de la recherche

Faute de frappe (`mailbx`), accents (`etiquette` pour « Étiquette »), multi-mots (`bitlocker status`), préfixe (`get-mail`), clavier seul (`/`, `Ctrl+K`, `↓`, `↑`, `Entrée`, `Échap`), URL partagée (`?q=…&cat=…`), mobile (375 px), thème sombre, annonce `aria-live` du nombre de résultats. Les cas automatisables sont dans `tests/e2e/reference.spec.ts`.

## Options de présentation d'une cheatsheet

Clés facultatives du bloc `meta` d'une source (exemple : `bios-uefi.yml`) :

- `optionalUrl: true` : les entrées n'ont pas toutes de page de documentation (aucun lien « documentation officielle » n'est affiché pour celles sans `url`).
- `topAfter: true` et `topTitle` : les blocs `top` passent après la recherche, sous le titre voulu (quand la recherche est l'essentiel).
- `searchLabel` et `placeholder` : libellé et exemple du champ de recherche quand « commande » ne convient pas.
- Une cheatsheet existe en français (`/cheatsheets/<id>/`) et en anglais (`/en/cheatsheets/<id>/`) avec deux identifiants distincts (ex. `bios-uefi` et `bios-uefi-keys`) ; la correspondance (liens `hreflang`, sélecteur de langue) est déclarée dans `TRANSLATIONS` de `src/reference/refs.ts`.
- Une cheatsheet issue d'un ancien article du blog : l'article est supprimé, ses URL (page, étiquettes, image de partage) sont redirigées en 301 via `REDIRECTS` (`scripts/lib/htaccess.mjs`) et le contrat.

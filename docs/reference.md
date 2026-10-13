# Section « Référence » (aide-mémoire)

Pages `/reference/` (accueil et recherche globale) et `/reference/<id>/`. Décisions : [ADR 0008](adr/0008-references-recherche-cote-client.md).

## Régénérer les index

Depuis la racine du dépôt (Node ≥ 22, `pnpm install` fait) :

```bash
pnpm --filter @grichard/web reference:build   # sources YAML -> public/data/reference/*.json (+ copie de MiniSearch)
pnpm --filter @grichard/web reference:gam     # GAM : clone le wiki et régénère gam.json (réseau requis)
pnpm --filter @grichard/web reference:links   # contrôle les liens de documentation (réseau requis, local uniquement)
```

Les JSON sont **commités** : après une modification d'un `.yml`, relancez `reference:build` et commitez les deux. Le test `tests/unit/reference.test.ts` échoue si un JSON n'est pas à jour. Pour GAM, passez le chemin d'un clone existant pour éviter le clonage : `pnpm --filter @grichard/web reference:gam <dossier-du-wiki>`.

## Ajouter une référence en 5 étapes

1. **Créer la source** `apps/web/data/reference/src/<id>.yml` (partir d'une existante). Bloc `meta` : `id`, `order`, `title` (unique sur le site), `h1`, `description` (60 à 300 caractères), `intro`, `card`, `cats` (catégories), `fields` (champs affichés en plus), `docs` (lien général), et au choix `docBase`/`docBases` (préfixes pour `doc:`), `top` (blocs statiques comme « Connexion »), `notice`, `source` (si le contenu vient d'un tiers).
2. **Écrire les entrées** : `name`, `cat`, `syn` et/ou `desc`, `ex` (liste d'exemples copiables), `alias`, `tags`, `doc` (suffixe) ou `url` (adresse complète), plus les champs `module`, `perms`, `pitfall`, `equiv`, `risk` (`read`, `modify`, `admin`). Mettez entre guillemets toute valeur qui contient « : » ou « # ».
3. **Générer** : `pnpm --filter @grichard/web reference:build`, puis `reference:links` pour vérifier les URL.
4. **Brancher** : rien à coder, la page `/reference/<id>/` et la carte de `/reference/` sont créées à partir de `index.json`. Ajoutez l'URL à `tests/contract/contract.json` (`"since": "web"`) et à la liste des pages de `tests/e2e/reference.spec.ts` (axe).
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

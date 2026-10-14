# ADR 0009 : architecture d'information orientée portfolio

**Statut** : accepté (2026-10-14). Détail, audit et plan : [docs/refonte-portfolio.md](../refonte-portfolio.md).

**Contexte.** L'accueil regroupait projets, compétences, expériences, outils et blog (près de 10 000 px sur mobile), avec du contenu en double sur les pages de section. Les projets n'avaient pas de page propre. La navigation était une liste plate de sept liens.

**Décision.**

- Menu principal court : À propos, Parcours, Compétences, Réalisations, Ressources, plus un bouton Contact toujours visible. Blog, Outils et Cheatsheets sont regroupés sous « Ressources » avec une sous-navigation de section (pas de menu déroulant).
- Une page = un rôle ; l'accueil résume et oriente. Une page par réalisation (`/projets/<slug>/`), des blocs facultatifs masqués tant qu'ils sont vides (aucun contenu inventé).
- Fil d'Ariane et `BreadcrumbList` sur toutes les pages sauf l'accueil ; pied de page en quatre colonnes.
- Seules les URL de la section « Référence » changent (`/reference/` devient `/cheatsheets/`, 301). Les redirections sont générées par `htaccess.mjs` et testées.
- L'identité visuelle reste celle de `packages/ui/src/tokens.css` : aucun nouveau token de couleur ni de police.

**Conséquences.** Nouvelles URL : `/parcours/`, `/ressources/`, réalisations (FR et EN). Le contrat d'URL est mis à jour à chaque publication. Une table de redirections est ajoutée au générateur du `.htaccess`.

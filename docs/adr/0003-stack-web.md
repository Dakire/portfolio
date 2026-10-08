# ADR 0003 : Astro + Preact + Tailwind pour le site public

**Statut** : accepté (2026-10-08) ; implémentation en phases 1 à 3.

**Décision.** Astro (sortie statique, i18n, content collections validées par Zod, MDX, Shiki au build) remplace le pré-rendu maison. Zones interactives en Preact (environ 4 Ko) plutôt qu'en React (environ 70 Ko gzip aujourd'hui). Tailwind 4 alimenté par les tokens de `packages/ui`.

**Écartés.** Next.js (serveur Node), React seul (poids), JavaScript sans framework (coût des outils riches).

**Conséquences.** URL existantes inchangées (contrat de 70 URL). La logique pure des outils est portée en TypeScript dans `packages/tools-core`, avec ses tests.

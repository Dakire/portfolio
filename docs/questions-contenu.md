# Questions à Guillaume pour la série IA

**État au 7 novembre 2026 : réponses reçues, série publiée (FR et EN).** Les réponses ci-dessous sont celles de Guillaume, reprises telles quelles dans les articles ; les questions sans réponse (ChatGPT en détail, cas d'erreur de l'IA, données collées par un tiers) ont vu leur section retirée plutôt qu'inventée.

Les articles de la série IA sont en brouillon (`draft: true` : aucune page, aucun lien, aucune entrée dans le sitemap). Chaque emplacement **[À COMPLÉTER PAR GUILLAUME]** attend une réponse de votre part, **à votre manière, avec vos mots**. Je n'invente aucune anecdote, aucun avis, aucun test.

Répondez en quelques lignes par question, ou « rien à dire » : je retirerai alors la section. Quand un article n'a plus de marqueur, je passe `draft: false`, j'ajoute son lien dans le dossier et je le publie ; un test (`tests/unit/drafts.test.ts`) empêche de publier un article qui contient encore un marqueur.

Fichiers : `apps/web/src/content/blog/ia-informatique-comparatif-assistants-ligne-editoriale.md` (dossier) et les sept articles par outil.

## Ligne éditoriale (dossier d'ensemble)

1. **Quel est votre premier usage de ChatGPT en 2022 ?** Date approximative, ce que vous cherchiez, ce qui vous a surpris.

Novembre 2022 dès la sortie de chatgpt version chat 2. **Qu'est-ce que l'IA a changé dans votre travail depuis ?** Une tâche qui prenait du temps et n'en prend plus ; une tâche que vous refusez de lui confier.

Correction de texte, verification rapide d'infos, developpement etc

3. **Quel outil utilisez-vous au quotidien, et pourquoi celui-là ?** Y en a-t-il un second pour vérifier ?

J'utilise claude, gemini et chatgpt au quotidien

4. **Un cas où l'IA s'est trompée en dépannage ?** Le symptôme, la mauvaise piste proposée, ce qui vous a mis la puce à l'oreille, le coût (temps perdu, risque évité).

Pas d'exemple en tete

5. **Une règle d'usage que vous appliquez ?** Par exemple ce que vous n'y collez jamais, et comment vous anonymisez.

Pas d'infos sensibles genre mot de passe, rib, iban etc, je met jamais le nom ou prenom

6. **Avez-vous déjà vu un collègue ou un client coller des données qu'il n'aurait pas dû ?** Sans nommer personne : quoi, et comment cela a été traité.

## ChatGPT

1. Ce que vous faites encore avec ChatGPT et que vous ne faites pas ailleurs.
2. Un script ou une commande proposé qui ne marchait pas : laquelle, et comment vous l'avez vu.
3. Avez-vous utilisé l'offre gratuite, Plus, Go, une offre d'équipe ? Pourquoi ce choix ? Avez-vous constaté de la publicité ?
4. Le tarif que vous payez, s'il y en a un, et si vous le referiez.

## Claude

1. Quand et pourquoi vous l'avez essayé, par rapport à ChatGPT.

Plusieurs mois après genre 2025

2. Un travail où il a été meilleur, ou moins bon, qu'un autre outil : lequel, avec quel constat.

Le dev

3. Utilisez-vous un outil de programmation assisté (type Claude Code) ? Pour quel usage dans ce dépôt ou ailleurs ?

Claude Code

4. Offre utilisée (gratuite, Pro, Max, Team) et pourquoi.

Pro à titre pro et gratuite à titre perso

## Gemini

1. Dans quel contexte l'utilisez-vous (Workspace d'un client, mobile, recherche) ?

Workspace au travail et perso car limite plus elevée

2. Un cas dans Gmail, Drive ou Documents où il a aidé, ou gêné.

remise au propre de prises de notes dans google docs, aide aux formules google sheets

3. Avez-vous activé Gemini sur un Workspace géré (console d'administration) ? Que fallait-il régler ?

Il est activé par défaut, attention avec les licences business starter il est moins présents à travers la suite google

4. Offre utilisée et prix payé.

Google workspace business stabdard (13,60 HT / mois)

## Microsoft Copilot

1. L'avez-vous testé (Copilot Chat, applications Microsoft 365, licence payante) ? Chez qui ?

Oui j'ai un pc compatible copilot

2. Avez-vous vu Copilot faire remonter un document mal partagé ? C'est l'anecdote la plus utile pour un lecteur : ce qui a été trouvé, comment cela a été corrigé.

non 3. Un déploiement ou un test avec un client : combien de personnes, quel retour ?

aucun

4. Auriez-vous payé la licence pour vous ou pour un client ?

Non jamais trop limité

## Mistral (Le Chat, devenu Vibe)

1. L'avez-vous utilisé ? Pour quels cas, avec quel résultat ?

Oui je l'ai utilisé pour du dev rapide type scripting et c'était ok

2. **Le nom** : avez-vous vu passer le changement de nom de Le Chat à Vibe, et à quelle date ? C'est le point que je n'ai pas pu confirmer sur une source officielle.

C'est très recent (en mai 2026)

3. Un client ou un projet pour lequel l'éditeur européen a compté dans le choix ?

La souveraineté

4. Offre utilisée.

Gratuite

## DeepSeek

1. L'avez-vous testé ? Avec quelles données (fictives ?) ?

Oui testé

2. Votre position et ce qui la motive (l'article propose : ne pas l'utiliser pour des données pro). Est-ce aussi la vôtre ?

Le rapport qualité prix

3. L'avez-vous utilisé par API ou en exécutant un modèle chez vous ? Dans quel cadre ?

Via API pour le dev

4. Un client ou un collègue qui vous a posé la question ?

Nope

## Perplexity

1. À quel moment avez-vous commencé à chercher avec Perplexity plutôt qu'avec un moteur classique ?

en 2025

2. Un cas où une source citée était fausse, périmée ou déformée.

ras

3. Veille : l'utilisez-vous pour suivre les avis de sécurité ? Quelle méthode de vérification ensuite ?

ras

4. Offre utilisée, et **le prix payé aujourd'hui** (je n'ai pas pu lire la page officielle).

gratuite

## À vérifier avant publication (de mon côté, au moment de publier)

- Tarifs et paliers de chaque outil, à relire le jour de la publication (ils changent vite). ChatGPT : prix officiels reçus de Guillaume le 7 novembre 2026 (mis à jour). Perplexity : prix officiels reçus de Guillaume le 7 novembre 2026 (mis à jour).
- État des procédures des autorités européennes sur DeepSeek (mes sources datent de 2025).
- Nom du produit Mistral (Le Chat ou Vibe).
- ~~Versions EN de chaque article~~ : faites le 7 novembre 2026.

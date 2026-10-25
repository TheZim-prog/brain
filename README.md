# Brain

Les jeux de magazine (sudoku, mots fléchés, mots croisés…) dans une PWA installable.

## Démarrer

```sh
npm install
npm run dev      # serveur de dev
npm test         # tests (vitest)
npm run build    # build de production + service worker
```

## Organisation

- `src/games/registry.ts` — la liste des jeux affichés à l'accueil. Ajouter un jeu = ajouter une entrée avec son `component`.
- `src/games/sudoku/` — solveur, générateur (solution unique, retrait symétrique), logique de partie (`state.ts`) et page.
- `src/games/mots-meles/` — listes de mots par thème, générateur (les lettres restantes forment un mot mystère), logique de partie et page.
- `src/games/mots-fleches/` — dictionnaire (`dico/*.txt`), générateur (remplissage case par case avec retour en arrière intelligent, lancé dans un Web Worker), logique de partie et page.
- `src/lib/` — utilitaires partagés (sauvegarde locale, routage par hash, chrono, normalisation du texte).

## Dictionnaire des mots fléchés

Une entrée par ligne dans `src/games/mots-fleches/dico/*.txt` : `mot|définition facile|définition difficile`.
Les accents sont retirés dans la grille ; un mot présent plusieurs fois cumule ses définitions.
`npm test` vérifie qu'aucune définition ne contient sa propre réponse.

Après avoir ajouté un fichier dans `dico/`, si les tests ne le voient pas, vider le cache : `node_modules/.vite*` et `node_modules/.vitest*`.

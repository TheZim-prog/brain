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
- `src/games/hidato/` — plateaux hexagonal et carrés, chemin aléatoire (« backbite »), solveur qui garantit une solution unique, logique de partie et page.
- `src/games/mots-meles/` — listes de mots par thème, générateur (les lettres restantes forment un mot mystère), logique de partie et page.
- `src/games/mots/` — commun aux mots fléchés et aux mots croisés : dictionnaire (`dico/*.txt`), remplissage de grille (case par case avec retour en arrière intelligent, dans un Web Worker partagé), logique de saisie et morceaux d'interface.
- `src/games/mots-fleches/` — placement des définitions dans la grille et page.
- `src/games/mots-croises/` — grilles à cases noires numérotées (I, II… / 1, 2…) et page.
- `src/lib/` — utilitaires partagés (sauvegarde locale, routage par hash, chrono, normalisation du texte).

## Dictionnaire

Une entrée par ligne dans `src/games/mots/dico/*.txt` : `mot|définition facile|définition difficile`.
Les accents sont retirés dans la grille ; un mot présent plusieurs fois cumule ses définitions.
`npm test` vérifie qu'aucune définition ne contient sa propre réponse.

Après avoir ajouté un fichier dans `dico/`, si les tests ne le voient pas, vider le cache : `node_modules/.vite*` et `node_modules/.vitest*`.

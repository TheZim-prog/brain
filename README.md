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
- `src/lib/` — utilitaires partagés (sauvegarde locale, routage par hash, chrono).

// Ce que partagent les jeux de grille à mots (mots fléchés, mots croisés).

export type Direction = 'h' | 'v'
export type Level = 'facile' | 'difficile'

export interface WordClue {
  dir: Direction
  text: string
  cells: number[]
  answer: string
}

export interface WordPuzzle<C extends WordClue = WordClue> {
  width: number
  height: number
  /** Lettre attendue dans chaque case, null pour une case définition ou noire. */
  solution: (string | null)[]
  clues: C[]
  level: Level
}

export const LEVELS: { id: Level; label: string; detail: string }[] = [
  { id: 'facile', label: 'Facile', detail: 'Définitions directes' },
  { id: 'difficile', label: 'Difficile', detail: 'Définitions à double sens' },
]

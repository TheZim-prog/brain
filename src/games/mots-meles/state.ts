import { normalize } from '../../lib/text'
import type { WordSearch } from './generator'

export interface MotsMelesState {
  puzzle: WordSearch
  /** Mots trouvés, avec les cases sélectionnées par le joueur. */
  found: { word: number; cells: number[] }[]
  /** Première lettre d'un mot à trouver, montrée par l'indice. */
  hintCell: number | null
  hints: number
  mysteryRevealed: boolean
  elapsed: number
  completed: boolean
}

export type MotsMelesAction =
  | { type: 'submit'; cells: number[] }
  | { type: 'hint' }
  | { type: 'guessMystery'; guess: string }
  | { type: 'revealMystery' }
  | { type: 'tick' }

export function newGame(puzzle: WordSearch): MotsMelesState {
  return { puzzle, found: [], hintCell: null, hints: 0, mysteryRevealed: false, elapsed: 0, completed: false }
}

export const allWordsFound = (s: MotsMelesState) => s.found.length === s.puzzle.words.length

/** Cases entre a et b si elles sont alignées (ligne, colonne ou diagonale), sinon null. */
export function lineCells(size: number, a: number, b: number): number[] | null {
  const dr = Math.floor(b / size) - Math.floor(a / size)
  const dc = (b % size) - (a % size)
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  const len = Math.max(Math.abs(dr), Math.abs(dc))
  const step = Math.sign(dr) * size + Math.sign(dc)
  return Array.from({ length: len + 1 }, (_, k) => a + step * k)
}

/** Ramène b sur la direction (parmi les 8) la plus proche du geste, sans sortir de la grille. */
export function snapEnd(size: number, a: number, b: number): number {
  const r0 = Math.floor(a / size), c0 = a % size
  const dr = Math.floor(b / size) - r0, dc = (b % size) - c0
  if (dr === 0 && dc === 0) return a
  const angle = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4)
  const sr = Math.round(Math.sin(angle)), sc = Math.round(Math.cos(angle))
  let len = sr && sc ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2) : Math.max(Math.abs(dr), Math.abs(dc))
  while (len > 0) {
    const r = r0 + sr * len, c = c0 + sc * len
    if (r >= 0 && r < size && c >= 0 && c < size) return r * size + c
    len--
  }
  return a
}

function finish(s: MotsMelesState): MotsMelesState {
  const done = allWordsFound(s) && (!s.puzzle.mystery || s.mysteryRevealed)
  return done ? { ...s, completed: true } : s
}

export function motsMelesReducer(s: MotsMelesState, a: MotsMelesAction): MotsMelesState {
  if (s.completed) return s
  switch (a.type) {
    case 'tick':
      return { ...s, elapsed: s.elapsed + 1 }
    case 'submit': {
      if (a.cells.length < 2) return s
      const text = a.cells.map((c) => s.puzzle.grid[c]).join('')
      const reversed = [...text].reverse().join('')
      // On compare le texte et pas la position : si un mot apparaît deux fois par hasard, les deux comptent.
      const word = s.puzzle.words.findIndex(
        (w, i) => (w.letters === text || w.letters === reversed) && !s.found.some((f) => f.word === i),
      )
      if (word === -1) return s
      const hintCell = s.hintCell !== null && s.puzzle.words[word].cells.includes(s.hintCell) ? null : s.hintCell
      return finish({ ...s, found: [...s.found, { word, cells: a.cells }], hintCell })
    }
    case 'hint': {
      const missing = s.puzzle.words.findIndex((_, i) => !s.found.some((f) => f.word === i))
      if (missing === -1) return s
      return { ...s, hintCell: s.puzzle.words[missing].cells[0], hints: s.hints + 1 }
    }
    case 'guessMystery': {
      const mystery = s.puzzle.mystery
      if (!mystery || !allWordsFound(s) || normalize(a.guess) !== mystery.letters) return s
      return finish({ ...s, mysteryRevealed: true })
    }
    case 'revealMystery':
      return allWordsFound(s) ? finish({ ...s, mysteryRevealed: true, hints: s.hints + 1 }) : s
  }
}

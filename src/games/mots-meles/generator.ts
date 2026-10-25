import { normalize } from '../../lib/text'
import { THEMES, type Theme } from './themes'

export type Difficulty = 'facile' | 'moyen' | 'difficile'

type Dir = readonly [dRow: number, dCol: number]

const RIGHT: Dir = [0, 1], DOWN: Dir = [1, 0], DOWN_RIGHT: Dir = [1, 1], UP_RIGHT: Dir = [-1, 1]
const LEFT: Dir = [0, -1], UP: Dir = [-1, 0], UP_LEFT: Dir = [-1, -1], DOWN_LEFT: Dir = [1, -1]

export const DIFFICULTIES: { id: Difficulty; label: string; size: number; dirs: Dir[]; detail: string }[] = [
  { id: 'facile', label: 'Facile', size: 10, dirs: [RIGHT, DOWN, DOWN_RIGHT], detail: '10×10 · sans mots à l’envers' },
  { id: 'moyen', label: 'Moyen', size: 12, dirs: [RIGHT, DOWN, DOWN_RIGHT, UP_RIGHT, LEFT, UP], detail: '12×12 · quelques mots à l’envers' },
  {
    id: 'difficile',
    label: 'Difficile',
    size: 14,
    dirs: [RIGHT, DOWN, DOWN_RIGHT, UP_RIGHT, LEFT, UP, UP_LEFT, DOWN_LEFT],
    detail: '14×14 · toutes les directions',
  },
]

export interface PlacedWord {
  /** Le mot tel qu'affiché dans la liste (avec accents). */
  label: string
  letters: string
  cells: number[]
}

export interface WordSearch {
  size: number
  grid: string[]
  words: PlacedWord[]
  /** Formé par les lettres restantes, lues de gauche à droite et de haut en bas. Null si la grille est complétée au hasard. */
  mystery: { label: string; letters: string } | null
  themeId: string
  difficulty: Difficulty
}

const MYSTERY_MIN = 4
const MYSTERY_MAX = 9
const ATTEMPTS = 300
// Fréquence approximative des lettres en français, pour le remplissage de secours.
const FILLER = 'EEEEEEEEEEEEEEESSSSSSSSAAAAAAAAIIIIIIIITTTTTTTNNNNNNNRRRRRRRUUUUUUULLLLLOOOOODDDCCCPPPMMMVVQFBGHJXYZK'

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Deux mots dont l'un contient l'autre (CHAT / CHATON) rendraient la recherche ambiguë. */
const overlaps = (a: string, b: string) => a.includes(b) || b.includes(a)

interface Attempt {
  grid: string[]
  words: PlacedWord[]
  free: number
}

function tryFill(size: number, dirs: Dir[], pool: { label: string; letters: string }[], mysteryLengths: Set<number>, rng: () => number): Attempt {
  const grid: string[] = Array(size * size).fill('')
  const words: PlacedWord[] = []
  let free = size * size

  for (const word of pool) {
    if (free <= MYSTERY_MAX && mysteryLengths.has(free)) break
    if (word.letters.length > size || words.some((w) => overlaps(w.letters, word.letters))) continue

    // Toutes les positions possibles, en préférant celles qui croisent des mots déjà placés.
    let best: { cells: number[]; shared: number }[] = []
    let bestShared = -1
    for (let start = 0; start < size * size; start++) {
      for (const [dr, dc] of dirs) {
        const r0 = Math.floor(start / size), c0 = start % size
        const rEnd = r0 + dr * (word.letters.length - 1), cEnd = c0 + dc * (word.letters.length - 1)
        if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue
        const cells: number[] = []
        let shared = 0
        let ok = true
        for (let k = 0; k < word.letters.length; k++) {
          const cell = (r0 + dr * k) * size + (c0 + dc * k)
          const existing = grid[cell]
          if (existing && existing !== word.letters[k]) {
            ok = false
            break
          }
          if (existing) shared++
          cells.push(cell)
        }
        if (!ok || shared === word.letters.length) continue
        if (free - (word.letters.length - shared) < MYSTERY_MIN) continue
        if (shared > bestShared) {
          best = [{ cells, shared }]
          bestShared = shared
        } else if (shared === bestShared) {
          best.push({ cells, shared })
        }
      }
    }
    if (!best.length) continue

    // Un peu de hasard pour ne pas toujours empiler les mots au même endroit.
    const pick = best[Math.floor(rng() * best.length)]
    pick.cells.forEach((cell, k) => (grid[cell] = word.letters[k]))
    free -= word.letters.length - pick.shared
    words.push({ ...word, cells: pick.cells })
  }

  return { grid, words, free }
}

export function generate(difficulty: Difficulty, themeId: string, rng: () => number = Math.random): WordSearch {
  const { size, dirs } = DIFFICULTIES.find((d) => d.id === difficulty)!
  const theme: Theme = THEMES.find((t) => t.id === themeId)!
  const all = theme.words.map((label) => ({ label, letters: normalize(label) }))

  let fallback: Attempt | null = null
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Les grands mots d'abord (plus durs à caser), avec un ordre aléatoire à longueur égale.
    const pool = shuffle(all, rng).sort((a, b) => b.letters.length - a.letters.length + (rng() - 0.5) * 4)
    const lengths = new Set(all.map((w) => w.letters.length).filter((n) => n >= MYSTERY_MIN && n <= MYSTERY_MAX))
    const result = tryFill(size, dirs, pool, lengths, rng)

    const used = new Set(result.words.map((w) => w.letters))
    const candidates = all.filter(
      (w) => w.letters.length === result.free && !used.has(w.letters) && !result.words.some((p) => overlaps(p.letters, w.letters)),
    )
    if (candidates.length) {
      const mystery = candidates[Math.floor(rng() * candidates.length)]
      const grid = [...result.grid]
      let k = 0
      for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = mystery.letters[k++]
      return { size, grid, words: result.words, mystery, themeId, difficulty }
    }
    if (!fallback || result.free < fallback.free) fallback = result
  }

  // Très rare : pas de mot mystère qui tombe juste, on complète avec des lettres au hasard.
  const grid = fallback!.grid.map((l) => l || FILLER[Math.floor(rng() * FILLER.length)])
  return { size, grid, words: fallback!.words, mystery: null, themeId, difficulty }
}

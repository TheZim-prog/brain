import { shuffle } from '../../lib/random'
import { CELLS, countSolutions, solve, type Grid } from './solver'

export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'expert'

export const DIFFICULTIES: { id: Difficulty; label: string; clues: number }[] = [
  { id: 'facile', label: 'Facile', clues: 40 },
  { id: 'moyen', label: 'Moyen', clues: 33 },
  { id: 'difficile', label: 'Difficile', clues: 28 },
  { id: 'expert', label: 'Expert', clues: 24 },
]

export interface Puzzle {
  puzzle: Grid
  solution: Grid
  difficulty: Difficulty
}


/**
 * Génère une grille à solution unique. On retire les chiffres par paires
 * symétriques (comme dans les magazines) tant que la solution reste unique,
 * jusqu'à atteindre le nombre d'indices visé par la difficulté.
 * Un tirage peut se bloquer au-dessus de la cible : on en fait quelques-uns et on garde le plus proche.
 */
export function generate(difficulty: Difficulty, rng: () => number = Math.random): Puzzle {
  const target = DIFFICULTIES.find((d) => d.id === difficulty)!.clues
  let best: Puzzle | null = null
  for (let attempt = 0; attempt < 8; attempt++) {
    const p = attemptGenerate(difficulty, target, rng)
    const clues = p.puzzle.filter(Boolean).length
    if (!best || clues < best.puzzle.filter(Boolean).length) best = p
    if (clues <= target + 2) break
  }
  return best!
}

function attemptGenerate(difficulty: Difficulty, target: number, rng: () => number): Puzzle {
  const solution = solve(Array(CELLS).fill(0), (digits) => shuffle(digits, rng))!
  const puzzle = [...solution]
  let clues = CELLS

  const half = shuffle(Array.from({ length: Math.ceil(CELLS / 2) }, (_, i) => i), rng)
  for (const i of half) {
    const j = CELLS - 1 - i
    const removed = i === j ? 1 : 2
    if (clues - removed < target) continue
    const [a, b] = [puzzle[i], puzzle[j]]
    puzzle[i] = 0
    puzzle[j] = 0
    if (countSolutions(puzzle) === 1) {
      clues -= removed
      if (clues === target) break
    } else {
      puzzle[i] = a
      puzzle[j] = b
    }
  }

  return { puzzle, solution, difficulty }
}

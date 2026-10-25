import { fillGrid } from '../mots/fill'
import type { Level } from '../mots/types'
import { SIZES, type CrossClue, type Crossword, type SizeId } from './config'

export function generate(size: SizeId, level: Level, rng: () => number = Math.random): Crossword {
  const { width: W, height: H, blocks } = SIZES.find((s) => s.id === size)!
  const { solution, runs, clueFor } = fillGrid(W, H, { style: 'croises', maxBlocks: Math.round(W * H * blocks) }, rng)

  // Les horizontaux d'abord, ligne par ligne, puis les verticaux, colonne par colonne.
  const clues: CrossClue[] = runs
    .map((run) => ({ ...run, line: run.dir === 'h' ? Math.floor(run.cells[0] / W) : run.cells[0] % W, text: clueFor(run.answer, level) }))
    .sort((a, b) => Number(a.dir === 'v') - Number(b.dir === 'v') || a.line - b.line || a.cells[0] - b.cells[0])

  return { width: W, height: H, solution, clues, size, level }
}

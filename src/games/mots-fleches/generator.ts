import { fillGrid } from '../mots/fill'
import type { Level } from '../mots/types'
import { SIZES, type Arrow, type ArrowWords, type Clue, type SizeId } from './config'

/** Part maximale de cases définition hors bordure. */
const DEF_RATIO = 0.3

export function generate(size: SizeId, level: Level, rng: () => number = Math.random): ArrowWords {
  const { width: W, height: H } = SIZES.find((s) => s.id === size)!
  const { solution, runs, clueFor } = fillGrid(W, H, { style: 'fleches', maxBlocks: Math.round((W - 1) * (H - 1) * DEF_RATIO) }, rng)

  // La définition se trouve juste avant le mot ; sur les bords, dans la case de la bordure voisine.
  const clues: Clue[] = runs.map((run) => {
    const start = run.cells[0]
    const r = Math.floor(start / W), c = start % W
    const [def, arrow]: [number, Arrow] =
      run.dir === 'h' ? (c > 0 ? [start - 1, 'right'] : [start - W, 'downRight']) : r > 0 ? [start - W, 'down'] : [start - 1, 'rightDown']
    return { ...run, def, arrow, text: clueFor(run.answer, level) }
  })

  return { width: W, height: H, solution, clues, size, level }
}

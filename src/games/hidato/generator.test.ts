import { describe, expect, it } from 'vitest'
import { countSolutions, DIFFICULTIES, generate, makeBoard, randomPath, SHAPES, sizeCount, SIZES } from './generator'

describe('plateaux', () => {
  it('l’hexagone de 4 de côté a 37 cases, chaque case intérieure 6 voisines', () => {
    const board = makeBoard('hexagone', 'moyenne')
    expect(board.count).toBe(37)
    expect(sizeCount('hexagone', 'moyenne')).toBe(37)
    expect(Math.max(...board.neighbors.map((n) => n.length))).toBe(6)
    expect(Math.min(...board.neighbors.map((n) => n.length))).toBe(3)
  })

  for (const { id: shape } of SHAPES)
    for (const { id: size } of SIZES) {
      it(`${shape} ${size} : le serpentin et le chemin aléatoire passent par chaque case, de voisine en voisine`, () => {
        const board = makeBoard(shape, size)
        for (const path of [board.serpentine, randomPath(board)]) {
          expect(new Set(path).size).toBe(board.count)
          for (let k = 1; k < path.length; k++) expect(board.neighbors[path[k - 1]]).toContain(path[k])
        }
      })
    }
})

describe('générateur de hidato', () => {
  for (const { id: shape } of SHAPES)
    for (const { id: size } of SIZES)
      for (const { id: difficulty } of DIFFICULTIES) {
        it(`${shape} · ${size} · ${difficulty} : solution unique et cohérente`, () => {
          const h = generate(shape, size, difficulty)
          const board = makeBoard(shape, size)
          const N = board.count
          expect([...h.solution].sort((a, b) => a - b)).toEqual(Array.from({ length: N }, (_, i) => i + 1))
          expect(h.given.every((v, i) => v === 0 || v === h.solution[i])).toBe(true)
          expect(h.given).toContain(1)
          expect(h.given).toContain(N)
          expect(countSolutions(board, h.given)).toBe(1)
        })
      }
})

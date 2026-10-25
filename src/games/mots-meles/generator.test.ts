import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, generate } from './generator'
import { THEMES } from './themes'

describe('générateur de mots mêlés', () => {
  for (const { id, size } of DIFFICULTIES) {
    for (const theme of THEMES) {
      it(`${id} · ${theme.name} : grille pleine, mots à leur place et mot mystère`, () => {
        const ws = generate(id, theme.id)
        expect(ws.grid).toHaveLength(size * size)
        expect(ws.grid.every((l) => /^[A-Z]$/.test(l))).toBe(true)
        for (const w of ws.words) expect(w.cells.map((c) => ws.grid[c]).join('')).toBe(w.letters)

        expect(ws.mystery).not.toBeNull()
        const used = new Set(ws.words.flatMap((w) => w.cells))
        const rest = ws.grid.filter((_, i) => !used.has(i)).join('')
        expect(rest).toBe(ws.mystery!.letters)
      })
    }
  }
})

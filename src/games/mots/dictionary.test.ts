import { describe, expect, it } from 'vitest'
import { normalize } from '../../lib/text'
import { DICTIONARY } from './dictionary'

describe('dictionnaire', () => {
  it('aucune définition ne contient sa réponse', () => {
    const bad = DICTIONARY.flatMap((e) =>
      [...e.easy, ...e.hard].filter((c) => c.split(/[^\p{L}]+/u).some((w) => normalize(w) === e.word)).map((c) => `${e.word} : ${c}`),
    )
    expect(bad).toEqual([])
  })

  it('chaque mot a au moins une définition facile et une difficile', () => {
    expect(DICTIONARY.filter((e) => !e.easy.length || !e.hard.length || e.easy.length !== e.hard.length)).toEqual([])
  })
})

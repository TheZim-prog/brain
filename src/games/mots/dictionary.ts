import { normalize } from '../../lib/text'

export interface Entry {
  word: string
  easy: string[]
  hard: string[]
}

/**
 * Format des fichiers du dictionnaire : une entrée par ligne, `mot|définition facile|définition difficile`
 * (la difficile est facultative). Les lignes vides et celles qui commencent par # sont ignorées.
 * Les homographes une fois les accents retirés (mur, mûr) fusionnent leurs définitions.
 */
export function parseDictionary(sources: string[]): Entry[] {
  const byWord = new Map<string, Entry>()
  for (const source of sources) {
    for (const raw of source.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const [word, easy, hard] = line.split('|').map((part) => part.trim())
      const key = normalize(word)
      if (key.length < 2 || !easy) continue
      const entry = byWord.get(key) ?? { word: key, easy: [], hard: [] }
      byWord.set(key, entry)
      entry.easy.push(easy)
      entry.hard.push(hard || easy)
    }
  }
  return [...byWord.values()]
}

const files = import.meta.glob<string>('./dico/*.txt', { query: '?raw', import: 'default', eager: true })

export const DICTIONARY: Entry[] = parseDictionary(Object.values(files))

/** Arbre de préfixes à plat, pour que le générateur vérifie très vite si un début de mot peut aboutir. */
export class Trie {
  /** next[node * 26 + lettre] = nœud suivant, ou 0. */
  next: Int32Array
  /** Bit k : un mot de longueur totale k passe par ce nœud. */
  lengths: Int32Array
  /** Bit l : la lettre l prolonge ce nœud. */
  children: Int32Array
  /** Indice du mot qui se termine ici, ou -1. */
  word: Int32Array
  /** Nombre de mots qui commencent par ce préfixe. */
  count: Int32Array

  constructor(words: string[]) {
    const max = words.reduce((n, w) => n + w.length, 1)
    this.next = new Int32Array(max * 26)
    this.lengths = new Int32Array(max)
    this.children = new Int32Array(max)
    this.word = new Int32Array(max).fill(-1)
    this.count = new Int32Array(max)
    let nodes = 1
    words.forEach((w, id) => {
      let node = 0
      this.lengths[0] |= 1 << w.length
      this.count[0]++
      for (let i = 0; i < w.length; i++) {
        const l = w.charCodeAt(i) - 65
        let child = this.next[node * 26 + l]
        if (!child) {
          child = nodes++
          this.next[node * 26 + l] = child
          this.children[node] |= 1 << l
        }
        node = child
        this.lengths[node] |= 1 << w.length
        this.count[node]++
      }
      this.word[node] = id
    })
  }
}

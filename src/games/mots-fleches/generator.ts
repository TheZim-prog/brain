import { SIZES, type Arrow, type ArrowWords, type Clue, type Level, type SizeId } from './config'
import { DICTIONARY, Trie, type Entry } from './dictionary'

export { SIZES }

/** Au-delà, les grands mots verticaux engagent la grille trop loin et le remplissage échoue souvent. */
const MAX_WORD_LENGTH = 9
/** Part maximale de cases définition hors bordure. */
const DEF_RATIO = 0.3
/** Beaucoup d'essais courts valent mieux que quelques longs : la difficulté d'un essai dépend surtout des premiers choix. */
const STEPS_PER_ATTEMPT = 1000
const TIME_LIMIT_MS = 20000

const DEF = 26
const UNSET = -1
const ALL_LETTERS = (1 << 26) - 1
/** Fréquence des lettres en français : on essaie d'abord les lettres courantes. */
const LETTER_WEIGHT = [
  8.1, 0.9, 3.3, 3.7, 14.7, 1.1, 1.0, 0.7, 7.5, 0.6, 0.1, 5.5, 3.0, 7.1, 5.8, 2.5, 1.4, 6.6, 7.9, 7.2, 6.3, 1.8, 0.1,
  0.4, 0.3, 0.1,
]

interface Fill {
  cells: Int8Array
}

const DONE = -1
const ABORT = -2

/**
 * Remplit la grille case par case (lecture de gauche à droite, de haut en bas).
 * La première ligne et la première colonne alternent case définition / lettre, comme dans les magazines ;
 * ailleurs, chaque case devient une lettre ou une case définition selon ce qui permet de former des mots.
 */
export function fill(W: number, H: number, trie: Trie, family: Int32Array, maxDefs: number, budget: number, rng: () => number): Fill | null {
  const N = W * H
  const cell = new Int8Array(N).fill(UNSET)
  // Pour chaque lettre : nœud du préfixe en cours (-1 si aucun mot ne commence ainsi) et longueur du préfixe.
  const hNode = new Int32Array(N)
  const vNode = new Int32Array(N)
  const hLen = new Int8Array(N)
  const vLen = new Int8Array(N)
  // Un mot déjà placé interdit aussi ses variantes (ÉTÉ / ÉTÉS) : on raisonne par famille.
  const used = new Uint8Array(family.length)
  const familyOf = (node: number) => (node >= 0 && trie.word[node] >= 0 ? family[trie.word[node]] : -1)
  let defs = 0
  let steps = 0

  const fixed = (r: number, c: number) => (r === 0 ? (c % 2 === 0 ? DEF : 0) : c === 0 ? (r % 2 === 0 ? DEF : 0) : UNSET)
  const isLetter = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W && cell[r * W + c] >= 0 && cell[r * W + c] < DEF

  /** Une case définition doit porter au moins un mot (de 2 lettres ou plus). */
  const hasClue = (r: number, c: number) =>
    (isLetter(r, c + 1) && isLetter(r, c + 2)) ||
    (isLetter(r + 1, c) && isLetter(r + 2, c)) ||
    (r === 0 && isLetter(0, c + 1) && isLetter(1, c + 1)) ||
    (c === 0 && isLetter(r + 1, 0) && isLetter(r + 1, 1))

  /** Une lettre doit appartenir à au moins un mot. */
  const orphan = (r: number, c: number) =>
    !isLetter(r, c - 1) && !isLetter(r, c + 1) && !isLetter(r - 1, c) && !isLetter(r + 1, c)

  // Vérifications possibles dès que la case (r, c) est posée.
  const consistent = (r: number, c: number) => {
    if (r >= 2 && cell[(r - 2) * W + c] === DEF && !hasClue(r - 2, c)) return false
    if (isLetter(r - 1, c) && orphan(r - 1, c)) return false
    if (r === H - 1 && c >= 1 && isLetter(r, c - 1) && orphan(r, c - 1)) return false
    if (r >= H - 2 && c >= 3 && cell[r * W + c - 2] === DEF && !isLetter(r, c - 1) && !hasClue(r, c - 2)) return false
    return true
  }

  const complete = () => {
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++) {
        if (cell[r * W + c] === DEF ? !hasClue(r, c) : orphan(r, c)) return false
      }
    return true
  }

  // Retour en arrière « intelligent » (backjumping) : quand une case n'a plus aucune option, on remonte
  // directement à la dernière case qui la contraignait, au lieu de réessayer toutes les cases intermédiaires.
  // conflicts[i] = cases antérieures responsables des échecs rencontrés en dessous de i.
  const conflicts = Array.from({ length: N }, () => new Uint8Array(N))

  /** Les cases qui contraignent (r, c) : son voisinage proche et les mots en cours qui y mènent. */
  const blame = (set: Uint8Array, i: number, r: number, c: number) => {
    for (let rr = Math.max(0, r - 2); rr <= r; rr++)
      for (let cc = Math.max(0, c - 2); cc <= Math.min(W - 1, c + 2); cc++) if (rr * W + cc < i) set[rr * W + cc] = 1
    for (let cc = c - 1; cc >= 0; cc--) {
      set[r * W + cc] = 1
      if (!isLetter(r, cc)) break
    }
    for (let rr = r - 1; rr >= 0; rr--) {
      set[rr * W + c] = 1
      if (!isLetter(rr, c)) break
    }
  }

  /** Échec définitif de la case i : renvoie la case où reprendre, en lui transmettant les responsables. */
  const jump = (i: number, r: number, c: number) => {
    const set = conflicts[i]
    blame(set, i, r, c)
    let target = -1
    for (let j = i - 1; j >= 0; j--)
      if (set[j]) {
        target = j
        break
      }
    if (target >= 0) for (let j = 0; j < target; j++) if (set[j]) conflicts[target][j] = 1
    set.fill(0)
    return target < 0 ? ABORT : target
  }

  const rec = (i: number): number => {
    if (i === N) {
      if (complete()) return DONE
      for (let j = (H - 3) * W; j < N - 1; j++) if (j >= 0) conflicts[N - 1][j] = 1
      return N - 1
    }
    if (++steps > budget) return ABORT
    const r = Math.floor(i / W), c = i % W
    const f = fixed(r, c)
    const leftLetter = isLetter(r, c - 1)
    const upLetter = isLetter(r - 1, c)

    // Chaque option renvoie DONE, ABORT, une case antérieure où sauter, ou i pour « essayer l'option suivante ».
    const placeDef = (): number => {
      let hWord = -1, vWord = -1
      if (leftLetter && hLen[i - 1] >= 2) {
        hWord = familyOf(hNode[i - 1])
        if (hWord < 0 || used[hWord]) return i
      }
      if (upLetter && vLen[i - W] >= 2) {
        vWord = familyOf(vNode[i - W])
        if (vWord < 0 || used[vWord] || vWord === hWord) return i
      }
      cell[i] = DEF
      if (f === UNSET) defs++
      if (hWord >= 0) used[hWord] = 1
      if (vWord >= 0) used[vWord] = 1
      const res = consistent(r, c) ? rec(i + 1) : i
      if (res === DONE) return DONE
      if (hWord >= 0) used[hWord] = 0
      if (vWord >= 0) used[vWord] = 0
      if (f === UNSET) defs--
      cell[i] = UNSET
      return res
    }

    const placeLetter = (l: number): number => {
      const hl = leftLetter ? hLen[i - 1] + 1 : 1
      const vl = upLetter ? vLen[i - W] + 1 : 1
      const hn = !leftLetter ? trie.next[l] || -1 : hNode[i - 1] >= 0 ? trie.next[hNode[i - 1] * 26 + l] || -1 : -1
      const vn = !upLetter ? trie.next[l] || -1 : vNode[i - W] >= 0 ? trie.next[vNode[i - W] * 26 + l] || -1 : -1
      if (hl >= 2 && hn < 0) return i
      if (vl >= 2 && vn < 0) return i

      // Le mot doit pouvoir se terminer avant le bord, et s'il touche le bord il doit être complet.
      let hWord = -1, vWord = -1
      if (hl >= 2) {
        if (c === W - 1) {
          hWord = familyOf(hn)
          if (hWord < 0 || used[hWord]) return i
        } else if (!(trie.lengths[hn] & ((2 << (hl + W - 1 - c)) - 1))) return i
      }
      if (vl >= 2) {
        if (r === H - 1) {
          vWord = familyOf(vn)
          if (vWord < 0 || used[vWord] || vWord === hWord) return i
        } else if (!(trie.lengths[vn] & ((2 << (vl + H - 1 - r)) - 1))) return i
      }

      cell[i] = l
      hNode[i] = hn
      vNode[i] = vn
      hLen[i] = hl
      vLen[i] = vl
      if (hWord >= 0) used[hWord] = 1
      if (vWord >= 0) used[vWord] = 1
      const res = consistent(r, c) ? rec(i + 1) : i
      if (res === DONE) return DONE
      if (hWord >= 0) used[hWord] = 0
      if (vWord >= 0) used[vWord] = 0
      cell[i] = UNSET
      return res
    }

    /** Après une option ratée : soit on continue ici, soit un descendant demande de remonter plus haut. */
    const settle = (res: number) => {
      if (res === DONE || res === ABORT) return res
      if (res < i) {
        conflicts[i].fill(0)
        return res
      }
      return null
    }

    if (f === DEF) return settle(placeDef()) ?? jump(i, r, c)

    const hParent = leftLetter ? hNode[i - 1] : 0
    const vParent = upLetter ? vNode[i - W] : 0
    const hMask = hParent >= 0 ? trie.children[hParent] : 0
    const vMask = vParent >= 0 ? trie.children[vParent] : 0
    // Une lettre seule (sans voisin à gauche ou au-dessus) n'a pas besoin de commencer un mot dans ce sens.
    const mask = (leftLetter ? hMask : ALL_LETTERS) & (upLetter ? vMask : ALL_LETTERS)
    // On essaie d'abord les lettres qui laissent le plus de mots possibles dans les deux sens.
    const letters: { l: number; score: number }[] = []
    for (let l = 0; l < 26; l++) {
      if (!(mask & (1 << l))) continue
      const hn = hParent >= 0 ? trie.next[hParent * 26 + l] : 0
      const vn = vParent >= 0 ? trie.next[vParent * 26 + l] : 0
      const h = trie.count[hn] || 0.5
      const v = trie.count[vn] || 0.5
      // Un mot vertical qu'on peut terminer à la ligne suivante évite de s'engager loin vers le bas.
      const closable = upLetter && vn && trie.word[vn] >= 0 ? 2 : 1
      letters.push({ l, score: Math.sqrt(Math.min(h, v) * LETTER_WEIGHT[l]) * closable * (0.5 + rng()) })
    }
    letters.sort((a, b) => b.score - a.score)

    const defAllowed =
      f === UNSET &&
      defs < maxDefs &&
      (c < W - 1 || r <= H - 3) &&
      (r < H - 2 || c <= W - 3) &&
      !(cell[i - 1] === DEF && cell[i - W] === DEF && cell[i - W - 1] === DEF)

    // Plus les mots en cours sont longs, plus on a envie de les terminer ici.
    const run = Math.max(leftLetter ? hLen[i - 1] : 0, upLetter ? vLen[i - W] : 0)
    const defFirst = defAllowed && rng() < (run >= 5 ? 0.8 : run >= 3 ? 0.45 : run >= 2 ? 0.2 : 0.05)

    if (defFirst) {
      const res = settle(placeDef())
      if (res !== null) return res
    }
    for (const { l } of letters) {
      const res = settle(placeLetter(l))
      if (res !== null) return res
    }
    if (defAllowed && !defFirst) {
      const res = settle(placeDef())
      if (res !== null) return res
    }
    return jump(i, r, c)
  }

  return rec(0) === DONE ? { cells: cell } : null
}

/** Regroupe le singulier et le pluriel d'un mot (ÉTÉ / ÉTÉS, AMI / AMIS). */
export function families(words: string[]): Int32Array {
  const base = (w: string) => (w.length > 2 ? w.replace(/S$/, '') : w)
  const ids = new Map<string, number>()
  return Int32Array.from(words, (w) => {
    const key = base(w)
    if (!ids.has(key)) ids.set(key, ids.size)
    return ids.get(key)!
  })
}

export function generate(size: SizeId, level: Level, rng: () => number = Math.random, entries: Entry[] = DICTIONARY): ArrowWords {
  const { width: W, height: H } = SIZES.find((s) => s.id === size)!
  const words = entries.filter((e) => e.word.length <= Math.min(MAX_WORD_LENGTH, Math.max(W, H)))
  const trie = new Trie(words.map((e) => e.word))
  const maxDefs = Math.round((W - 1) * (H - 1) * DEF_RATIO)
  const family = families(words.map((e) => e.word))

  let result: Fill | null = null
  const start = Date.now()
  while (!result) {
    if (Date.now() - start > TIME_LIMIT_MS) throw new Error('Impossible de générer une grille avec ce dictionnaire')
    result = fill(W, H, trie, family, maxDefs, STEPS_PER_ATTEMPT, rng)
  }

  const cells = result.cells
  const solution = Array.from(cells, (v) => (v === DEF ? null : String.fromCharCode(65 + v)))
  const letter = (r: number, c: number) => r >= 0 && r < H && c >= 0 && c < W && solution[r * W + c] !== null
  const byWord = new Map(words.map((e) => [e.word, e]))
  const clues: Clue[] = []

  const add = (start: number, dr: number, dc: number, def: number, arrow: Arrow) => {
    const out: number[] = []
    for (let r = Math.floor(start / W), c = start % W; letter(r, c); r += dr, c += dc) out.push(r * W + c)
    if (out.length < 2) return
    const answer = out.map((i) => solution[i]).join('')
    const entry = byWord.get(answer)!
    const pool = level === 'facile' ? entry.easy : entry.hard
    const text = pool[Math.floor(rng() * pool.length)]
    clues.push({ def, arrow, text, cells: out, answer })
  }

  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const i = r * W + c
      if (!letter(r, c)) continue
      if (!letter(r, c - 1)) add(i, 0, 1, c > 0 ? i - 1 : i - W, c > 0 ? 'right' : 'downRight')
      if (!letter(r - 1, c)) add(i, 1, 0, r > 0 ? i - W : i - 1, r > 0 ? 'down' : 'rightDown')
    }

  return { width: W, height: H, solution, clues, size, level }
}

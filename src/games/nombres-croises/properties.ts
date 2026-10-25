// Propriétés arithmétiques servant de définitions aux nombres de la grille.
// Les tests sont appelés des centaines de milliers de fois par grille : on calcule sur les nombres, sans chaînes.

export interface Property {
  text: string
  test: (n: number) => boolean
}

function digitsOf(n: number) {
  const ds: number[] = []
  for (; n > 0; n = Math.floor(n / 10)) ds.push(n % 10)
  return ds.reverse()
}

function digitSum(n: number) {
  let s = 0
  for (; n > 0; n = Math.floor(n / 10)) s += n % 10
  return s
}

function digitProduct(n: number) {
  let p = 1
  for (; n > 0; n = Math.floor(n / 10)) p *= n % 10
  return p
}

function reversed(n: number) {
  let r = 0
  for (; n > 0; n = Math.floor(n / 10)) r = r * 10 + (n % 10)
  return r
}

/** Vrai si chaque chiffre est strictement plus grand (ou plus petit) que le précédent. */
function monotonic(n: number, increasing: boolean) {
  let last = n % 10
  for (n = Math.floor(n / 10); n > 0; n = Math.floor(n / 10)) {
    const d = n % 10
    if (increasing ? d >= last : d <= last) return false
    last = d
  }
  return true
}

function allDigits(n: number, ok: (d: number) => boolean) {
  for (; n > 0; n = Math.floor(n / 10)) if (!ok(n % 10)) return false
  return true
}

function distinctDigits(n: number) {
  let seen = 0
  for (; n > 0; n = Math.floor(n / 10)) {
    const bit = 1 << n % 10
    if (seen & bit) return false
    seen |= bit
  }
  return true
}

function isPrime(n: number) {
  if (n < 2) return false
  if (n % 2 === 0) return n === 2
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false
  return true
}

const isSquare = (n: number) => Number.isInteger(Math.sqrt(n))
const isCube = (n: number) => Math.round(Math.cbrt(n)) ** 3 === n

/** Toutes les propriétés vraies pour n, parmi un catalogue fixe. Les tests ne servent qu'à des nombres de même longueur. */
export function propertiesOf(n: number): Property[] {
  const ds = digitsOf(n)
  const k = ds.length
  const out: Property[] = []
  const add = (ok: boolean, text: string, test: (m: number) => boolean) => {
    if (ok) out.push({ text, test })
  }
  const sum = digitSum(n)
  const product = digitProduct(n)
  const first = ds[0], last = ds[k - 1]
  const lead = 10 ** (k - 1)

  add(isPrime(n), 'Nombre premier', isPrime)
  add(isSquare(n), `Carré de ${Math.sqrt(n)}`, (m) => m === n)
  add(isSquare(n), 'Carré parfait', isSquare)
  add(isCube(n), 'Cube parfait', isCube)
  for (const m of [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 15, 17, 19, 25])
    add(n % m === 0 && n !== m, `Multiple de ${m}`, (x) => x % m === 0)
  add(k >= 2, `Somme des chiffres : ${sum}`, (m) => digitSum(m) === sum)
  add(k >= 2 && product > 0, `Produit des chiffres : ${product}`, (m) => digitProduct(m) === product)
  add(k >= 2 && reversed(n) === n, 'Palindrome', (m) => reversed(m) === m)
  add(k >= 3 && monotonic(n, true), 'Chiffres croissants', (m) => monotonic(m, true))
  add(k >= 3 && monotonic(n, false), 'Chiffres décroissants', (m) => monotonic(m, false))
  add(k >= 2 && allDigits(n, (d) => d % 2 === 0), 'Tous les chiffres sont pairs', (m) => allDigits(m, (d) => d % 2 === 0))
  add(k >= 2 && allDigits(n, (d) => d % 2 === 1), 'Tous les chiffres sont impairs', (m) => allDigits(m, (d) => d % 2 === 1))
  add(k >= 3 && distinctDigits(n), 'Chiffres tous différents', distinctDigits)
  add(k >= 2 && allDigits(n, (d) => d === first), 'Un seul chiffre répété', (m) => allDigits(m, (d) => d === m % 10))
  add(true, `Commence par ${first}`, (m) => Math.floor(m / lead) === first)
  add(true, `Finit par ${last}`, (m) => m % 10 === last)
  add(n % 2 === 0, 'Nombre pair', (m) => m % 2 === 0)
  add(n % 2 === 1, 'Nombre impair', (m) => m % 2 === 1)
  // Un encadrement couvrant environ un tiers des nombres de cette longueur.
  const lo = Math.max(lead, Math.floor(n / lead) * lead - lead), hi = lo + 3 * lead - 1
  add(k >= 2, `Entre ${lo} et ${Math.min(hi, 10 ** k - 1)}`, (m) => m >= lo && m <= hi)
  return out
}

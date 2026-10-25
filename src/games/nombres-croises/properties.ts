// Propriétés arithmétiques servant de définitions aux nombres de la grille.

export interface Property {
  text: string
  test: (n: number) => boolean
}

const digitsOf = (n: number) => String(n).split('').map(Number)

function isPrime(n: number) {
  if (n < 2) return false
  if (n % 2 === 0) return n === 2
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false
  return true
}

const isSquare = (n: number) => Number.isInteger(Math.sqrt(n))
const isCube = (n: number) => Math.round(Math.cbrt(n)) ** 3 === n

/** Toutes les propriétés vraies pour n, parmi un catalogue fixe. */
export function propertiesOf(n: number): Property[] {
  const ds = digitsOf(n)
  const k = ds.length
  const out: Property[] = []
  const add = (ok: boolean, text: string, test: (m: number) => boolean) => {
    if (ok) out.push({ text, test })
  }
  const sum = ds.reduce((a, b) => a + b, 0)
  const product = ds.reduce((a, b) => a * b, 1)

  add(isPrime(n), 'Nombre premier', isPrime)
  add(isSquare(n), `Carré de ${Math.sqrt(n)}`, (m) => m === n)
  add(isSquare(n), 'Carré parfait', isSquare)
  add(isCube(n), 'Cube parfait', isCube)
  for (const m of [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 15, 17, 19, 25])
    add(n % m === 0 && n !== m, `Multiple de ${m}`, (x) => x % m === 0)
  add(k >= 2, `Somme des chiffres : ${sum}`, (m) => digitsOf(m).reduce((a, b) => a + b, 0) === sum)
  add(k >= 2 && product > 0, `Produit des chiffres : ${product}`, (m) => digitsOf(m).reduce((a, b) => a * b, 1) === product)
  add(k >= 2 && ds.join('') === [...ds].reverse().join(''), 'Palindrome', (m) => String(m) === String(m).split('').reverse().join(''))
  add(k >= 3 && ds.every((d, i) => i === 0 || d > ds[i - 1]), 'Chiffres croissants', (m) => digitsOf(m).every((d, i, a) => i === 0 || d > a[i - 1]))
  add(k >= 3 && ds.every((d, i) => i === 0 || d < ds[i - 1]), 'Chiffres décroissants', (m) => digitsOf(m).every((d, i, a) => i === 0 || d < a[i - 1]))
  add(k >= 2 && ds.every((d) => d % 2 === 0), 'Tous les chiffres sont pairs', (m) => digitsOf(m).every((d) => d % 2 === 0))
  add(k >= 2 && ds.every((d) => d % 2 === 1), 'Tous les chiffres sont impairs', (m) => digitsOf(m).every((d) => d % 2 === 1))
  add(k >= 3 && new Set(ds).size === k, 'Chiffres tous différents', (m) => new Set(String(m)).size === String(m).length)
  add(k >= 2 && new Set(ds).size === 1, 'Un seul chiffre répété', (m) => new Set(String(m)).size === 1)
  add(true, `Commence par ${ds[0]}`, (m) => String(m)[0] === String(ds[0]))
  add(true, `Finit par ${ds[k - 1]}`, (m) => m % 10 === ds[k - 1])
  add(n % 2 === 0, 'Nombre pair', (m) => m % 2 === 0)
  add(n % 2 === 1, 'Nombre impair', (m) => m % 2 === 1)
  // Un encadrement couvrant environ un tiers des nombres de cette longueur.
  const span = 10 ** (k - 1)
  const lo = Math.max(10 ** (k - 1), Math.floor(n / span) * span - span), hi = lo + 3 * span - 1
  add(k >= 2, `Entre ${lo} et ${Math.min(hi, 10 ** k - 1)}`, (m) => m >= lo && m <= hi)
  return out
}

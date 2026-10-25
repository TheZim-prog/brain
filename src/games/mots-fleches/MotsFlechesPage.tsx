import { useCallback, useEffect, useReducer, useState } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { useTicker } from '../../lib/useTicker'
import { isHorizontal, LEVELS, SIZES, type Arrow, type ArrowWords, type Level, type SizeId } from './config'
import { activeClue, motsFlechesReducer, newGame, type MotsFlechesState } from './state'

const SAVE_KEY = 'brain:mots-fleches:current'
const PREFS_KEY = 'brain:mots-fleches:prefs'
const KEYBOARD = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN']

type Prefs = { size: SizeId; level: Level }

export default function MotsFlechesPage() {
  const [game, setGame] = useState(() => {
    const saved = load<MotsFlechesState>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = ({ size, level }: Prefs) => {
    setLoading(true)
    setError(null)
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ puzzle?: ArrowWords; error?: string }>) => {
      worker.terminate()
      setLoading(false)
      if (e.data.puzzle) {
        const puzzle = e.data.puzzle
        setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(puzzle) }))
      } else setError('La grille n’a pas pu être préparée. Réessaie !')
    }
    worker.postMessage({ size, level })
  }

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <Picker onStart={start} loading={loading} error={error} />
  return <Board key={game.id} initial={game.state} onNewGame={quit} />
}

function Picker({ onStart, loading, error }: { onStart: (p: Prefs) => void; loading: boolean; error: string | null }) {
  const [prefs, setPrefs] = useState<Prefs>(() => load<Prefs>(PREFS_KEY) ?? { size: 'petite', level: 'facile' })
  const update = (p: Partial<Prefs>) => {
    const next = { ...prefs, ...p }
    setPrefs(next)
    save(PREFS_KEY, next)
  }

  return (
    <main className="page">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
      </header>
      <h1 className="title">Mots fléchés</h1>
      <p className="subtitle">Une nouvelle grille à chaque partie</p>

      <h2 className="label">Taille</h2>
      <div className="segmented" role="radiogroup" aria-label="Taille">
        {SIZES.map((s) => (
          <button key={s.id} role="radio" aria-checked={prefs.size === s.id} className={prefs.size === s.id ? 'on' : undefined} onClick={() => update({ size: s.id })}>
            {s.label}
            <small>
              {s.width}×{s.height}
            </small>
          </button>
        ))}
      </div>

      <h2 className="label">Définitions</h2>
      <div className="segmented two" role="radiogroup" aria-label="Définitions">
        {LEVELS.map((l) => (
          <button key={l.id} role="radio" aria-checked={prefs.level === l.id} className={prefs.level === l.id ? 'on' : undefined} onClick={() => update({ level: l.id })}>
            {l.label}
            <small>{l.detail}</small>
          </button>
        ))}
      </div>

      <button className="primary wide" onClick={() => onStart(prefs)} disabled={loading}>
        {loading ? 'Préparation de la grille…' : 'Nouvelle grille'}
      </button>
      {error && <p className="error">{error}</p>}
    </main>
  )
}

/** Petite flèche dessinée au bord de la case définition, vers le début du mot. */
function ArrowMark({ def, arrow, slot, width }: { def: number; arrow: Arrow; slot: 'top' | 'bottom' | 'full'; width: number }) {
  const r = Math.floor(def / width), c = def % width
  const y = r + (slot === 'top' ? 0.25 : slot === 'bottom' ? 0.75 : 0.5)
  const x = c + 0.5
  const h = 0.09
  switch (arrow) {
    case 'right':
      return <path d={`M${c + 1} ${y - h}L${c + 1 + h * 1.4} ${y}L${c + 1} ${y + h}Z`} />
    case 'down':
      return <path d={`M${x - h} ${r + 1}L${x} ${r + 1 + h * 1.4}L${x + h} ${r + 1}Z`} />
    case 'rightDown':
      return (
        <g>
          <path className="stem" d={`M${c + 1} ${y}H${c + 1.16}V${y + 0.1}`} />
          <path d={`M${c + 1.16 - h} ${y + 0.1}L${c + 1.16} ${y + 0.1 + h * 1.4}L${c + 1.16 + h} ${y + 0.1}Z`} />
        </g>
      )
    case 'downRight':
      return (
        <g>
          <path className="stem" d={`M${x} ${r + 1}V${r + 1.16}H${x + 0.1}`} />
          <path d={`M${x + 0.1} ${r + 1.16 - h}L${x + 0.1 + h * 1.4} ${r + 1.16}L${x + 0.1} ${r + 1.16 + h}Z`} />
        </g>
      )
  }
}

function Board({ initial, onNewGame }: { initial: MotsFlechesState; onNewGame: () => void }) {
  const [s, dispatch] = useReducer(motsFlechesReducer, initial)
  const { puzzle } = s
  const { width: W, height: H, solution, clues } = puzzle
  const active = activeClue(s)
  const activeCells = new Set(active === -1 ? [] : clues[active].cells)
  const errors = new Set(s.errors)
  const revealed = new Set(s.revealed)
  const sizeLabel = SIZES.find((x) => x.id === puzzle.size)!.label
  const levelLabel = LEVELS.find((x) => x.id === puzzle.level)!.label

  useEffect(() => save(SAVE_KEY, s), [s])
  useTicker(!s.completed, useCallback(() => dispatch({ type: 'tick' }), []))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[a-zA-Z]$/.test(e.key)) dispatch({ type: 'input', letter: e.key })
      else if (e.key === 'Backspace' || e.key === 'Delete') dispatch({ type: 'erase' })
      else if (e.key === 'ArrowUp') dispatch({ type: 'move', dRow: -1, dCol: 0 })
      else if (e.key === 'ArrowDown') dispatch({ type: 'move', dRow: 1, dCol: 0 })
      else if (e.key === 'ArrowLeft') dispatch({ type: 'move', dRow: 0, dCol: -1 })
      else if (e.key === 'ArrowRight') dispatch({ type: 'move', dRow: 0, dCol: 1 })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Définitions regroupées par case : celle qui part vers la droite en haut, celle qui descend en bas.
  const byDef = new Map<number, number[]>()
  clues.forEach((clue, i) => byDef.set(clue.def, [...(byDef.get(clue.def) ?? []), i]))
  for (const list of byDef.values()) list.sort((a, b) => order(clues[a].arrow) - order(clues[b].arrow))

  const onDefClick = (def: number) => {
    const list = byDef.get(def) ?? []
    if (!list.length) return
    const pos = list.indexOf(active)
    dispatch({ type: 'selectClue', clue: list[pos === -1 ? 0 : (pos + 1) % list.length] })
  }

  const confirmNewGame = () => {
    if (s.completed || window.confirm('Abandonner cette grille ?')) onNewGame()
  }

  return (
    <main className="page mots-fleches">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
        <button className="link" onClick={confirmNewGame}>Nouvelle grille</button>
      </header>

      <div className="stats">
        <span>
          {sizeLabel} · {levelLabel}
        </span>
        <span className="timer">{formatTime(s.elapsed)}</span>
      </div>

      <div className="clue-bar" aria-live="polite">
        {active !== -1 ? (
          <>
            <span className="clue-dir" aria-hidden>
              {isHorizontal(clues[active].arrow) ? '→' : '↓'}
            </span>
            <span>{clues[active].text}</span>
            <span className="clue-len">{clues[active].cells.length} lettres</span>
          </>
        ) : (
          <span className="muted">Touche une case pour commencer</span>
        )}
      </div>

      <div className="arrow-grid" style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, ['--cols' as string]: W }}>
        {solution.map((letter, i) => {
          if (letter === null) {
            const list = byDef.get(i) ?? []
            return (
              <button key={i} className={`def${list.includes(active) ? ' active' : ''}`} onClick={() => onDefClick(i)} aria-label={list.map((k) => clues[k].text).join(' / ')}>
                {list.map((k) => (
                  <span key={k} className={[k === active && 'on', isLong(clues[k].text) && 'long'].filter(Boolean).join(' ') || undefined}>
                    {clues[k].text}
                  </span>
                ))}
              </button>
            )
          }
          const classes = ['cell']
          if (i === s.selected) classes.push('selected')
          else if (activeCells.has(i)) classes.push('word')
          if (errors.has(i)) classes.push('wrong')
          if (revealed.has(i)) classes.push('revealed')
          return (
            <button key={i} className={classes.join(' ')} onClick={() => dispatch({ type: 'selectCell', cell: i })} aria-label={`Ligne ${Math.floor(i / W) + 1}, colonne ${(i % W) + 1}`}>
              {s.entries[i]}
            </button>
          )
        })}
        <svg className="arrows" viewBox={`0 0 ${W} ${H}`} aria-hidden>
          {[...byDef.entries()].flatMap(([def, list]) =>
            list.map((k, n) => <ArrowMark key={k} def={def} arrow={clues[k].arrow} width={W} slot={list.length === 1 ? 'full' : n === 0 ? 'top' : 'bottom'} />),
          )}
        </svg>
      </div>

      <div className="tools">
        <button onClick={() => dispatch({ type: 'check' })}>
          <span aria-hidden>✓</span>Vérifier
        </button>
        <button onClick={() => dispatch({ type: 'revealLetter' })}>
          <span aria-hidden>?</span>Une lettre
        </button>
        <button onClick={() => dispatch({ type: 'revealWord' })}>
          <span aria-hidden>¶</span>Le mot
        </button>
        <button onClick={() => dispatch({ type: 'erase' })}>
          <span aria-hidden>⌫</span>Effacer
        </button>
      </div>

      <div className="keyboard">
        {KEYBOARD.map((row) => (
          <div key={row} className="key-row">
            {[...row].map((k) => (
              <button key={k} onClick={() => dispatch({ type: 'input', letter: k })}>
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {s.completed && (
        <div className="overlay">
          <div className="card">
            <h2>Bravo !</h2>
            <p>
              Grille terminée en <strong>{formatTime(s.elapsed)}</strong>
            </p>
            <p className="muted">
              {s.hints} indice{s.hints > 1 ? 's' : ''}
            </p>
            <button className="primary" onClick={onNewGame}>Nouvelle grille</button>
          </div>
        </div>
      )}
    </main>
  )
}

/** Les définitions longues, ou avec un long mot, passent en plus petit pour tenir dans la case. */
function isLong(text: string) {
  return text.length > 16 || text.split(/\s+/).some((w) => w.length > 10)
}

/** Ordre d'affichage dans une case : les mots qui partent vers la droite en haut. */
function order(arrow: Arrow) {
  return arrow === 'right' || arrow === 'rightDown' ? 0 : 1
}

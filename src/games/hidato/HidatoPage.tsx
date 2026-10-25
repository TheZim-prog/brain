import { Fragment, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { useTicker } from '../../lib/useTicker'
import { DIFFICULTIES, generate, makeBoard, SHAPES, sizeCount, SIZES, type Difficulty, type Shape, type SizeId } from './generator'
import { conflicts, hidatoReducer, newGame, type HidatoState } from './state'

const SAVE_KEY = 'brain:hidato:current'
const PREFS_KEY = 'brain:hidato:prefs'

interface Prefs {
  shape: Shape
  size: SizeId
  difficulty: Difficulty
}

export default function HidatoPage() {
  const [game, setGame] = useState(() => {
    const saved = load<HidatoState>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })

  const start = ({ shape, size, difficulty }: Prefs) =>
    setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(generate(shape, size, difficulty)) }))

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <Picker onStart={start} />
  return <Board key={game.id} initial={game.state} onNewGame={quit} />
}

function Picker({ onStart }: { onStart: (p: Prefs) => void }) {
  const [prefs, setPrefs] = useState<Prefs>(() => load<Prefs>(PREFS_KEY) ?? { shape: 'hexagone', size: 'moyenne', difficulty: 'facile' })
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
      <h1 className="title">Hidato</h1>
      <p className="subtitle">Place les nombres pour que chacun touche le suivant</p>

      <h2 className="label">Forme</h2>
      <div className="segmented" role="radiogroup" aria-label="Forme">
        {SHAPES.map((s) => (
          <button key={s.id} role="radio" aria-checked={prefs.shape === s.id} className={prefs.shape === s.id ? 'on' : undefined} onClick={() => update({ shape: s.id })}>
            {s.label}
            <small>{s.detail}</small>
          </button>
        ))}
      </div>

      <h2 className="label">Taille</h2>
      <div className="segmented" role="radiogroup" aria-label="Taille">
        {SIZES.map((s) => (
          <button key={s.id} role="radio" aria-checked={prefs.size === s.id} className={prefs.size === s.id ? 'on' : undefined} onClick={() => update({ size: s.id })}>
            {s.label}
            <small>1 à {sizeCount(prefs.shape, s.id)}</small>
          </button>
        ))}
      </div>

      <h2 className="label">Difficulté</h2>
      <div className="segmented" role="radiogroup" aria-label="Difficulté">
        {DIFFICULTIES.map((d) => (
          <button key={d.id} role="radio" aria-checked={prefs.difficulty === d.id} className={prefs.difficulty === d.id ? 'on' : undefined} onClick={() => update({ difficulty: d.id })}>
            {d.label}
          </button>
        ))}
      </div>

      <button className="primary wide" onClick={() => onStart(prefs)}>
        Nouvelle grille
      </button>
    </main>
  )
}

function Board({ initial, onNewGame }: { initial: HidatoState; onNewGame: () => void }) {
  const [s, dispatch] = useReducer(hidatoReducer, initial)
  const { puzzle, values } = s
  const board = useMemo(() => makeBoard(puzzle.shape, puzzle.size), [puzzle.shape, puzzle.size])
  const N = board.count
  const bad = conflicts(puzzle, values)
  const revealed = new Set(s.revealed)
  const shape = SHAPES.find((x) => x.id === puzzle.shape)!
  const levelLabel = DIFFICULTIES.find((x) => x.id === puzzle.difficulty)!.label

  useEffect(() => save(SAVE_KEY, s), [s])
  useTicker(!s.completed, useCallback(() => dispatch({ type: 'tick' }), []))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) dispatch({ type: 'undo' })
      else if (e.ctrlKey || e.metaKey || e.altKey) return
      else if (/^[0-9]$/.test(e.key)) dispatch({ type: 'digit', digit: Number(e.key) })
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

  // Traits entre nombres consécutifs bien voisins : on voit le chemin se dessiner.
  const cellOf = new Map<number, number>()
  values.forEach((v, i) => {
    if (v) cellOf.set(v, cellOf.has(v) ? -1 : i)
  })
  const links: [number, number][] = []
  for (let v = 1; v < N; v++) {
    const a = cellOf.get(v), b = cellOf.get(v + 1)
    if (a !== undefined && b !== undefined && a >= 0 && b >= 0 && board.neighbors[a].includes(b)) links.push([a, b])
  }
  const missing = Array.from({ length: N }, (_, i) => i + 1).filter((v) => !cellOf.has(v))
  const outline = board.outline.map((p) => `${p.x},${p.y}`).join(' ')
  const margin = 0.08

  const confirmNewGame = () => {
    if (s.completed || window.confirm('Abandonner cette grille ?')) onNewGame()
  }

  return (
    <main className="page hidato">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
        <button className="link" onClick={confirmNewGame}>Nouvelle grille</button>
      </header>

      <div className="stats">
        <span>
          {shape.label} {shape.id === 'hexagone' ? '' : `(${shape.detail.toLowerCase()})`} · 1 à {N} · {levelLabel}
        </span>
        <span className="timer">{formatTime(s.elapsed)}</span>
      </div>

      <svg
        className="hidato-board"
        viewBox={`${-margin} ${-margin} ${board.width + 2 * margin} ${board.height + 2 * margin}`}
        role="grid"
        aria-label={`Grille de 1 à ${N}`}
      >
        {board.centers.map((c, i) => {
          const classes = ['hcell']
          if (puzzle.given[i]) classes.push('given')
          if (i === s.selected) classes.push('selected')
          return (
            <polygon
              key={i}
              className={classes.join(' ')}
              points={outline}
              transform={`translate(${c.x} ${c.y})`}
              onClick={() => dispatch({ type: 'select', cell: i })}
            />
          )
        })}
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} className="hlink" x1={board.centers[a].x} y1={board.centers[a].y} x2={board.centers[b].x} y2={board.centers[b].y} />
        ))}
        {board.centers.map((c, i) =>
          values[i] ? (
            <text
              key={i}
              className={['hnum', puzzle.given[i] ? 'given' : 'user', bad.has(i) ? 'wrong' : '', revealed.has(i) ? 'revealed' : ''].join(' ')}
              x={c.x}
              y={c.y}
              fontSize={values[i] >= 10 ? 0.4 : 0.48}
            >
              {values[i]}
            </text>
          ) : null,
        )}
      </svg>

      <div className="tools">
        <button onClick={() => dispatch({ type: 'undo' })} disabled={!s.history.length || s.completed}>
          <span aria-hidden>↶</span>Annuler
        </button>
        <button onClick={() => dispatch({ type: 'erase' })}>
          <span aria-hidden>⌫</span>Effacer
        </button>
        <button onClick={() => dispatch({ type: 'hint' })}>
          <span aria-hidden>?</span>Indice
        </button>
      </div>

      <div className="numpad hidato-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
          <button key={d} onClick={() => dispatch({ type: 'digit', digit: d })}>
            {d}
          </button>
        ))}
      </div>

      {missing.length > 0 && (
        <p className="missing">
          <span className="muted">Il manque : </span>
          {missing.map((v, k) => (
            <Fragment key={v}>
              {k > 0 && ' '}
              <span>{v}</span>
            </Fragment>
          ))}
        </p>
      )}

      {s.completed && (
        <div className="overlay">
          <div className="card">
            <h2>Bravo !</h2>
            <p>
              Chemin complet en <strong>{formatTime(s.elapsed)}</strong>
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

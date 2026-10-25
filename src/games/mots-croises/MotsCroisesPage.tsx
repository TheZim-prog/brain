import { Fragment, useCallback, useEffect, useReducer, useState } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { useTicker } from '../../lib/useTicker'
import { activeClue, gridReducer, newGame, type GridState } from '../mots/state'
import { LEVELS, type Direction } from '../mots/types'
import { ClueBar, GridPicker, GridTools, Keyboard, requestPuzzle, useGridKeyboard, Victory, type GridPrefs } from '../mots/ui'
import { lineLabel, roman, SIZES, type Crossword, type SizeId } from './config'

const SAVE_KEY = 'brain:mots-croises:current'

type State = GridState<Crossword>

export default function MotsCroisesPage() {
  const [game, setGame] = useState(() => {
    const saved = load<State>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = ({ size, level }: GridPrefs<SizeId>) => {
    setLoading(true)
    setError(null)
    requestPuzzle<Crossword>({ game: 'croises', size, level })
      .then((puzzle) => setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(puzzle) })))
      .catch(() => setError('La grille n’a pas pu être préparée. Réessaie !'))
      .finally(() => setLoading(false))
  }

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <GridPicker title="Mots croisés" prefsKey="brain:mots-croises:prefs" sizes={SIZES} onStart={start} loading={loading} error={error} />
  return <Board key={game.id} initial={game.state} onNewGame={quit} />
}

function Board({ initial, onNewGame }: { initial: State; onNewGame: () => void }) {
  const [s, dispatch] = useReducer(gridReducer<State>, initial)
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
  useGridKeyboard(dispatch)

  const confirmNewGame = () => {
    if (s.completed || window.confirm('Abandonner cette grille ?')) onNewGame()
  }

  /** Définitions d'un sens, regroupées par ligne ou par colonne comme dans les magazines. */
  const lines = (dir: Direction) => {
    const byLine = new Map<number, number[]>()
    clues.forEach((c, k) => {
      if (c.dir === dir) byLine.set(c.line, [...(byLine.get(c.line) ?? []), k])
    })
    return [...byLine.entries()]
  }

  return (
    <main className="page mots-croises">
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

      <ClueBar clue={clues[active]} prefix={active === -1 ? undefined : `${lineLabel(clues[active])} ${clues[active].dir === 'h' ? '→' : '↓'}`} />

      <div className="cross-wrap">
        <span />
        <div className="col-labels" style={{ gridTemplateColumns: `repeat(${W}, 1fr)` }}>
          {Array.from({ length: W }, (_, c) => (
            <span key={c}>{c + 1}</span>
          ))}
        </div>
        <div className="row-labels" style={{ gridTemplateRows: `repeat(${H}, 1fr)` }}>
          {Array.from({ length: H }, (_, r) => (
            <span key={r}>{roman(r + 1)}</span>
          ))}
        </div>
        <div className="arrow-grid cross" style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, ['--cols' as string]: W }}>
          {solution.map((letter, i) => {
            if (letter === null) return <span key={i} className="black" />
            const classes = ['cell']
            if (i === s.selected) classes.push('selected')
            else if (activeCells.has(i)) classes.push('word')
            if (errors.has(i)) classes.push('wrong')
            if (revealed.has(i)) classes.push('revealed')
            return (
              <button key={i} className={classes.join(' ')} onClick={() => dispatch({ type: 'selectCell', cell: i })} aria-label={`Ligne ${roman(Math.floor(i / W) + 1)}, colonne ${(i % W) + 1}`}>
                {s.entries[i]}
              </button>
            )
          })}
        </div>
      </div>

      <GridTools dispatch={dispatch} />
      <Keyboard dispatch={dispatch} />

      <section className="clue-lists">
        {(['h', 'v'] as const).map((dir) => (
          <div key={dir}>
            <h2>{dir === 'h' ? 'Horizontalement' : 'Verticalement'}</h2>
            <ol>
              {lines(dir).map(([line, ks]) => (
                <li key={line}>
                  <b>{dir === 'h' ? roman(line + 1) : line + 1}.</b>{' '}
                  {ks.map((k, n) => (
                    <Fragment key={k}>
                      {n > 0 && ' – '}
                      <button className={k === active ? 'on' : undefined} onClick={() => dispatch({ type: 'selectClue', clue: k })}>
                        {/[.!?…]$/.test(clues[k].text) ? clues[k].text : `${clues[k].text}.`}
                      </button>
                    </Fragment>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      {s.completed && <Victory elapsed={s.elapsed} hints={s.hints} onNewGame={onNewGame} />}
    </main>
  )
}

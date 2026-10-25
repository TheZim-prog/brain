// Plateau de grille à cases noires numérotées (I, II… / 1, 2…), commun aux mots croisés et aux nombres croisés.
import { Fragment, useCallback, useEffect, useReducer } from 'react'
import { formatTime } from '../../lib/format'
import { save } from '../../lib/storage'
import { useTicker } from '../../lib/useTicker'
import { activeClue, gridReducer, type GridState } from '../mots/state'
import type { Direction, WordPuzzle } from '../mots/types'
import { ClueBar, GridTools, Keyboard, useGridKeyboard, Victory } from '../mots/ui'
import { lineLabel, roman, type CrossClue } from './config'

type State = GridState<WordPuzzle<CrossClue>>

export function CrossBoard(props: {
  initial: State
  saveKey: string
  /** Ce qu'affiche la ligne d'état, par exemple « Moyenne · Facile ». */
  label: string
  digits?: boolean
  onNewGame: () => void
}) {
  const { saveKey, digits = false, onNewGame } = props
  const [s, dispatch] = useReducer(gridReducer<State>, props.initial)
  const { puzzle } = s
  const { width: W, height: H, solution, clues } = puzzle
  const active = activeClue(s)
  const activeCells = new Set(active === -1 ? [] : clues[active].cells)
  const errors = new Set(s.errors)
  const revealed = new Set(s.revealed)

  useEffect(() => save(saveKey, s), [s, saveKey])
  useTicker(!s.completed, useCallback(() => dispatch({ type: 'tick' }), []))
  useGridKeyboard(dispatch, digits)

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
        <span>{props.label}</span>
        <span className="timer">{formatTime(s.elapsed)}</span>
      </div>

      <ClueBar
        clue={clues[active]}
        unit={digits ? 'chiffres' : 'lettres'}
        prefix={active === -1 ? undefined : `${lineLabel(clues[active])} ${clues[active].dir === 'h' ? '→' : '↓'}`}
      />

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

      <GridTools dispatch={dispatch} numbers={digits} />
      <Keyboard dispatch={dispatch} digits={digits} />

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
                      {/* Un vrai bouton reste un bloc insécable : un texte cliquable coule avec le reste de la ligne. */}
                      <span
                        role="button"
                        tabIndex={0}
                        className={k === active ? 'clue-link on' : 'clue-link'}
                        onClick={() => dispatch({ type: 'selectClue', clue: k })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            dispatch({ type: 'selectClue', clue: k })
                          }
                        }}
                      >
                        {/[.!?…]$/.test(clues[k].text) ? clues[k].text : `${clues[k].text}.`}
                      </span>
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

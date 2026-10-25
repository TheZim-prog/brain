import { useEffect, useReducer, useState } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { DIFFICULTIES, generate, type Difficulty } from './generator'
import { boxOf, colOf, rowOf } from './solver'
import { newGame, sudokuReducer, type SudokuState } from './state'

const SAVE_KEY = 'brain:sudoku:current'

export default function SudokuPage() {
  const [game, setGame] = useState(() => {
    const saved = load<SudokuState>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })

  const start = (difficulty: Difficulty) => setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(generate(difficulty)) }))

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <DifficultyPicker onPick={start} />
  return <SudokuBoard key={game.id} initial={game.state} onNewGame={quit} />
}

function DifficultyPicker({ onPick }: { onPick: (d: Difficulty) => void }) {
  return (
    <main className="page">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
      </header>
      <h1 className="title">Sudoku</h1>
      <p className="subtitle">Choisis ton niveau</p>
      <div className="difficulties">
        {DIFFICULTIES.map((d) => (
          <button key={d.id} className="difficulty" onClick={() => onPick(d.id)}>
            <span>{d.label}</span>
            <small>{d.clues} indices</small>
          </button>
        ))}
      </div>
    </main>
  )
}

function SudokuBoard({ initial, onNewGame }: { initial: SudokuState; onNewGame: () => void }) {
  const [s, dispatch] = useReducer(sudokuReducer, initial)

  useEffect(() => save(SAVE_KEY, s), [s])

  useEffect(() => {
    if (s.completed) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') dispatch({ type: 'tick' })
    }, 1000)
    return () => clearInterval(id)
  }, [s.completed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') dispatch({ type: 'input', digit: Number(e.key) })
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') dispatch({ type: 'erase' })
      else if (e.key === 'ArrowUp') dispatch({ type: 'move', dRow: -1, dCol: 0 })
      else if (e.key === 'ArrowDown') dispatch({ type: 'move', dRow: 1, dCol: 0 })
      else if (e.key === 'ArrowLeft') dispatch({ type: 'move', dRow: 0, dCol: -1 })
      else if (e.key === 'ArrowRight') dispatch({ type: 'move', dRow: 0, dCol: 1 })
      else if (e.key.toLowerCase() === 'n') dispatch({ type: 'toggleNotes' })
      else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) dispatch({ type: 'undo' })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sel = s.selected
  const selDigit = sel !== null ? s.values[sel] : 0
  const remaining = (d: number) => 9 - s.values.filter((v, i) => v === d && v === s.solution[i]).length
  const label = DIFFICULTIES.find((d) => d.id === s.difficulty)!.label

  const confirmNewGame = () => {
    if (s.completed || window.confirm('Abandonner cette grille ?')) onNewGame()
  }

  return (
    <main className="page sudoku">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
        <button className="link" onClick={confirmNewGame}>Nouvelle grille</button>
      </header>

      <div className="stats">
        <span>{label}</span>
        <span>Erreurs : {s.mistakes}</span>
        <span className="timer">{formatTime(s.elapsed)}</span>
      </div>

      <div className="board" role="grid" aria-label="Grille de sudoku">
        {s.values.map((v, i) => {
          const classes = ['cell']
          if (s.puzzle[i]) classes.push('given')
          else if (v && v !== s.solution[i]) classes.push('wrong')
          if (i === sel) classes.push('selected')
          else if (sel !== null && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel)))
            classes.push('peer')
          if (v && v === selDigit && i !== sel) classes.push('same')
          if (colOf(i) % 3 === 2 && colOf(i) !== 8) classes.push('edge-right')
          if (rowOf(i) % 3 === 2 && rowOf(i) !== 8) classes.push('edge-bottom')
          return (
            <button
              key={i}
              role="gridcell"
              className={classes.join(' ')}
              onClick={() => dispatch({ type: 'select', cell: i })}
              aria-label={`Ligne ${rowOf(i) + 1}, colonne ${colOf(i) + 1}${v ? `, ${v}` : ', vide'}`}
            >
              {v ? (
                v
              ) : s.notes[i] ? (
                <span className="notes">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <span key={d} className={selDigit === d ? 'hl' : undefined}>
                      {s.notes[i] & (1 << d) ? d : ''}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="tools">
        <button onClick={() => dispatch({ type: 'undo' })} disabled={!s.history.length || s.completed}>
          <span aria-hidden>↶</span>Annuler
        </button>
        <button onClick={() => dispatch({ type: 'erase' })}>
          <span aria-hidden>⌫</span>Effacer
        </button>
        <button onClick={() => dispatch({ type: 'toggleNotes' })} className={s.notesMode ? 'on' : undefined} aria-pressed={s.notesMode}>
          <span aria-hidden>{'✎︎'}</span>Notes {s.notesMode ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => dispatch({ type: 'hint' })}>
          <span aria-hidden>?</span>Indice
        </button>
      </div>

      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const left = remaining(d)
          return (
            <button key={d} onClick={() => dispatch({ type: 'input', digit: d })} disabled={left === 0} className={left === 0 ? 'done' : undefined}>
              {d}
              <small>{left || ''}</small>
            </button>
          )
        })}
      </div>

      {s.completed && (
        <div className="overlay">
          <div className="card">
            <h2>Bravo !</h2>
            <p>
              Grille {label.toLowerCase()} terminée en <strong>{formatTime(s.elapsed)}</strong>
            </p>
            <p className="muted">
              {s.mistakes} erreur{s.mistakes > 1 ? 's' : ''} · {s.hints} indice{s.hints > 1 ? 's' : ''}
            </p>
            <button className="primary" onClick={onNewGame}>Nouvelle grille</button>
          </div>
        </div>
      )}
    </main>
  )
}

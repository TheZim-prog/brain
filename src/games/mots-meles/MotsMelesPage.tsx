import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react'
import { formatTime } from '../../lib/format'
import { load, remove, save } from '../../lib/storage'
import { useTicker } from '../../lib/useTicker'
import { DIFFICULTIES, generate, type Difficulty } from './generator'
import { allWordsFound, lineCells, motsMelesReducer, newGame, snapEnd, type MotsMelesState } from './state'
import { normalize, THEMES } from './themes'

const SAVE_KEY = 'brain:mots-meles:current'
const DIFFICULTY_KEY = 'brain:mots-meles:difficulty'
const HIGHLIGHTS = 6

export default function MotsMelesPage() {
  const [game, setGame] = useState(() => {
    const saved = load<MotsMelesState>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })

  const start = (difficulty: Difficulty, themeId: string) =>
    setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(generate(difficulty, themeId)) }))

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <Picker onPick={start} />
  return <Board key={game.id} initial={game.state} onNewGame={quit} />
}

function Picker({ onPick }: { onPick: (d: Difficulty, themeId: string) => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>(() => load<Difficulty>(DIFFICULTY_KEY) ?? 'facile')
  const choose = (d: Difficulty) => {
    setDifficulty(d)
    save(DIFFICULTY_KEY, d)
  }
  const random = () => onPick(difficulty, THEMES[Math.floor(Math.random() * THEMES.length)].id)

  return (
    <main className="page">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
      </header>
      <h1 className="title">Mots mêlés</h1>
      <p className="subtitle">{DIFFICULTIES.find((d) => d.id === difficulty)!.detail}</p>

      <div className="segmented" role="radiogroup" aria-label="Difficulté">
        {DIFFICULTIES.map((d) => (
          <button key={d.id} role="radio" aria-checked={d.id === difficulty} className={d.id === difficulty ? 'on' : undefined} onClick={() => choose(d.id)}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="themes">
        <button className="theme random" onClick={random}>Thème au hasard</button>
        {THEMES.map((t) => (
          <button key={t.id} className="theme" onClick={() => onPick(difficulty, t.id)}>
            {t.name}
          </button>
        ))}
      </div>
    </main>
  )
}

function Board({ initial, onNewGame }: { initial: MotsMelesState; onNewGame: () => void }) {
  const [s, dispatch] = useReducer(motsMelesReducer, initial)
  const { size, grid, words, mystery } = s.puzzle
  const theme = THEMES.find((t) => t.id === s.puzzle.themeId)!
  const label = DIFFICULTIES.find((d) => d.id === s.puzzle.difficulty)!.label
  const wordsDone = allWordsFound(s)

  useEffect(() => save(SAVE_KEY, s), [s])
  useTicker(!s.completed, useCallback(() => dispatch({ type: 'tick' }), []))

  // Sélection en cours : par glisser, ou en touchant la première puis la dernière lettre.
  const boardRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [anchor, setAnchor] = useState<number | null>(null)
  const [miss, setMiss] = useState(false)

  const cellAt = (e: PointerEvent) => {
    const rect = boardRef.current!.getBoundingClientRect()
    const col = Math.min(size - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * size)))
    const row = Math.min(size - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * size)))
    return row * size + col
  }

  // Les événements pointeur peuvent arriver plus vite que les rendus : on lit et écrit la sélection via des refs.
  const dragRef = useRef(drag)
  const anchorRef = useRef(anchor)
  const updateDrag = (d: typeof drag) => {
    dragRef.current = d
    setDrag(d)
  }
  const updateAnchor = (a: number | null) => {
    anchorRef.current = a
    setAnchor(a)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (wordsDone) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const cell = cellAt(e)
    const from = anchorRef.current ?? cell
    updateDrag({ from, to: snapEnd(size, from, cell) })
  }

  const onPointerMove = (e: PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const to = snapEnd(size, d.from, cellAt(e))
    if (to !== d.to) updateDrag({ ...d, to })
  }

  const onPointerUp = () => {
    const d = dragRef.current
    if (!d) return
    updateDrag(null)
    if (d.from === d.to) {
      updateAnchor(anchorRef.current === null ? d.from : null)
      return
    }
    updateAnchor(null)
    const cells = lineCells(size, d.from, d.to)!
    const text = cells.map((c) => grid[c]).join('')
    const reversed = [...text].reverse().join('')
    if (!words.some((w) => w.letters === text || w.letters === reversed)) {
      setMiss(true)
      setTimeout(() => setMiss(false), 400)
    }
    dispatch({ type: 'submit', cells })
  }

  const foundWords = new Set(s.found.map((f) => f.word))
  const usedCells = new Set(words.flatMap((w) => w.cells))
  const sortedWords = words.map((w, i) => ({ ...w, i })).sort((a, b) => a.letters.localeCompare(b.letters))

  const capsule = (cells: number[], key: string, className: string, style?: CSSProperties) => {
    const a = cells[0], b = cells[cells.length - 1]
    return (
      <line
        key={key}
        className={className}
        style={style}
        x1={(a % size) + 0.5}
        y1={Math.floor(a / size) + 0.5}
        x2={(b % size) + 0.5}
        y2={Math.floor(b / size) + 0.5}
      />
    )
  }

  const confirmNewGame = () => {
    if (s.completed || window.confirm('Abandonner cette grille ?')) onNewGame()
  }

  return (
    <main className="page mots-meles">
      <header className="topbar">
        <a href="#/" className="back">← Jeux</a>
        <button className="link" onClick={confirmNewGame}>Nouvelle grille</button>
      </header>

      <div className="stats">
        <span>
          {theme.name} · {label}
        </span>
        <span>
          {s.found.length}/{words.length}
        </span>
        <span className="timer">{formatTime(s.elapsed)}</span>
      </div>

      <div
        ref={boardRef}
        className={`letters${miss ? ' miss' : ''}`}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, fontSize: `min(${(52 / size).toFixed(2)}vw, ${(260 / size).toFixed(1)}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => updateDrag(null)}
      >
        <svg className="capsules" viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {s.found.map((f) => capsule(f.cells, `f${f.word}`, 'found', { stroke: `var(--hl-${(f.word % HIGHLIGHTS) + 1})` }))}
          {drag && capsule(lineCells(size, drag.from, drag.to)!, 'drag', 'current')}
        </svg>
        {grid.map((letter, i) => {
          const classes = ['letter']
          if (i === anchor) classes.push('anchor')
          if (i === s.hintCell) classes.push('hint')
          if (wordsDone && !usedCells.has(i)) classes.push('leftover')
          return (
            <span key={i} className={classes.join(' ')}>
              {letter}
            </span>
          )
        })}
      </div>

      {wordsDone && mystery ? (
        <MysteryPanel
          length={mystery.letters.length}
          letters={grid.filter((_, i) => !usedCells.has(i)).join('')}
          onGuess={(guess) => dispatch({ type: 'guessMystery', guess })}
          onReveal={() => dispatch({ type: 'revealMystery' })}
        />
      ) : (
        <>
          <ul className="wordlist">
            {sortedWords.map((w) => (
              <li key={w.i} className={foundWords.has(w.i) ? 'done' : undefined}>
                {w.label}
              </li>
            ))}
          </ul>
          <div className="tools single">
            <button onClick={() => dispatch({ type: 'hint' })} disabled={wordsDone}>
              <span aria-hidden>?</span>Indice
            </button>
          </div>
        </>
      )}

      {s.completed && (
        <div className="overlay">
          <div className="card">
            <h2>Bravo !</h2>
            {mystery && (
              <p>
                Mot mystère : <strong>{mystery.label.toUpperCase()}</strong>
              </p>
            )}
            <p>
              {words.length} mots trouvés en <strong>{formatTime(s.elapsed)}</strong>
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

function MysteryPanel(props: { length: number; letters: string; onGuess: (g: string) => void; onReveal: () => void }) {
  const [guess, setGuess] = useState('')
  const [wrong, setWrong] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    props.onGuess(guess)
    setWrong(normalize(guess) !== props.letters)
  }

  return (
    <form className="mystery" onSubmit={submit}>
      <h2>Mot mystère</h2>
      <p className="muted">
        Tous les mots sont trouvés ! Les {props.length} lettres restantes, lues dans l’ordre, forment un mot du thème.
      </p>
      <div className="mystery-row">
        <input
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value)
            setWrong(false)
          }}
          maxLength={props.length + 4}
          placeholder={'_ '.repeat(props.length).trim()}
          aria-label="Mot mystère"
          aria-invalid={wrong}
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button className="primary" type="submit">Valider</button>
      </div>
      {wrong && <p className="error">Ce n’est pas ça…</p>}
      <button type="button" className="link" onClick={props.onReveal}>
        Je donne ma langue au chat
      </button>
    </form>
  )
}

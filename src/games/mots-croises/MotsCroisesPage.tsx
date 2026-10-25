import { useState } from 'react'
import { load, remove } from '../../lib/storage'
import { useCancellable } from '../../lib/worker'
import { newGame, type GridState } from '../mots/state'
import { LEVELS } from '../mots/types'
import { GridPicker, requestPuzzle, type GridPrefs } from '../mots/ui'
import { SIZES, type Crossword, type SizeId } from './config'
import { CrossBoard } from './CrossBoard'

const SAVE_KEY = 'brain:mots-croises:current'

type State = GridState<Crossword>

export default function MotsCroisesPage() {
  const [game, setGame] = useState(() => {
    const saved = load<State>(SAVE_KEY)
    return saved && !saved.completed ? { id: 0, state: saved } : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextSignal = useCancellable()

  const start = ({ size, level }: GridPrefs<SizeId>) => {
    const signal = nextSignal()
    setLoading(true)
    setError(null)
    requestPuzzle<Crossword>({ game: 'croises', size, level }, signal)
      .then((puzzle) => setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(puzzle) })))
      .catch(() => signal.aborted || setError('La grille n’a pas pu être préparée. Réessaie !'))
      .finally(() => signal.aborted || setLoading(false))
  }

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game) return <GridPicker title="Mots croisés" prefsKey="brain:mots-croises:prefs" sizes={SIZES} onStart={start} loading={loading} error={error} />
  const { puzzle } = game.state
  const label = `${SIZES.find((x) => x.id === puzzle.size)!.label} · ${LEVELS.find((x) => x.id === puzzle.level)!.label}`
  return <CrossBoard key={game.id} initial={game.state} saveKey={SAVE_KEY} label={label} onNewGame={quit} />
}

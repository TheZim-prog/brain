import { useState } from 'react'
import { load, remove } from '../../lib/storage'
import { runWorker, useCancellable } from '../../lib/worker'
import { CrossBoard } from '../mots-croises/CrossBoard'
import { newGame, type GridState } from '../mots/state'
import { GridPicker, type GridPrefs } from '../mots/ui'
import { LEVELS, SIZES, type NumberCross, type SizeId } from './generator'

const SAVE_KEY = 'brain:nombres-croises:current'

type State = GridState<NumberCross>

export default function NombresCroisesPage() {
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
    runWorker<NumberCross>(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }), { size, level }, { signal })
      .then((puzzle) => setGame((g) => ({ id: (g?.id ?? 0) + 1, state: newGame(puzzle) })))
      .catch(() => signal.aborted || setError('La grille n’a pas pu être préparée. Réessaie !'))
      .finally(() => signal.aborted || setLoading(false))
  }

  const quit = () => {
    remove(SAVE_KEY)
    setGame(null)
  }

  if (!game)
    return <GridPicker title="Nombres croisés" prefsKey="brain:nombres-croises:prefs" sizes={SIZES} levels={LEVELS} onStart={start} loading={loading} error={error} />
  const { puzzle } = game.state
  const label = `${SIZES.find((x) => x.id === puzzle.size)!.label} · ${LEVELS.find((x) => x.id === puzzle.level)!.label}`
  return <CrossBoard key={game.id} initial={game.state} saveKey={SAVE_KEY} label={label} digits onNewGame={quit} />
}

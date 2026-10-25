import { runWorker } from '../../lib/worker'
import { CrossBoard } from '../mots-croises/CrossBoard'
import { gameLabel, GridPicker, useGeneratedGame } from '../mots/ui'
import { LEVELS, SIZES, type NumberCross, type SizeId } from './generator'

const SAVE_KEY = 'brain:nombres-croises:current'

export default function NombresCroisesPage() {
  const { game, loading, error, start, quit } = useGeneratedGame<NumberCross, SizeId>(SAVE_KEY, (prefs, signal) =>
    runWorker<NumberCross>(new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }), prefs, { signal }),
  )

  if (!game)
    return (
      <GridPicker
        title="Nombres croisés"
        prefsKey="brain:nombres-croises:prefs"
        sizes={SIZES}
        levels={LEVELS}
        levelsTitle="Indices"
        onStart={start}
        loading={loading}
        error={error}
      />
    )
  return <CrossBoard key={game.id} initial={game.state} saveKey={SAVE_KEY} label={gameLabel(SIZES, LEVELS, game.state.puzzle)} digits onNewGame={quit} />
}

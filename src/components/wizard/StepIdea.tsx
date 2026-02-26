'use client';

import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  idea: string;
  setIdea: (v: string) => void;
  onNext: () => void;
}

const EXAMPLES = [
  'Pablo y Esteban son agentes del Mossad encubiertos en Buenos Aires buscando un USB con información clasificada.',
  'El grupo descubre que Lucía lleva meses organizando en secreto una boda sorpresa para todos... incluyendo al novio.',
  'Martín convence a sus amigos de abrir un restaurante de sushi kosher en pleno centro porteño. Todo sale mal.',
  'Un documental expone quién se comió el último pedazo de pizza en el depto compartido. Las teorías conspirativas explotan.',
];

export default function StepIdea({ idea, setIdea, onNext }: Props) {
  const canProceed = idea.trim().length >= 10;

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Paso 1 de 4</div>
        <h1 className="text-3xl font-black mb-2">¿Cuál es la idea?</h1>
        <p className="text-zinc-400">
          Contanos de qué trata tu película. Sé específico: personajes, situación, conflicto.
        </p>
      </div>

      {/* Main input */}
      <div className="mb-6">
        <Textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="Describí la premisa de tu película..."
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[140px] text-base resize-none focus:border-[#E8793A] transition-colors"
          maxLength={600}
          autoFocus
        />
        <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
          <span>Mínimo 10 caracteres</span>
          <span>{idea.length}/600</span>
        </div>
      </div>

      {/* Examples */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500/70" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Ejemplos para inspirarte</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setIdea(ex)}
              className="text-left text-sm text-zinc-400 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold px-8 disabled:opacity-40"
        >
          Siguiente →
        </Button>
      </div>
    </div>
  );
}

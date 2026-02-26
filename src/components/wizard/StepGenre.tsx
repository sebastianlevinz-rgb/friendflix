'use client';

import { getAllGenres } from '@/lib/genres';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface Props {
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const GENRE_EMOJIS: Record<string, string> = {
  action_thriller: '🔫',
  mockumentary: '🎥',
  comedy: '😂',
};

const GENRE_GRADIENTS: Record<string, string> = {
  action_thriller: 'from-blue-950 to-zinc-950',
  mockumentary: 'from-amber-950 to-zinc-950',
  comedy: 'from-green-950 to-zinc-950',
};

export default function StepGenre({ selectedGenre, setSelectedGenre, onBack, onNext }: Props) {
  const genres = getAllGenres();

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Paso 3 de 4</div>
        <h1 className="text-3xl font-black mb-2">¿Qué tipo de película?</h1>
        <p className="text-zinc-400">El género define el estilo visual, la narrativa y la música.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {genres.map(genre => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre.id)}
            className={`genre-card w-full text-left bg-gradient-to-br ${GENRE_GRADIENTS[genre.id] || 'from-zinc-900 to-zinc-950'} border-2 rounded-2xl p-6 transition-all ${
              selectedGenre === genre.id
                ? 'selected border-[#E8793A]'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{GENRE_EMOJIS[genre.id] || '🎬'}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-white">{genre.name}</div>
                    <div className="text-sm text-zinc-400">{genre.subtitle}</div>
                  </div>
                  {selectedGenre === genre.id && (
                    <div className="w-6 h-6 rounded-full bg-[#E8793A] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-zinc-500 text-sm mt-2">{genre.description}</p>
                <div className="flex gap-4 mt-3 text-xs text-zinc-600">
                  <span>{genre.sceneCount} escenas</span>
                  <span>~{genre.totalDuration}s</span>
                  <span>{genre.aspectRatio}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-zinc-700 text-zinc-300">
          ← Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedGenre}
          className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold px-8 disabled:opacity-40"
        >
          Siguiente →
        </Button>
      </div>
    </div>
  );
}

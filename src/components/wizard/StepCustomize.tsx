'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenreDefinition } from '@/lib/types';

interface CharacterEntry {
  id: string;
  name: string;
  files: File[];
  preview: string[];
}

interface Props {
  characters: CharacterEntry[];
  genre: GenreDefinition;
  idea: string;
  onBack: () => void;
  onStart: () => void;
  isLoading: boolean;
  error: string;
}

const GENRE_EMOJIS: Record<string, string> = {
  action_thriller: '🔫',
  mockumentary: '🎥',
  comedy: '😂',
};

export default function StepCustomize({
  characters,
  genre,
  idea,
  onBack,
  onStart,
  isLoading,
  error,
}: Props) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Paso 4 de 4</div>
        <h1 className="text-3xl font-black mb-2">¿Todo listo?</h1>
        <p className="text-zinc-400">Revisá el resumen y creá tu película.</p>
      </div>

      {/* Summary card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5 space-y-4">
        {/* Idea */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Idea</div>
          <p className="text-zinc-200 text-sm leading-relaxed">{idea}</p>
        </div>

        <div className="border-t border-zinc-800" />

        {/* Genre */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{GENRE_EMOJIS[genre.id] || '🎬'}</span>
          <div>
            <div className="font-bold text-sm">{genre.name}</div>
            <div className="text-xs text-zinc-400">{genre.subtitle} · {genre.sceneCount} escenas · ~{genre.totalDuration}s · Kling 3.0</div>
          </div>
        </div>

        <div className="border-t border-zinc-800" />

        {/* Cast */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Cast</div>
          <div className="flex flex-wrap gap-2">
            {characters.map(char => (
              <div key={char.id} className="flex items-center gap-2 bg-zinc-800 rounded-full px-3 py-1">
                {char.preview[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={char.preview[0]} alt={char.name} className="w-5 h-5 rounded-full object-cover" />
                )}
                <span className="text-sm text-zinc-300">{char.name}</span>
                {char.files.length > 1 && (
                  <span className="text-xs text-zinc-600">+{char.files.length - 1} ref</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost notice */}
      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 mb-5 text-xs text-amber-500/70">
        <span className="font-semibold">Costo estimado:</span> ~$1.50 en créditos de Kling 3.0 (1 escena × ~$1.50)
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-zinc-700 text-zinc-300" disabled={isLoading}>
          ← Atrás
        </Button>
        <Button
          onClick={onStart}
          disabled={isLoading}
          className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold px-8 gap-2 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Crear mi película
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

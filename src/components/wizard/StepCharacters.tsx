'use client';

import { useRef } from 'react';
import { X, Plus, Upload, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CharacterEntry {
  id: string;
  name: string;
  files: File[];
  preview: string[];
}

interface Props {
  characters: CharacterEntry[];
  setCharacters: (chars: CharacterEntry[]) => void;
  onBack: () => void;
  onNext: () => void;
}

function CharacterCard({
  char,
  index,
  onRemove,
  onUpdate,
}: {
  char: CharacterEntry;
  index: number;
  onRemove: () => void;
  onUpdate: (updated: CharacterEntry) => void;
}) {
  const frontalRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  function handleFrontal(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    // Replace only the first photo (frontal)
    const newFiles = [file, ...char.files.slice(1)];
    const newPreviews = [URL.createObjectURL(file), ...char.preview.slice(1)];
    onUpdate({ ...char, files: newFiles, preview: newPreviews });
  }

  function handleRefs(files: FileList | null) {
    if (!files) return;
    const maxRefs = 4; // up to 4 ref photos (total 5 with frontal)
    const currentRefs = char.files.slice(1);
    const slots = maxRefs - currentRefs.length;
    if (slots <= 0) return;
    const newFiles = Array.from(files).slice(0, slots);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    onUpdate({
      ...char,
      files: [char.files[0], ...char.files.slice(1), ...newFiles].filter(Boolean),
      preview: [char.preview[0], ...char.preview.slice(1), ...newPreviews].filter(Boolean),
    });
  }

  function removePhoto(photoIndex: number) {
    const files = char.files.filter((_, i) => i !== photoIndex);
    const preview = char.preview.filter((_, i) => i !== photoIndex);
    onUpdate({ ...char, files, preview });
  }

  const frontal = char.preview[0];
  const refs = char.preview.slice(1);
  const refFiles = char.files.slice(1);
  const maxRefs = 4;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 mr-2">
          <span className="text-xs text-zinc-500 font-mono w-5">#{index + 1}</span>
          <Input
            value={char.name}
            onChange={e => onUpdate({ ...char, name: e.target.value })}
            placeholder="Nombre del personaje"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-8 text-sm"
          />
        </div>
        <button onClick={onRemove} className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        {/* Frontal photo */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 text-amber-500" />
            <span className="text-xs text-amber-500/80 font-medium">Foto frontal</span>
          </div>
          <button
            onClick={() => frontalRef.current?.click()}
            className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
              frontal
                ? 'border-amber-500/40 hover:border-amber-500'
                : 'border-dashed border-zinc-700 hover:border-[#E8793A]'
            } flex items-center justify-center bg-zinc-800`}
          >
            {frontal ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frontal} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-xs text-white">Cambiar</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-500">
                <User className="w-6 h-6" />
                <span className="text-[10px]">Frontal</span>
              </div>
            )}
          </button>
          <input
            ref={frontalRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFrontal(e.target.files)}
          />
        </div>

        {/* Reference photos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Fotos de referencia</span>
            <span className="text-xs text-zinc-600">{refFiles.length}/{maxRefs}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {refs.map((src, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group border border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i + 1)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {refFiles.length < maxRefs && (
              <button
                onClick={() => refRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-zinc-600" />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Agregá ángulos distintos para mejor consistencia
          </p>
        </div>
      </div>

      <input
        ref={refRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleRefs(e.target.files)}
      />
    </div>
  );
}

export default function StepCharacters({ characters, setCharacters, onBack, onNext }: Props) {
  const canProceed = characters.length >= 1 && characters.every(c => c.name.trim() && c.files.length > 0);

  function addCharacter() {
    if (characters.length >= 3) return;
    setCharacters([
      ...characters,
      { id: crypto.randomUUID(), name: '', files: [], preview: [] },
    ]);
  }

  function removeCharacter(id: string) {
    setCharacters(characters.filter(c => c.id !== id));
  }

  function updateCharacter(id: string, updated: CharacterEntry) {
    setCharacters(characters.map(c => (c.id === id ? updated : c)));
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Paso 2 de 4</div>
        <h1 className="text-3xl font-black mb-2">¿Quiénes son los protagonistas?</h1>
        <p className="text-zinc-400">
          Subí una <span className="text-amber-400">foto frontal clara</span> por personaje.
          Agregá fotos de referencia para mejor consistencia en el video.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {characters.map((char, i) => (
          <CharacterCard
            key={char.id}
            char={char}
            index={i}
            onRemove={() => removeCharacter(char.id)}
            onUpdate={updated => updateCharacter(char.id, updated)}
          />
        ))}
      </div>

      {characters.length < 3 && (
        <button
          onClick={addCharacter}
          className="w-full border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Agregar personaje {characters.length > 0 ? `(${characters.length}/3)` : ''}</span>
        </button>
      )}

      <div className="mt-8 flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="border-zinc-700 text-zinc-300">
          ← Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold px-8 disabled:opacity-40"
        >
          Siguiente →
        </Button>
      </div>

      {characters.length === 3 && (
        <p className="text-zinc-500 text-sm text-center mt-3">
          Máximo 3 personajes por película
        </p>
      )}
    </div>
  );
}

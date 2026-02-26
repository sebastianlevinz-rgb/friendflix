'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIdea from '@/components/wizard/StepIdea';
import StepCharacters, { type CharacterEntry } from '@/components/wizard/StepCharacters';
import StepGenre from '@/components/wizard/StepGenre';
import StepCustomize from '@/components/wizard/StepCustomize';
import { GENRES } from '@/lib/genres';

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');
  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  async function handleStart() {
    if (!selectedGenre || characters.length < 1) return;
    setIsLoading(true);
    setError('');

    try {
      // 1. Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: selectedGenre, customPrompt: idea }),
      });
      if (!projectRes.ok) throw new Error('Failed to create project');
      const { id: projectId } = await projectRes.json();

      // 2. Upload characters
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('name', char.name);
        formData.append('orderIndex', String(i));
        char.files.forEach(file => formData.append('photos', file));

        const charRes = await fetch('/api/characters', { method: 'POST', body: formData });
        if (!charRes.ok) throw new Error(`Failed to upload character ${char.name}`);
      }

      // 3. Start orchestration
      await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      // 4. Redirect to project progress page
      router.push(`/create/${projectId}`);
    } catch (err) {
      setError('Algo salió mal. Intentá de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const genre = GENRES[selectedGenre];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-black">
          Friend<span className="text-[#E8793A]">Flix</span>
        </a>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 < step
                  ? 'bg-[#E8793A] w-6'
                  : i + 1 === step
                  ? 'bg-[#E8793A] w-10'
                  : 'bg-zinc-800 w-4'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {step === 1 && (
          <StepIdea
            idea={idea}
            setIdea={setIdea}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepCharacters
            characters={characters}
            setCharacters={setCharacters}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepGenre
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && genre && (
          <StepCustomize
            characters={characters}
            genre={genre}
            idea={idea}
            onBack={() => setStep(3)}
            onStart={handleStart}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </main>
  );
}

import Link from 'next/link';
import { Film, Users, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { icon: Users, label: 'Subí fotos de tus amigos', desc: 'De 1 a 3 personajes, con sus nombres' },
  { icon: Film, label: 'Elegí un género', desc: 'Thriller, mockumentary, comedia y más' },
  { icon: Sparkles, label: 'La IA genera el trailer', desc: 'Claude escribe el guión, Kling genera el video' },
  { icon: Download, label: 'Descargá y compartí', desc: 'Trailer de ~60s listo para compartir' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="mb-4 text-sm tracking-[0.3em] uppercase text-amber-500/80">
          Powered by Claude + Kling AI
        </div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
          Friend<span className="text-[#E8793A]">Flix</span><span className="text-zinc-600 text-2xl md:text-3xl font-light ml-3 align-top mt-4 inline-block">v2</span>
        </h1>
        <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Convertí a tus amigos en protagonistas de un{' '}
          <span className="text-white font-semibold">trailer cinematográfico</span>{' '}
          generado con inteligencia artificial.
        </p>
        <Link href="/create">
          <Button
            size="lg"
            className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold text-lg px-10 py-6 rounded-full transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
          >
            Crear mi película
          </Button>
        </Link>

        {/* Film strip decoration */}
        <div className="mt-16 w-full max-w-3xl">
          <div className="flex gap-2 overflow-hidden opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-24 bg-zinc-800 rounded-sm border border-zinc-700 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-12 text-zinc-300 tracking-wide uppercase text-sm">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex gap-4 hover:border-zinc-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#E8793A]/10 border border-[#E8793A]/20 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-5 h-5 text-[#E8793A]" />
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Paso {i + 1}</div>
                <div className="font-semibold text-white mb-1">{step.label}</div>
                <div className="text-sm text-zinc-400">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Genres preview */}
      <section className="px-4 py-16 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-12 text-zinc-300 tracking-wide uppercase text-sm">
          Géneros disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Acción / Thriller', subtitle: 'Estilo Fauda', emoji: '🔫', color: 'from-blue-900 to-zinc-900' },
            { name: 'Mockumentary', subtitle: 'Estilo The Office', emoji: '🎥', color: 'from-amber-900 to-zinc-900' },
            { name: 'Comedia', subtitle: 'Situación absurda', emoji: '😂', color: 'from-green-900 to-zinc-900' },
          ].map((genre, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${genre.color} border border-zinc-800 rounded-2xl p-6 text-center hover:border-zinc-600 transition-all hover:scale-105 cursor-pointer`}
            >
              <div className="text-4xl mb-3">{genre.emoji}</div>
              <div className="font-bold text-white">{genre.name}</div>
              <div className="text-sm text-zinc-400 mt-1">{genre.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <Link href="/create">
          <Button
            size="lg"
            className="bg-[#E8793A] hover:bg-[#d06830] text-white font-bold text-lg px-10 py-6 rounded-full transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
          >
            Empezar ahora — es gratis
          </Button>
        </Link>
        <p className="text-zinc-600 text-sm mt-4">Sin registro. Sin pagos. Solo magia.</p>
      </section>

      {/* Footer */}
      <footer className="text-center text-zinc-700 text-sm py-8 border-t border-zinc-900">
        FriendFlix © 2025 · Powered by Claude + Kling AI
      </footer>
    </main>
  );
}

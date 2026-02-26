'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { CheckCircle, Circle, Loader2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProjectData {
  id: string;
  status: string;
  genre: string;
  scriptJson: {
    title: string;
    tagline: string;
  } | null;
  scenes: Array<{
    id: string;
    orderIndex: number;
    status: string;
    videoUrl?: string;
    duration: number;
  }>;
  outputVideoUrl?: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Iniciando...',
  generating_script: 'Escribiendo el guión con Claude...',
  generating_scenes: 'Generando escenas con Kling AI...',
  assembling: 'Ensamblando el trailer...',
  complete: '¡Tu trailer está listo!',
  failed: 'Algo salió mal',
};

const STATUS_STEPS = ['draft', 'generating_script', 'generating_scenes', 'assembling', 'complete'];

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState('');

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects?id=${projectId}`);
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      setError('No se pudo cargar el proyecto');
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    const interval = setInterval(() => {
      if (project?.status !== 'complete' && project?.status !== 'failed') {
        fetchProject();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchProject, project?.status]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/create" className="text-[#E8793A] hover:underline">
            Volver a crear
          </a>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8793A]" />
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(project.status);
  const progress = project.status === 'complete'
    ? 100
    : Math.max(5, Math.round((currentStepIndex / (STATUS_STEPS.length - 1)) * 100));

  const completedScenes = project.scenes.filter(s => s.status === 'complete').length;
  const totalScenes = project.scenes.length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <a href="/" className="text-xl font-black">
          Friend<span className="text-[#E8793A]">Flix</span>
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {project.status === 'complete' && project.outputVideoUrl ? (
          /* Video Player */
          <div className="text-center">
            <div className="mb-2 text-xs text-amber-500/80 uppercase tracking-widest">Estreno mundial</div>
            {project.scriptJson && (
              <>
                <h1 className="text-3xl font-black mb-2">{project.scriptJson.title}</h1>
                <p className="text-zinc-400 italic mb-8">&quot;{project.scriptJson.tagline}&quot;</p>
              </>
            )}

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6 ring-1 ring-zinc-800">
              <video
                src={project.outputVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-3 justify-center">
              <a href={project.outputVideoUrl} download>
                <Button className="bg-[#E8793A] hover:bg-[#d06830] text-white gap-2">
                  <Download className="w-4 h-4" />
                  Descargar trailer
                </Button>
              </a>
              <Button
                variant="outline"
                className="border-zinc-700 gap-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: project.scriptJson?.title || 'Mi trailer', url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
              <a href="/create">
                <Button variant="outline" className="border-zinc-700">
                  Crear otro
                </Button>
              </a>
            </div>
          </div>
        ) : (
          /* Progress View */
          <div>
            <div className="text-center mb-10">
              <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Generando tu película</div>
              {project.scriptJson && (
                <>
                  <h2 className="text-2xl font-black">{project.scriptJson.title}</h2>
                  <p className="text-zinc-500 italic text-sm mt-1">&quot;{project.scriptJson.tagline}&quot;</p>
                </>
              )}
            </div>

            {/* Main progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>{STATUS_LABELS[project.status] || 'Procesando...'}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-zinc-800" />
            </div>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              {[
                { key: 'processing_photos', label: 'Fotos procesadas', done: currentStepIndex >= 1 },
                {
                  key: 'script',
                  label: project.scriptJson
                    ? `Guión generado: "${project.scriptJson.title}"`
                    : 'Generando guión con Claude...',
                  done: !!project.scriptJson,
                  active: project.status === 'generating_script',
                },
                {
                  key: 'scenes',
                  label: totalScenes > 0
                    ? `Generando escenas ${completedScenes}/${totalScenes}`
                    : 'Generando escenas con Kling AI...',
                  done: project.status === 'assembling' || project.status === 'complete',
                  active: project.status === 'generating_scenes',
                },
                {
                  key: 'assembly',
                  label: 'Ensamblando trailer con FFmpeg',
                  done: project.status === 'complete',
                  active: project.status === 'assembling',
                },
              ].map((step) => (
                <div key={step.key} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : step.active ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#E8793A] flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-700 flex-shrink-0" />
                  )}
                  <span className={step.done ? 'text-zinc-300' : step.active ? 'text-white' : 'text-zinc-600'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Scene thumbnails grid */}
            {totalScenes > 0 && (
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Escenas</div>
                <div className="grid grid-cols-4 gap-2">
                  {project.scenes
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((scene) => (
                      <div
                        key={scene.id}
                        className={`aspect-video rounded-lg overflow-hidden border ${
                          scene.status === 'complete'
                            ? 'border-green-500/30'
                            : scene.status === 'generating'
                            ? 'border-[#E8793A]/30'
                            : 'border-zinc-800'
                        } bg-zinc-900 flex items-center justify-center`}
                      >
                        {scene.status === 'complete' && scene.videoUrl ? (
                          <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                        ) : scene.status === 'generating' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#E8793A]" />
                        ) : scene.status === 'failed' ? (
                          <span className="text-red-500 text-xs">✗</span>
                        ) : (
                          <span className="text-zinc-600 text-xs">{scene.orderIndex + 1}</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {project.status === 'failed' && (
              <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-center">
                <p className="text-red-400 mb-3">Algo salió mal durante la generación.</p>
                <a href="/create">
                  <Button variant="outline" className="border-red-800 text-red-400">
                    Intentar de nuevo
                  </Button>
                </a>
              </div>
            )}

            {project.status !== 'failed' && (
              <p className="text-center text-zinc-600 text-sm mt-8">
                La generación de video tarda ~5-10 minutos. Esta página se actualiza automáticamente.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

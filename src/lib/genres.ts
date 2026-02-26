import type { GenreDefinition } from './types';

export const GENRES: Record<string, GenreDefinition> = {
  action_thriller: {
    id: 'action_thriller',
    name: 'Acción / Thriller',
    subtitle: 'Estilo Fauda',
    description: 'Misión de espionaje, persecución, confrontación final',
    thumbnail: '/genres/action.jpg',
    sceneCount: 7,
    totalDuration: 56,
    visualStyle: 'Fauda style, handheld camera, desaturated colors, cold blue tones, gritty, high contrast, film grain',
    narrativeArc: ['setup_villain', 'villain_action', 'hero_receives_intel', 'hero_intercepts', 'chase', 'escape', 'final_confrontation'],
    musicTrack: '/music/thriller_tense.mp3',
    titleCard: { text: 'CLASIFICADO', style: 'military stencil red on black' },
    aspectRatio: '16:9',
    dialogueLanguage: 'Spanish',
    cameraKeywords: ['handheld', 'tracking shot', 'push in', 'dutch angle', 'over the shoulder'],
    lightingKeywords: ['harsh sun', 'cold blue', 'dramatic side lighting', 'neon', 'low key'],
  },

  mockumentary: {
    id: 'mockumentary',
    name: 'Mockumentary',
    subtitle: 'Estilo The Office',
    description: 'Documental paródico sobre un secreto del grupo',
    thumbnail: '/genres/mockumentary.jpg',
    sceneCount: 7,
    totalDuration: 75,
    visualStyle: 'Documentary style, warm golden hour, 35mm film grain, shallow depth of field, natural lighting',
    narrativeArc: ['establishing_shot', 'narrator_intro', 'interview_1', 'interview_2', 'evidence_montage_1', 'evidence_montage_2', 'reveal'],
    musicTrack: '/music/doc_ambient.mp3',
    titleCard: { text: 'BASADO EN SOSPECHAS REALES', style: 'white text on black, typewriter font' },
    aspectRatio: '16:9',
    dialogueLanguage: 'Spanish',
    cameraKeywords: ['static tripod', 'slow zoom', 'interview framing', 'surveillance footage'],
    lightingKeywords: ['golden hour', 'warm', 'dramatic side light for interviews', 'natural'],
  },

  comedy: {
    id: 'comedy',
    name: 'Comedia',
    subtitle: 'Situación absurda',
    description: 'Deadpan humor, situación ridícula que escala',
    thumbnail: '/genres/comedy.jpg',
    sceneCount: 7,
    totalDuration: 60,
    visualStyle: 'Warm colors, steady cam, wide shots, bright natural lighting, clean composition',
    narrativeArc: ['normal_setup', 'inciting_incident', 'escalation_1', 'escalation_2', 'peak_absurdity', 'reaction', 'punchline'],
    musicTrack: '/music/comedy_light.mp3',
    titleCard: { text: 'PRÓXIMAMENTE', style: 'bold colorful text' },
    aspectRatio: '9:16',
    dialogueLanguage: 'Spanish',
    cameraKeywords: ['wide shot', 'medium close-up', 'reaction shot', 'slow motion for comedic effect'],
    lightingKeywords: ['warm sunlight', 'bright', 'Mediterranean', 'overexposed slightly'],
  },
};

export function getGenre(id: string): GenreDefinition | undefined {
  return GENRES[id];
}

export function getAllGenres(): GenreDefinition[] {
  return Object.values(GENRES);
}

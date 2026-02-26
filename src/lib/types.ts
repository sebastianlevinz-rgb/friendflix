export interface SceneScript {
  sceneNumber: number;
  duration: number;
  characters: string[];
  visualDescription: string;
  cameraMovement: string;
  lighting: string;
  action: string;
  dialogue: {
    speaker: string;
    tone: string;
    language: string;
    text: string;
  } | null;
  atmosphere: string;
  textOverlay: string | null;
}

export interface ClosingCard {
  text: string;
  style: string;
}

export interface Script {
  title: string;
  tagline: string;
  scenes: SceneScript[];
  closingCard: ClosingCard;
}

export interface GenreDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  sceneCount: number;
  totalDuration: number;
  visualStyle: string;
  narrativeArc: string[];
  musicTrack: string;
  titleCard: { text: string; style: string };
  aspectRatio: '16:9' | '9:16' | '1:1';
  dialogueLanguage: string;
  cameraKeywords: string[];
  lightingKeywords: string[];
}

export interface CharacterData {
  id: string;
  name: string;
  originalPhotos: string[];
  processedPhotos: string[];
}

export interface ProjectStatus {
  id: string;
  status: string;
  genre: string;
  script?: Script;
  characters: CharacterData[];
  scenes: SceneProgress[];
  outputVideoUrl?: string;
}

export interface SceneProgress {
  id: string;
  orderIndex: number;
  status: string;
  videoUrl?: string;
  duration: number;
  prompt: string;
}

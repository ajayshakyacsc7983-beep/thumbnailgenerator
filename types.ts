
export interface ExtractedFrame {
  id: string;
  timestamp: number;
  dataUrl: string;
}

export type TextPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface ThumbnailSettings {
  characterCount: number;
  additionalPrompt: string;
  style: 'cinematic' | 'gaming' | 'vlog' | 'anime';
  mainText: string;
  subText: string;
  textPosition: TextPosition;
}

export interface AppState {
  videoFile: File | null;
  videoUrl: string | null;
  frames: ExtractedFrame[];
  selectedFrameIds: string[];
  generatedThumbnail: string | null;
  isProcessing: boolean;
  isGenerating: boolean;
  statusMessage: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  duration: string; // calculated from content and WPM
  wpm: number;
  fontSize: number;
  textColor?: string;
  theme?: string; // 'classic' | 'contrast' | 'soft' | 'vibrant' | 'warm'
  isPro?: boolean;
  lastUpdated: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  bgStr: string;
  textStr: string;
  accentStr: string;
  glowStr: string;
  borderStr: string;
}

export interface SavedVideo {
  id: string;
  scriptTitle: string;
  date: string;
  url: string;
  duration: number;
  downloadName: string;
}


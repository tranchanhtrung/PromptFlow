import { Workspace, Script, ThemePreset } from "./types";

export const DEFAULT_WORKSPACES: Workspace[] = [
  { id: "tiktok", name: "TikTok", icon: "video_library", color: "text-primary bg-primary-container/20 border border-primary/20" },
  { id: "reels", name: "Reels", icon: "reply", color: "text-secondary bg-secondary-container/20 border border-secondary/20" },
  { id: "sales", name: "Sales", icon: "trending_up", color: "text-tertiary bg-tertiary-container/20 border border-tertiary/20" },
  { id: "podcast", name: "Podcast", icon: "mic", color: "text-primary bg-primary/20 border border-primary/20" }
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    bgStr: "bg-[#0b1326] text-[#dae2fd]",
    textStr: "text-[#dae2fd]",
    accentStr: "text-[#d2bbff]",
    glowStr: "shadow-[0_0_15px_rgba(210,187,255,0.15)]",
    borderStr: "border-[#d2bbff]/20"
  },
  {
    id: "contrast",
    name: "Contrast",
    bgStr: "bg-black text-[#FFFF00]",
    textStr: "text-[#FFFF00]",
    accentStr: "text-[#FFFF00]",
    glowStr: "shadow-[0_0_20px_rgba(255,255,0,0.3)]",
    borderStr: "border-[#FFFF00]/50"
  },
  {
    id: "soft",
    name: "Soft",
    bgStr: "bg-[#182a24] text-[#A7F3D0]",
    textStr: "text-[#A7F3D0]",
    accentStr: "text-[#34D399]",
    glowStr: "shadow-[0_0_15px_rgba(52,211,153,0.2)]",
    borderStr: "border-[#34D399]/30"
  },
  {
    id: "vibrant",
    name: "Vibrant",
    bgStr: "bg-[#00004c] text-[#44e2cd]",
    textStr: "text-[#dae2fd]",
    accentStr: "text-[#44e2cd]",
    glowStr: "shadow-[0_0_20px_rgba(68,226,205,0.35)]",
    borderStr: "border-[#44e2cd]/40"
  },
  {
    id: "warm",
    name: "Warm",
    bgStr: "bg-[#3e0f1c] text-[#FFFDD0]",
    textStr: "text-[#FFFDD0]",
    accentStr: "text-[#ff2d78]",
    glowStr: "shadow-[0_0_15px_rgba(255,45,120,0.35)]",
    borderStr: "border-[#ff2d78]/40"
  }
];

export const DEFAULT_SCRIPTS: Script[] = [
  {
    id: "script-1",
    title: "5 Tips for Better Sleep",
    content: "Did you know that viewing sunlight within the first 30 minutes of waking up can radically improve your circadian rhythm?\n\nHack number one: Open your eyes to nature first thing in the morning. Natural light stops melatonin production and sets a biological timer for sleep tonight. [Pause]\n\nHack number two: Cut off screen time at least 1 hour before bedtime. The blue light from your phone tricks your brain into thinking it's still noon.\n\nHack number three: Keep your bedroom ambiently cool, ideally around 65 degrees Fahrenheit. Your body temperature needs to drop slightly to initiate deep sleep.",
    folderId: "tiktok",
    tags: ["SLEEP", "WELLNESS"],
    wpm: 130,
    fontSize: 28,
    duration: "2:45 min",
    isPro: true,
    lastUpdated: "2026-06-21T07:15:00Z"
  },
  {
    id: "script-2",
    title: "Q3 Product Launch Intro",
    content: "Welcome everyone. Today marks a significant milestone in our journey as we unveil the latest iteration of our platform. [Pause]\n\nThis quarter, we've focused heavily on performance tuning, technical integration, and human-centered design. Our user interfaces are now 50% faster, and the rendering engine uses 10 times less CPU overhead. [Pause]\n\nWe want to empower visual creators to manifest their thoughts instantly. Let's look as we transition to the actual live presentation showing PromptFlow in action today.",
    folderId: "sales",
    tags: ["SALES", "Q3", "LAUNCH"],
    wpm: 140,
    fontSize: 24,
    duration: "1:12 min",
    isPro: false,
    lastUpdated: "2026-06-21T07:22:00Z"
  },
  {
    id: "script-3",
    title: "Why Minimalism Matters",
    content: "In a world screaming for your attention, the most radical act is silence. Minimalism isn't about owning less, it is about creating room for what truly matters to your spirit. [Pause]\n\nEvery object, every message, and every notifications cycle consumes visual energy. When we intentionally declutter both our physical workspaces and our digital applications, we give our minds the quiet space to create deep and beautiful work. [Pause]\n\nTry it today. Turn off notifications, clean your desk, and open a single editor screen to let your insights flow naturally.",
    folderId: "podcast",
    tags: ["MINIMALISM", "LIFE"],
    wpm: 120,
    fontSize: 32,
    duration: "4:20 min",
    isPro: true,
    lastUpdated: "2026-06-20T18:40:00Z"
  }
];

export function getWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

export function calculateDuration(text: string, wpm: number): string {
  const words = getWordCount(text);
  if (words === 0) return "0:00 min";
  const totalSeconds = Math.round((words / wpm) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds} min`;
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? hrs + ":" : ""}${mins < 10 && hrs > 0 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

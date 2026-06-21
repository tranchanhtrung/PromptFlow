import { useState, useEffect } from "react";
import { ArrowLeft, Mic, FlipHorizontal, Play, Pause, RotateCcw, Minus, Plus, Sliders } from "lucide-react";
import { Script, ThemePreset } from "../types";
import { THEME_PRESETS, calculateDuration } from "../data";

interface TeleprompterViewProps {
  script: Script;
  onExit: () => void;
  defaultWpm?: number;
  defaultFontSize?: number;
  defaultFontFamily?: string;
}

export default function TeleprompterView({ 
  script, 
  onExit,
  defaultWpm = 130,
  defaultFontSize = 36,
  defaultFontFamily = "Sora"
}: TeleprompterViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMirrored, setIsMirrored] = useState(false);
  
  // Script adjust configurations
  const [speed, setSpeed] = useState(() => Math.max(100, Math.min(500, defaultWpm)));
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [activeThemeId, setActiveThemeId] = useState("classic");

  // Fetch colors and borders dynamically based on theme preset configuration
  const activeThemeObj = THEME_PRESETS.find(t => t.id === activeThemeId) || THEME_PRESETS[0];

  // 1. Text scrolling animation loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    function scrollStep(time: number) {
      if (isPlaying) {
        const elapsed = time - lastTime;
        // Adjust scroll increment (WPM divider calculation)
        const pixelsPerSecond = (speed / 130) * 12;
        setScrollY(prev => prev + (pixelsPerSecond * elapsed) / 100);
      }
      lastTime = time;
      animationId = requestAnimationFrame(scrollStep);
    }

    if (isPlaying) {
      animationId = requestAnimationFrame(scrollStep);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, speed]);

  // Restores scroll if state resets
  const handleResetScroll = () => {
    setIsPlaying(false);
    setScrollY(0);
  };

  // Progress Bar percentage calculation based on scrolled height compared to window boundaries (simulated)
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    // Generate a progressive indicator derived from scrolled distance
    const computedProgress = Math.min((scrollY / 1800) * 100, 100);
    setScrollProgress(computedProgress);
  }, [scrollY]);

  return (
    <div className={`fixed inset-0 z-[80] overflow-hidden flex flex-col w-screen h-screen transition-all duration-300 font-sans ${activeThemeObj.bgStr}`}>
      
      {/* 1. Header Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-surface-container/60 z-50">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_#ff2d78]" 
          style={{ width: `${Math.max(scrollProgress, 4)}%` }}
        ></div>
      </div>

      {/* HEADER CONTROLS */}
      <header className="fixed top-0 w-full z-40 bg-surface-dim/80 backdrop-blur-md flex justify-between items-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onExit} 
            className="p-2 rounded-full hover:bg-surface-bright/40 text-on-surface hover:text-primary transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-sm text-primary uppercase tracking-wide truncate max-w-xs">{script.title}</h1>
            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest text-[#00ffcc] hidden sm:block">Full Teleprompter Rig</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Listening status badge */}
          <div className="flex items-center gap-1.5 bg-secondary-container/10 px-3 py-1.5 rounded-full border border-secondary/20 voice-pulse animate-pulse">
            <Mic className="w-3.5 h-3.5 text-secondary" />
            <span className="font-mono text-[9px] text-[#00ffcc] font-bold tracking-widest">LISTENING</span>
          </div>

          {/* Mirror Flip button */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-full border transition-all active:scale-90 ${
              isMirrored 
                ? "bg-primary/20 border-primary/50 text-white shadow-[0_0_10px_rgba(255,45,120,0.3)]" 
                : "bg-surface-container-high border-white/5 text-on-surface-variant hover:text-on-surface"
            }`}
            title="Bật/Tắt Gương lật"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN TEXT CONTAINER */}
      <main className="relative flex-1 flex flex-col justify-center items-center select-none pt-24 pb-52">
        {/* Center horizontal focus boundary banner */}
        <div className="absolute top-1/2 left-0 w-full h-24 -translate-y-1/2 bg-white/5 border-y border-white/10 z-10 pointer-events-none flex items-center justify-center">
          {/* Subtle side indicators */}
          <div className="absolute left-4 text-xs font-mono opacity-20 hover:opacity-50">✦ READING LINE</div>
          <div className="absolute right-4 text-xs font-mono opacity-20 hover:opacity-50">✦ READING LINE</div>
        </div>

        {/* Double gradient overlay shadow lines */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12]/70 via-transparent to-[#0a0a12]/70 pointer-events-none z-20"></div>

        {/* Outer scrolling context applying mirror transformation scales directly */}
        <div className={`w-full h-full transition-transform duration-300 ease-in-out ${isMirrored ? "scale-x-[-1]" : ""}`}>
          <div className="w-full max-w-4xl mx-auto px-6 h-full overflow-hidden flex flex-col items-center select-none pt-24">
            
            {/* Scrolled loop body */}
            <div 
              className="text-center space-y-16 py-[270px] select-none"
              style={{ 
                transform: `translateY(${-scrollY}px)`,
                transition: "transform 0.1s linear"
              }}
            >
              <p className="opacity-25 leading-tight select-none uppercase tracking-widest text-sm text-center">--- Bắt đầu thuyết trình ---</p>
              
              {script.content.split("\n\n").map((para, index) => {
                const getFontFamilyStyle = (fontName: string) => {
                  if (fontName === "Sora") return "var(--font-display)";
                  if (fontName === "Inter") return "var(--font-sans)";
                  if (fontName === "Space Grotesk") return "var(--font-label)";
                  return "var(--font-mono)";
                };
                return (
                  <p
                    key={index}
                    style={{ 
                      fontSize: `${fontSize}px`, 
                      lineHeight: "1.4",
                      fontFamily: getFontFamilyStyle(defaultFontFamily)
                    }}
                    className={`${activeThemeObj.textStr} font-extrabold text-center max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap select-none transition-all duration-300`}
                  >
                    {para}
                  </p>
                );
              })}

              <p className="opacity-20 leading-tight select-none uppercase tracking-widest text-sm text-center">--- Kết thúc kịch bản ---</p>
            </div>

          </div>
        </div>
      </main>

      {/* FLOATING ACTION BOTTOM CONTROLLER DRAWER (Combined designs from Screen 4) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-50 p-5 bg-surface-container/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl space-y-5">
        
        {/* Row 1: Theme Presets Selection Carousel */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-2 px-1">Theme Presets / Chọn chủ đề</p>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar select-none">
            {THEME_PRESETS.map((theme) => {
              const activeTheme = theme.id === activeThemeId;
              const innerPresetBg = 
                theme.id === "classic" ? "bg-[#0b1326] text-[#dae2fd]" :
                theme.id === "contrast" ? "bg-black text-[#FFFF00]" :
                theme.id === "soft" ? "bg-[#182a24] text-[#A7F3D0]" :
                theme.id === "vibrant" ? "bg-[#00004c] text-secondary" :
                "bg-[#3e0f1c] text-white";

              return (
                <button
                  key={theme.id}
                  onClick={() => setActiveThemeId(theme.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none transition-all group ${
                    activeTheme ? "scale-105 opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                    activeTheme ? "border-primary scale-110 shadow-lg" : "border-white/15"
                  } ${innerPresetBg}`}>
                    <span className="font-extrabold text-xs">Aa</span>
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-tighter ${activeTheme ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Secondary Controls Area */}
        <div className="flex flex-col sm:flex-row shadow-sm gap-4 justify-between items-stretch sm:items-center pt-2 border-t border-white/5">
          
          {/* Font adjust labels minus/plus toggling */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center bg-surface-container-low border border-white/5 rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setFontSize(prev => Math.max(prev - 4, 16))}
                className="p-1 px-2.5 text-on-surface hover:text-primary transition-colors active:scale-95"
                title="Giảm kích thước"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-10 text-center font-mono font-bold text-xs text-primary">{fontSize}</div>
              <button 
                onClick={() => setFontSize(prev => Math.min(prev + 4, 80))}
                className="p-1 px-2.5 text-on-surface hover:text-primary transition-colors active:scale-95"
                title="Tăng kích thước"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleResetScroll}
              className="px-2.5 py-2.5 bg-surface-container-low hover:bg-surface-bright text-on-surface-variant hover:text-on-surface border border-white/5 rounded-xl flex items-center justify-center text-xs gap-1 transition-colors"
              title="Đặt lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="font-mono text-[9px]">RESET</span>
            </button>
          </div>

          {/* Large trigger Play/Pause toggle in center */}
          <div className="flex justify-center shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center bg-[#ff2d78] hover:bg-[#ff2d78]/90 text-white rounded-full shadow-[0_0_15px_rgba(255,45,120,0.4)] active:scale-90 transition-all outline-none duration-150"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
          </div>

          {/* Speed WPM scrolling slider */}
          <div className="flex-1 flex items-center gap-3">
            <Sliders className="w-4 h-4 text-on-surface-variant" />
            <div className="flex-1">
              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer custom-slider accent-secondary"
              />
            </div>
            <span className="text-secondary font-mono font-bold text-xs shrink-0 w-14 text-right">{speed} WPM</span>
          </div>

        </div>

      </div>

    </div>
  );
}

import { useState } from "react";
import { Sliders, RefreshCw, Layers, Check } from "lucide-react";

interface SettingsViewProps {
  defaultWpm: number;
  defaultFontSize: number;
  defaultFontFamily: string;
  onSaveDefaults: (wpm: number, fontSize: number, fontFamily: string) => void;
}

export default function SettingsView({
  defaultWpm,
  defaultFontSize,
  defaultFontFamily,
  onSaveDefaults
}: SettingsViewProps) {
  const [speed, setSpeed] = useState(defaultWpm);
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [fontFamily, setFontFamily] = useState(defaultFontFamily);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fontOptions = [
    { label: "Sora", fontClass: "font-display" },
    { label: "Inter", fontClass: "font-sans" },
    { label: "Roboto Mono", fontClass: "font-mono" },
    { label: "Space Grotesk", fontClass: "font-label" }
  ];

  const handleApply = () => {
    onSaveDefaults(speed, fontSize, fontFamily);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    setSpeed(130);
    setFontSize(28);
    setFontFamily("Sora");
    onSaveDefaults(130, 28, "Sora");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-28 font-sans">
      
      {/* HEADER BAR */}
      <header className="flex justify-between items-center py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#ff2d78]/10 rounded-lg text-primary select-none">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-primary neon-glow-pink">PromptFlow Settings</h1>
            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest text-[#00ffcc]">Cài đặt hệ thống</p>
          </div>
        </div>
      </header>

      {/* DETAILED SCRIPT PREVIEW LIVE TERMINAL CARD */}
      <section className="space-y-2 relative z-10 pt-2">
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 tracking-wide block px-1">Xem trước chữ chạy</label>
        
        <div className="glass-card rounded-xl h-48 overflow-hidden relative border border-primary/20 shadow-[0_0_20px_rgba(255,45,120,0.1)] flex flex-col justify-center items-center p-6 text-center">
          
          {/* Animated scrolling preview simulator */}
          <div className="space-y-4 animate-pulse">
            <p 
              className="font-bold text-on-surface leading-normal select-none transition-all duration-300" 
              style={{ 
                fontSize: `${fontSize}px`, 
                fontFamily: fontFamily === "Sora" ? "var(--font-display)" : fontFamily === "Inter" ? "var(--font-sans)" : fontFamily === "Space Grotesk" ? "var(--font-label)" : "var(--font-mono)"
              }}
            >
              Chào mừng bạn đến với PromptFlow. Đây là nội dung mẫu hiển thị trực quan.
            </p>
            <p className="text-xs text-on-surface-variant/70 italic">[Điều chỉnh phông chữ, kích cỡ và tốc độ cuộn ở bảng điều khiển bên dưới]</p>
          </div>

          {/* Glowing mirror badge indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#ff2d78]"></span>
            <span className="font-mono text-[9px] text-[#ff2d78] font-bold uppercase tracking-widest">LIVE HUD</span>
          </div>
        </div>
      </section>

      {/* SCRIPT MASTER TITLE */}
      <div className="px-1 py-1">
        <h2 className="font-display text-xl font-extrabold text-[#e8e0f0] neon-glow-pink">Cài đặt Teleprompter</h2>
        <p className="text-xs text-on-surface-variant">Tùy chỉnh cấu hình hiển thị mặc định cho mọi kịch bản của bạn</p>
      </div>

      {/* FONT SELECTOR GRID CAROUSEL */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1 text-xs font-mono">
          <span className="text-on-surface-variant font-label uppercase">Kiểu phông chữ</span>
          <span className="text-secondary font-bold font-mono tracking-wider">{fontFamily}</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {fontOptions.map((opt) => {
            const isSelected = fontFamily === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => setFontFamily(opt.label)}
                className={`glass-card flex-shrink-0 px-6 py-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 duration-200 outline-none ${
                    isSelected 
                      ? "border-primary/40 text-primary shadow-[0_0_15px_rgba(255,45,120,0.1)]" 
                      : "border-white/5 text-on-surface-variant"
                }`}
              >
                <span className={`text-2xl font-bold ${opt.fontClass}`}>Aa</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">{opt.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FONT SIZE CONTROLS TERMINAL */}
      <section className="glass-card p-5 rounded-2xl space-y-4 border border-white/5">
        <div className="flex justify-between items-center">
          <label className="font-label text-xs uppercase tracking-widest text-[#a098b0]">Kích cỡ chữ Teleprompter</label>
          <span className="text-primary font-bold font-mono text-sm shadow-xs">{fontSize}px</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-on-surface-variant select-none">FORMAT_SM</span>
          <input
            type="range"
            min="16"
            max="48"
            step="2"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 accent-primary bg-surface-variant h-1 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-[11px] font-mono text-on-surface-variant select-none">FORMAT_LG</span>
        </div>
      </section>

      {/* SCROLL SPEED CONTROL TERMINAL */}
      <section className="glass-card p-5 rounded-2xl space-y-4 border border-white/5">
        <div className="flex justify-between items-center">
          <label className="font-label text-xs uppercase tracking-widest text-[#a098b0]">Tốc độ cuộn chữ (WPM)</label>
          <div className="flex items-center gap-1 text-sm font-bold">
            <span className="text-secondary font-mono">{speed}</span>
            <span className="text-[9px] text-on-surface-variant font-mono">WPM</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-on-surface-variant select-none animate-pulse">SLOW</span>
          <input
            type="range"
            min="100"
            max="500"
            step="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 accent-secondary bg-surface-variant h-1 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-[11px] font-mono text-on-surface-variant select-none">FAST</span>
        </div>

        <div className="flex justify-between px-1 border-t border-white/5 pt-3">
          <span className="text-[9px] font-mono text-on-surface-variant">CHẬM / SLOW</span>
          
          <div className="flex gap-1 h-2 items-end">
            <div className={`w-3.5 h-full rounded-full transition-colors ${speed > 150 ? "bg-secondary" : "bg-white/10"}`}></div>
            <div className={`w-3.5 h-full rounded-full transition-colors ${speed > 250 ? "bg-secondary" : "bg-white/10"}`}></div>
            <div className={`w-3.5 h-full rounded-full transition-colors ${speed > 350 ? "bg-secondary" : "bg-white/10"}`}></div>
            <div className={`w-3.5 h-full rounded-full transition-colors ${speed > 450 ? "bg-secondary animate-pulse" : "bg-white/10"}`}></div>
          </div>

          <span className="text-[9px] font-mono text-on-surface-variant">NHANH / FAST</span>
        </div>
      </section>

      {/* ACTIONS RESET AND APPLY */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleReset}
          className="py-4 rounded-xl border border-white/10 text-on-surface hover:text-[#ff2d78] font-label font-bold uppercase tracking-widest text-xs hover:bg-surface-variant/40 transition-all active:scale-95 outline-none"
        >
          Khôi phục mặc định
        </button>
        
        <button
          onClick={handleApply}
          className="py-4 rounded-xl bg-primary text-white font-bold font-label uppercase tracking-widest text-xs hover:opacity-90 shadow-[0_0_20px_rgba(255,45,120,0.35)] transition-all active:scale-95 outline-none flex items-center justify-center gap-1.5"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>ĐÃ ÁP DỤNG</span>
            </>
          ) : (
            <span>ÁP DỤNG / SAVE</span>
          )}
        </button>
      </div>

    </div>
  );
}

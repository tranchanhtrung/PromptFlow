import { useState, useRef, useEffect } from "react";
import { X, Mic, RefreshCw, Grid, Timer as TimerIcon, Zap, Sliders, ArrowLeft, ArrowDown, Pause, Play, Archive } from "lucide-react";
import { Script, SavedVideo } from "../types";
import { formatTime } from "../data";

interface RecordingStudioViewProps {
  script: Script;
  onExit: () => void;
  defaultWpm?: number;
  defaultFontSize?: number;
  defaultFontFamily?: string;
}

export default function RecordingStudioView({ 
  script, 
  onExit,
  defaultWpm = 130,
  defaultFontSize = 28,
  defaultFontFamily = "Sora"
}: RecordingStudioViewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [ringLight, setRingLight] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Custom HUD adjustments
  const [textOpacity, setTextOpacity] = useState(0.6); // Background overlay opacity behind text
  const [speed, setSpeed] = useState(() => Math.max(100, Math.min(500, defaultWpm)));
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [scrollY, setScrollY] = useState(0);

  // Video capture states
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Activate standard webcam on render
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true
        });
        activeStream = stream;
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera could not be accessed. Falling back to background rendering.", err);
      }
    }
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // 2. Teleprompter scrolling logic when recording
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    function scrollStep(time: number) {
      if (isRecording && !isPaused) {
        // Adjust scroll speed (higher speed leads to faster pixel offset)
        const elapsed = time - lastTime;
        const pixelsPerSecond = (speed / 120) * 15; // smooth WPM factor
        setScrollY(prev => prev + (pixelsPerSecond * elapsed) / 1000);
      }
      lastTime = time;
      animationId = requestAnimationFrame(scrollStep);
    }

    if (isRecording && !isPaused) {
      animationId = requestAnimationFrame(scrollStep);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, isPaused, speed]);

  // Reset scroll position if stopped recording
  useEffect(() => {
    if (!isRecording) {
      setScrollY(0);
    }
  }, [isRecording]);

  // 3. Increment recording clock timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // 3b. Auto stop recording when threshold is reached
  useEffect(() => {
    const isUserPro = typeof window !== "undefined" ? localStorage.getItem("promptflow_user_is_pro") === "true" : false;
    const limitSeconds = isUserPro ? 1800 : 1200; // 30 mins vs 20 mins (10x of 2 mins)

    if (seconds >= limitSeconds) {
      setIsRecording(false);
      setIsPaused(false);
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try {
          mediaRecorder.stop();
        } catch (e) {
          console.warn("Stopping media recorder on limit exceeded:", e);
        }
      }
      alert(`Ghi hình tự động kết thúc do đạt giới hạn tối đa ${isUserPro ? "30 phút (Hạng VIP)" : "20 phút (Gói dùng thử nhân 10)"} của ứng dụng.`);
    }
  }, [seconds, mediaRecorder]);

  // 4. Record triggers with standard countdown timer support
  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording actively
      setIsRecording(false);
      setIsPaused(false);
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    } else {
      // Start countdown
      setCountdown(3);
    }
  };

  // Pause / Resume toggle handler
  const handleTogglePause = () => {
    if (!isRecording) return;
    if (isPaused) {
      setIsPaused(false);
      if (mediaRecorder && mediaRecorder.state === "paused") {
        try {
          mediaRecorder.resume();
        } catch (e) {
          console.warn("MediaRecorder resume failing", e);
        }
      }
    } else {
      setIsPaused(true);
      if (mediaRecorder && mediaRecorder.state === "recording") {
        try {
          mediaRecorder.pause();
        } catch (e) {
          console.warn("MediaRecorder pause failing", e);
        }
      }
    }
  };

  // Trigger countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      startRecording();
    } else {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordedVideoUrl(null);
    setRecordedChunks([]);

    if (videoStream) {
      try {
        const recorder = new MediaRecorder(videoStream, { mimeType: "video/webm;codecs=vp8" });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
        };

        recorder.start(1000); // chunk every second
        setMediaRecorder(recorder);
      } catch (err) {
        console.warn("MediaRecorder creation with standard codecs failed or was blocked by frame sandbox. Recording will be simulated.", err);
      }
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black text-on-surface overflow-hidden flex flex-col w-screen h-screen">
      
      {/* 1. Camera live video feed behind the UI overlays */}
      <div className="absolute inset-0 z-0 bg-[#060814]">
        {videoStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#020617] via-[#0d1326] to-[#040814] relative">
            {/* Blurred ambient elements as fallback */}
            <div className="absolute top-[20%] left-[10%] w-[35%] h-[40%] bg-primary/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[35%] bg-secondary/10 rounded-full blur-[90px]"></div>
            
            <div className="z-10 text-center space-y-3 px-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_15px_rgba(255,45,120,0.15)] animate-pulse">
                <RefreshCw className="w-7 h-7 text-primary animate-spin-slow" />
              </div>
              <p className="text-on-surface text-sm font-label uppercase font-semibold">Simulated Creator Studio Preview</p>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                Cho phép quyền truy cập camera trong trình duyệt để hiển thị khuôn mặt của bạn ngay trực tiếp đằng sau phần chữ chạy.
              </p>
            </div>
          </div>
        )}

        {/* Studio grid mesh overlay */}
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-on-surface-variant/30">
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div></div>
          </div>
        )}

        {/* Lens center pointer target */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-primary/40 pointer-events-none opacity-20"></div>
      </div>

      {/* Extreme Ring light frame flash overlays */}
      {ringLight && (
        <div className="absolute inset-x-0 inset-y-0 border-[16px] border-white/80 pointer-events-none z-10 animate-fade-in shadow-[inset_0_0_80px_rgba(255,255,255,0.4)]"></div>
      )}

      {/* TOP APPARAT HUD */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${isRecording ? "bg-recording-red animate-pulse" : "bg-on-surface-variant/50"}`}></div>
          <span className="font-mono text-sm tracking-widest text-on-surface font-extrabold uppercase">
            {isRecording ? formatTime(seconds) : "00:00:00"}
          </span>
        </div>

        {/* Statuses badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20 font-mono text-[10px] text-secondary">
            <Mic className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">VOICE TRACKING</span>
          </div>

          <div className="bg-surface-glass/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 font-mono text-[10px] text-primary">
            <span className="font-bold">4K / 60FPS</span>
          </div>
        </div>
      </header>

      {/* CENTER PROMPTER OVERLAY text scrolling area */}
      <div className="flex-1 flex items-start justify-center z-10 px-6 pt-3 pb-36 w-full select-none">
        
        {/* Transparent script block back-plate adjustable through Opacity slider */}
        <div 
          className="w-full max-w-2xl rounded-3xl p-6 relative h-[calc(100vh-210px)] min-h-[420px] max-h-[620px] overflow-hidden script-scroll-mask border transition-colors duration-200 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
          style={{ backgroundColor: `rgba(8, 8, 16, ${textOpacity})` }}
        >
          {/* Active topmost horizontal reading focus guide */}
          <div className="absolute top-[20%] left-0 right-0 h-16 bg-[#00ffcc]/10 border-y border-[#00ffcc]/20 pointer-events-none flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-ping"></span>
              <span className="font-mono text-[9px] text-[#00ffcc] font-extrabold tracking-widest uppercase">GAZE TARGET</span>
            </div>
            <span className="font-mono text-[8px] text-white/50 tracking-wider">MẮT NHÌN THẲNG LÊN ỐNG KÍNH CAMERA Ở TRÊN</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-[#00ffcc] font-extrabold tracking-widest uppercase">FOCUS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-ping"></span>
            </div>
          </div>

          {/* Actual scrolled text container aligned to the reading line */}
          <div 
            ref={scrollContainerRef}
            className="w-full text-center space-y-9 select-none"
            style={{ 
              transform: `translateY(${76 - scrollY}px)`,
              transition: isRecording ? "transform 0.1s linear" : "transform 0.3s ease"
            }}
          >
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
                    lineHeight: "1.42",
                    fontFamily: getFontFamilyStyle(defaultFontFamily)
                  }}
                  className="font-extrabold text-[#dae2fd] text-center max-w-xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                >
                  {para}
                </p>
              );
            })}
          </div>
        </div>

      </div>

      {/* Countdown Visual Indicator */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs z-[90] pointer-events-none">
          <div className="font-display font-extrabold text-7xl text-primary animate-ping">
            {countdown === 0 ? "START" : countdown}
          </div>
        </div>
      )}

      {/* LOWER RECORDING TOOLS SLIDERS HUD */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 pt-6 bg-gradient-to-t from-black via-black/95 to-transparent z-40">
        
        {/* ROW OF 4 UTILITY CONTROLS - REPOSITIONED TO PREVENT TEXT CLIPPING */}
        <div className="flex justify-center items-center gap-3 mb-4 max-w-xs mx-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
              showGrid ? "border-primary text-primary bg-primary/15" : "border-white/5 bg-surface-container/70 text-on-surface-variant hover:bg-surface-bright"
            }`}
            title="Bật/Tắt lưới"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setCountdown(3);
            }}
            disabled={isRecording}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 text-on-surface bg-surface-container/70 backdrop-blur-md hover:bg-surface-bright transition-all active:scale-95 disabled:opacity-40"
            title="Đếm ngược 3 giây"
          >
            <TimerIcon className="w-4 h-4 text-secondary" />
          </button>

          <button
            onClick={() => setRingLight(!ringLight)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
              ringLight ? "border-tertiary text-tertiary bg-tertiary/15 shadow-[0_0_12px_rgba(255,224,74,0.3)]" : "border-white/5 bg-surface-container/70 text-on-surface hover:bg-surface-bright"
            }`}
            title="Đèn trợ sáng (Simulated Ring Light)"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={handleFlipCamera}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 text-on-surface bg-surface-container/70 backdrop-blur-md hover:bg-surface-bright transition-all active:scale-95"
            title="Chuyển đổi Camera trước/sau"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* COMPREHENSIVE CONTROL SLIDERS HUD (Opacity, Text Size, Progress Speed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-4 px-6 items-center">
          
          {/* Background Opacity Adjust */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
              <span>Nền đệm</span>
              <span>{Math.round(textOpacity*100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.85"
              step="0.05"
              value={textOpacity}
              onChange={(e) => setTextOpacity(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Cỡ chữ Adjust - USER REQUESTED FEATURE */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-[#00ffcc] uppercase tracking-wider">
              <span>Cỡ chữ</span>
              <span className="font-bold">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="52"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00ffcc]"
            />
          </div>

          {/* Speed Adjust */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-secondary uppercase tracking-wider">
              <span>Tốc độ</span>
              <span>{speed} WPM</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-secondary"
            />
          </div>

        </div>

        {/* Central Record Trigger Circle and Action HUD bar */}
        <div className="flex items-center justify-between max-w-xl mx-auto px-6 mt-1">
          
          {/* Action Left */}
          <button 
            onClick={() => {
              if (isRecording) handleToggleRecord();
              onExit();
            }}
            className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#ff2d78]" />
            <span className="font-mono text-[10px] tracking-wider font-bold">THOÁT STUDIO</span>
          </button>

          {/* Recording Trigger Circle with Pause / Resume support */}
          <div className="flex items-center gap-3 shrink-0">
            {isRecording && (
              <button
                onClick={handleTogglePause}
                className="w-24 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-surface-container/80 text-on-surface hover:bg-surface-bright active:scale-95 transition-all text-[9px] font-mono font-bold px-2 py-1.5 gap-1.5 shadow-lg"
                title={isPaused ? "Tiếp tục quay clip" : "Tạm dừng quay clip"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">TIẾP TỤC</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-400">TẠM DỪNG</span>
                  </>
                )}
              </button>
            )}

            <div className="relative flex items-center justify-center shrink-0">
              <button
                onClick={handleToggleRecord}
                className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300 group outline-none ${
                  isRecording 
                    ? "border-white/95 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                    : "border-recording-red hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                }`}
              >
                <div 
                  className={`bg-recording-red transition-all duration-300 ${
                    isRecording 
                      ? "w-5 h-5 rounded-md" 
                      : "w-10 h-10 rounded-full group-hover:scale-102"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Right - Download trigger */}
          {recordedVideoUrl ? (
            <a
              href={recordedVideoUrl}
              download={`${script.title.replace(/\s+/g, "_")}_record.webm`}
              className="flex items-center gap-1.5 text-secondary hover:text-white transition-all bg-secondary/10 hover:bg-secondary/25 border border-secondary/25 hover:border-secondary/40 px-2.5 py-1.5 rounded-lg font-mono text-[9px] tracking-wider font-bold"
            >
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              <span>TẢI VIDEO</span>
            </a>
          ) : (
            <div className="flex items-center gap-1 text-on-surface-variant/40 font-mono text-[10px] tracking-wider font-bold">
              <span>SẴN SÀNG</span>
              <Sliders className="w-4 h-4 text-secondary" />
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

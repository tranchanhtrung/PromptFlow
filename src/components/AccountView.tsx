import { useState, useEffect, useRef } from "react";
import { 
  User, 
  ShieldCheck, 
  Zap, 
  Star, 
  Check, 
  CreditCard, 
  QrCode, 
  ChevronRight, 
  Sparkles, 
  Lock, 
  BadgeCheck, 
  TrendingUp, 
  HelpCircle,
  Copy,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface AccountViewProps {
  isPro: boolean;
  onTogglePro: (proState: boolean) => void;
  userEmail: string;
}

export default function AccountView({
  isPro,
  onTogglePro,
  userEmail: initialEmail
}: AccountViewProps) {
  // Local active states
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("promptflow_account_email") || initialEmail;
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("promptflow_account_username") || "Trần Chánh Trung";
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempUsername, setTempUsername] = useState(username);

  // Upgrade Pricing & promotion states
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in ratio (0 to 1)
  const [promoMessage, setPromoMessage] = useState({ text: "", type: "" }); // "success" or "error"
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");

  // Credit Card state variables
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Upgrade transaction progress states
  const [checkoutPhase, setCheckoutPhase] = useState<"idle" | "verifying" | "success">("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  // States & Scroll loop for Live Teleprompter Speed Previewer
  const [previewWpm, setPreviewWpm] = useState(130);
  const [isPreviewRunning, setIsPreviewRunning] = useState(true);
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPreviewRunning) return;
    let lastTime = performance.now();
    let animationFrameId: number;

    const scrollLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const container = previewScrollContainerRef.current;
      if (container) {
        // WPM speed simulation factor (0.24 matches typical reading speed per word)
        const pixelsPerSecond = previewWpm * 0.24;
        let nextScrollTop = container.scrollTop + (pixelsPerSecond * deltaTime);

        const maxScroll = container.scrollHeight - container.clientHeight;
        if (nextScrollTop >= maxScroll) {
          nextScrollTop = 0;
        }
        container.scrollTop = nextScrollTop;
      }

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPreviewRunning, previewWpm]);

  // Base Prices (VND / USD exchange equivalence)
  const baseMonthlyPrice = 149000; // 149,000 VND
  const baseYearlyPrice = 1190000; // 1,190,000 VND (approx ~ 33% discount)

  const currentOriginalPrice = billingCycle === "monthly" ? baseMonthlyPrice : baseYearlyPrice;
  const currentFinalPrice = Math.round(currentOriginalPrice * (1 - appliedDiscount));

  // Sync profile details
  useEffect(() => {
    localStorage.setItem("promptflow_account_email", email);
    localStorage.setItem("promptflow_account_username", username);
  }, [email, username]);

  // Apply promo codes checker
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoMessage({ text: "Vui lòng nhập mã giảm giá", type: "error" });
      return;
    }

    if (code === "SIEUPRO" || code === "PRESIDENT") {
      setAppliedDiscount(0.5); // 50% discount
      setPromoMessage({ text: "Áp dụng thành công! Đã giảm ngay 50% giá trị gói.", type: "success" });
    } else if (code === "FREEPRO" || code === "PRO0D") {
      setAppliedDiscount(1.0); // 100% discount
      setPromoMessage({ text: "Mã VIP bảo mật cực cao! Giảm giá 100% khóa học/gói dịch vụ.", type: "success" });
    } else {
      setPromoMessage({ text: "Mã giảm giá đã hết hạn hoặc không tồn tại.", type: "error" });
      setAppliedDiscount(0);
    }
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (tempEmail.trim() && tempUsername.trim()) {
      setEmail(tempEmail);
      setUsername(tempUsername);
      setIsEditingProfile(false);
    }
  };

  // Format Credit Card Values
  const handleCardNumberChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    const trimmed = numeric.slice(0, 16);
    const matches = trimmed.match(/.{1,4}/g);
    setCardNumber(matches ? matches.join(" ") : trimmed);
  };

  const handleExpiryChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    if (numeric.length <= 4) {
      const parts = [];
      if (numeric.length > 0) parts.push(numeric.slice(0, 2));
      if (numeric.length > 2) parts.push(numeric.slice(2, 4));
      setCardExpiry(parts.join("/"));
    }
  };

  const playChimeSoundNow = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.08, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = audioCtx.currentTime;
      // Arpeggio chimes: C5 -> E5 -> G5 -> C6
      playTone(523.25, now, 0.15);
      playTone(659.25, now + 0.08, 0.15);
      playTone(783.99, now + 0.16, 0.15);
      playTone(1046.50, now + 0.24, 0.35);
    } catch (e) {
      console.warn("Audio Context synth chime blocked by policy or unsupported.");
    }
  };

  // Submit PRO registration Simulation
  const handleRegisterPro = () => {
    // Basic fields validation if card and paid > 0
    if (paymentMethod === "card" && currentFinalPrice > 0) {
      if (cardNumber.length < 19 || !cardName.trim() || cardExpiry.length < 5 || cardCvc.length < 3) {
        alert("Vui lòng điền đầy đủ và đúng thông tin thẻ tín dụng của bạn!");
        return;
      }
    }

    setCheckoutPhase("verifying");
    setProgressPercent(10);
    setProgressMessage("Kết nối mạng gateway Napas / Visa Secure...");

    // Stage 1 animation logic
    setTimeout(() => {
      setProgressPercent(45);
      setProgressMessage("Xác thực mã bảo mật và sao lưu dữ liệu hóa đơn...");
    }, 700);

    // Stage 2 animation logic
    setTimeout(() => {
      setProgressPercent(80);
      setProgressMessage("Xử lý phân bổ dung lượng lưu trữ đám mây kịch bản...");
    }, 1500);

    // Stage 3 finish logic
    setTimeout(() => {
      setProgressPercent(100);
      setProgressMessage("Kích hoạt đặc quyền PREMIUM PRO thành công!");
      
      setTimeout(() => {
        onTogglePro(true);
        setCheckoutPhase("success");
        playChimeSoundNow();

        // Optionally use browser speech generator
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance("Đăng ký PRO thành công! Chúc mừng bạn đã mở khoá toàn bộ tính năng!");
          utterance.lang = "vi-VN";
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    }, 2200);
  };

  // Downgrade to standard free logic
  const handleDowngradeToFree = () => {
    onTogglePro(false);
    setCheckoutPhase("idle");
    setPromoCode("");
    setAppliedDiscount(0);
    setPromoMessage({ text: "", type: "" });
    setShowDowngradeConfirm(false);
    
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* HEADER SECTION WITH DESIGN ATMOSPHERE */}
      <header className="flex justify-between items-center py-4 border-b border-white/5 bg-surface-container-low/30 px-1 rounded-b-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[1px] flex items-center justify-center shadow-lg shadow-primary/10">
            <div className="w-full h-full bg-background rounded-[11px] flex items-center justify-center">
              <User className="w-5 h-5 text-primary stroke-[2.25]" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-primary tracking-tight">Account & Membership</h1>
            <p className="text-[9px] font-mono text-[#00ffcc] uppercase tracking-widest font-bold">Thành viên & Đăng ký gói PRO</p>
          </div>
        </div>

        {/* Floating PRO active pill indicator if PRO */}
        {isPro && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>PREMIUM PRO</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACCOUNT INFOMATION CONTROL CARD & STATUS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PROFILE CONTROL CARD */}
          <div className="glass-card relative p-6 bg-surface-container-low/70 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            
            {/* Background absolute graphic detail */}
            <div className="absolute right-[-40px] top-[-40px] w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              
              {/* Glowing Avatar Frame */}
              <div className={`w-20 h-20 rounded-full p-[3px] shadow-xl ${
                isPro 
                  ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-primary animate-spin-slow" 
                  : "bg-surface-container border border-white/10"
              }`}>
                <div className="w-full h-full rounded-full bg-[#111119] flex items-center justify-center select-none font-display font-black text-lg text-white">
                  {username ? username.split(" ").pop()?.slice(0, 2).toUpperCase() : "PF"}
                </div>
              </div>

              {/* Display or Edit form */}
              {!isEditingProfile ? (
                <div className="space-y-1">
                  <h2 className="text-base font-display font-black text-on-surface tracking-tight flex items-center justify-center gap-1.5 py-0.5">
                    {username}
                    {isPro && (
                      <BadgeCheck className="w-4.5 h-4.5 text-amber-400 fill-amber-400 animate-bounce" />
                    )}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-mono">{email}</p>
                  
                  <button 
                    onClick={() => {
                      setTempUsername(username);
                      setTempEmail(email);
                      setIsEditingProfile(true);
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white border border-white/5 text-[10px] uppercase font-mono tracking-wider transition-all"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3 p-1">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase">Tên hiển thị:</label>
                    <input 
                      type="text"
                      className="w-full h-9 px-3 bg-surface-container border border-white/10 rounded-lg text-xs text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono font-bold text-on-surface-variant/70 uppercase">Email liên hệ:</label>
                    <input 
                      type="email"
                      className="w-full h-9 px-3 bg-surface-container border border-white/10 rounded-lg text-xs text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-on-surface-variant text-[10px] font-mono uppercase"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[10px] font-mono font-bold uppercase transition-all"
                    >
                      Lưu lại
                    </button>
                  </div>
                </div>
              )}

              {/* Status Section Divider */}
              <div className="w-full border-t border-white/5 pt-4 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-on-surface-variant uppercase text-[10px]">Cấp độ tài khoản/Tier:</span>
                  <span className={`px-2.5 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-widest ${
                    isPro 
                      ? "bg-amber-500/10 border border-amber-500/25 text-amber-400" 
                      : "bg-white/5 border border-white/5 text-on-surface-variant"
                  }`}>
                    {isPro ? "★ PREMIUM PRO" : "STANDARD FREE"}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* QUOTA CAPACITIES & SYSTEM USAGE LIMITS */}
          <div className="glass-card p-6 bg-surface-container-low/70 border border-white/5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-on-surface/90 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span>Hạn mức sử dụng tài nguyên</span>
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* Script capacity indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
                  <span>Dung lượng kịch bản (Scripts):</span>
                  <span className="text-white font-bold">{isPro ? "VÔ HẠN (∞)" : "30 / 50 kịch bản (Dùng thử tăng 10 lần)"}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isPro ? "bg-gradient-to-r from-amber-500 to-rose-400" : "bg-primary"}`}
                    style={{ width: isPro ? "100%" : "60%" }}
                  ></div>
                </div>
              </div>

              {/* Video recording runtime limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
                  <span>Thời lượng quay mỗi Video:</span>
                  <span className="text-white font-bold">{isPro ? "Tối đa 30 Phút (VIP Không giới hạn)" : "Tối đa 20 Phút (Gói dùng thử nhân 10 lần)"}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isPro ? "bg-gradient-to-r from-amber-500 to-rose-400" : "bg-secondary"}`}
                    style={{ width: isPro ? "100%" : "40%" }}
                  ></div>
                </div>
              </div>

              {/* Each record duration disclaimer */}
              <div className="flex justify-between items-center py-1 mt-1 border-t border-white/5">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Giới hạn thời lượng quay:</span>
                <span className="font-mono text-[9px] font-bold text-amber-400">
                  MỖI RECORD KHÔNG QUÁ 30 PHÚT
                </span>
              </div>

              {/* Sound and gaze guide status */}
              <div className="flex justify-between items-center py-1 mt-1 border-t border-white/5">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Mắt nhìn cố định (Voice Track):</span>
                <span className={`font-mono text-[9px] font-bold ${isPro ? "text-[#00ffcc]" : "text-amber-400/80"}`}>
                  {isPro ? "ĐÃ KÍCH HOẠT" : "BẢN THỬ NGHIỆM"}
                </span>
              </div>

              {/* Downward control simulation */}
              {isPro && (
                <div className="pt-3">
                  {showDowngradeConfirm ? (
                    <div className="p-3 rounded-xl border border-recording-red/30 bg-recording-red/5 space-y-2.5">
                      <p className="text-[10px] text-recording-red font-bold uppercase tracking-wider">Hủy đăng ký Premium?</p>
                      <p className="text-[10px] text-on-surface-variant/80">Bạn sẽ mất các quyền lợi Pro, giới hạn thời lượng quay, và tính năng theo dõi mắt thông minh.</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleDowngradeToFree}
                          className="flex-1 py-1.5 bg-recording-red text-white hover:bg-recording-red/80 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Xác nhận hạ cấp
                        </button>
                        <button 
                          onClick={() => setShowDowngradeConfirm(false)}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Giữ lại Pro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDowngradeConfirm(true)}
                      className="w-full py-2 border border-recording-red/20 text-recording-red bg-recording-red/5 hover:bg-recording-red hover:text-white rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                    >
                      Hạ cấp về bản Free (Hủy Đăng ký)
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* LIVE CHỮ CHẠY TỐC ĐỘ PREVIEW */}
          <div className="glass-card p-6 bg-surface-container-low/70 border border-white/5 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-on-surface/90 flex items-center gap-1.5">
                  <span className="animate-spin text-secondary">⚙️</span>
                  <span>Trải nghiệm Máy Chạy Chữ</span>
                </h3>
                <p className="text-[9px] font-mono text-[#00ffcc] uppercase tracking-wider">Cảm nhận và điều chỉnh tốc độ đọc</p>
              </div>

              {/* Badges based on WPM */}
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                  previewWpm < 120 
                    ? "bg-slate-500/10 border border-slate-500/20 text-slate-400" 
                    : previewWpm < 180 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                    : previewWpm < 250 
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" 
                    : "bg-recording-red/10 border border-recording-red/20 text-recording-red"
                }`}>
                  {previewWpm < 120 
                    ? "Nói Chậm / Thư giãn" 
                    : previewWpm < 180 
                    ? "Vừa phải / Chuẩn tin tức" 
                    : previewWpm < 250 
                    ? "Nói Nhanh / Hào hứng" 
                    : "Siêu Tốc / Bắn Rap"}
                </span>
              </div>
            </div>

            {/* LIVE SIMULATOR DISPLAY SCREEN */}
            <div className="relative rounded-2xl bg-black/45 border border-white/5 overflow-hidden h-[150px] shadow-inner select-none">
              
              {/* Center focus indicator line overlay */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 pointer-events-none bg-primary/5 border-t border-b border-primary/10 flex items-center justify-between px-3">
                <span className="text-[7px] font-mono text-primary animate-pulse">▶ ĐỌC TẠI ĐÂY</span>
                <span className="text-[7px] font-mono text-primary animate-pulse">READ LINE ◀</span>
              </div>

              {/* Scrolling text area */}
              <div 
                ref={previewScrollContainerRef}
                className="w-full h-full overflow-y-scroll no-scrollbar py-[60px] px-4 font-display font-semibold text-sm leading-relaxed text-center text-white/50"
                style={{ scrollBehavior: 'auto' }}
              >
                <div className="space-y-4">
                  <p className="text-white font-black neon-glow-pink text-xs">CHÀO MỪNG BẠN ĐẾN VỚI VTELEPROMPTER!</p>
                  <p>Màn hình này đang mô phỏng máy chạy chữ với tốc độ thực tế.</p>
                  <p className="text-secondary font-bold text-xs">Hãy nói đuổi theo dòng chữ này để cảm nhận nhịp điệu.</p>
                  <p>Hệ thống hỗ trợ tốc độ từ cực chậm 100 từ mỗi phút đến cực đại là 500 từ mỗi phút.</p>
                  <p className="text-[#00ffcc] font-extrabold font-mono text-xs">DÙNG THANH TRƯỢT DƯỚI ĐÂY ĐỂ ĐIỀU CHỈNH CHUẨN XÁC.</p>
                  <p>Học cách làm chủ tốc độ nói sẽ giúp bạn tự tin gấp mười lần trước ống kính camera.</p>
                  <p className="text-white/30 text-xs">--- Kịch bản chạy chữ mẫu kết thúc --- Bấm Reset để chạy lại từ đầu ---</p>
                </div>
              </div>
            </div>

            {/* LIVE SPEED SLIDER CONTROLS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[9px] uppercase font-bold text-on-surface-variant/70">Thiết lập Tốc độ Trôi:</span>
                <span className="font-mono font-black text-[#00ffcc] text-xs">
                  {previewWpm} WPM (từ/phút)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Decrement Button */}
                <button
                  type="button"
                  onClick={() => setPreviewWpm(prev => Math.max(100, prev - 10))}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 flex items-center justify-center font-mono font-bold cursor-pointer transition-colors"
                >
                  -
                </button>

                {/* Range Input Slider container */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={5}
                    value={previewWpm}
                    onChange={(e) => setPreviewWpm(Number(e.target.value))}
                    className="w-full accent-primary bg-white/10 rounded-lg appearance-none h-2 cursor-pointer focus:outline-none"
                  />
                </div>

                {/* Increment Button */}
                <button
                  type="button"
                  onClick={() => setPreviewWpm(prev => Math.min(500, prev + 10))}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 flex items-center justify-center font-mono font-bold cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>

              {/* Operational Control triggers */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPreviewRunning(!isPreviewRunning)}
                  className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                    isPreviewRunning 
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                  }`}
                >
                  {isPreviewRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Tạm dừng cuộn</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>Bắt đầu cuộn</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewScrollContainerRef.current) {
                      previewScrollContainerRef.current.scrollTop = 0;
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-on-surface-variant hover:text-white hover:bg-white/10 text-[10px] font-mono uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="Cuộn lại từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREMIUM PRO OFFERS & DYNAMIC REGISTRATION WITH MOCK TRANSACTION GATEWAYS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* IF CURRENTLY PRO, RENDER SUCCESS CELEBRATION BOX */}
          {isPro ? (
            <div className="glass-card relative p-8 bg-surface-container-low/70 border-3 border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl space-y-6 text-center">
              {/* Confetti vector simulation in back */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute left-1/4 top-1/4 w-2 h-2 rounded-full bg-pink-500 animate-ping"></div>
                <div className="absolute right-1/4 top-1/3 w-3 h-3 rounded-full bg-amber-400 animate-ping"></div>
                <div className="absolute left-1/3 top-2/3 w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <div className="absolute right-1/4 top-2/3 w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>

              <div className="inline-flex p-4 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 shadow-xl mb-1 animate-bounce">
                <Star className="w-8 h-8 fill-amber-400" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display font-black text-xl text-amber-400 neon-glow">BẠN ĐANG LÀ THÀNH VIÊN PREMIUM PRO!</h2>
                <p className="text-xs text-on-surface-variant/90 max-w-md mx-auto leading-relaxed">
                  Cảm ơn Quý khách <strong className="text-primary font-bold">{username}</strong> đã tin dùng hệ thống. Chúc bạn sản xuất ra những thước phim triệu view với độ lưu kho kịch bản vô hạn và tính năng Voice Tracking mượt mà nhất.
                </p>
              </div>

              <div className="py-2.5 px-4 bg-[#00ffcc]/5 border border-[#00ffcc]/10 rounded-2xl inline-block max-w-sm">
                <div className="flex items-center gap-2 justify-center font-mono text-[10px] text-[#00ffcc] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 fill-current/10 shrink-0" />
                  <span>Cấp giấy phép: Active và tự động kích hoạt</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 text-left space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/80 font-bold block text-center">Quyền lợi VIP đang được kích hoạt:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0 mt-0.5" />
                    <span>Kho lưu trữ kịch bản không giới hạn số lượng.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0 mt-0.5" />
                    <span>Bộ đếm tốc độ Teleprompter cực đại 500 WPM.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0 mt-0.5" />
                    <span>Gửi ý tưởng kịch bản AI không giới hạn số ký tự.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0 mt-0.5" />
                    <span>Chế độ Voice Tracking mắt bám sát camera sát trần.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* OFFERS PLAN & CHECKOUT SHEET FOR FREE USERS */
            <div className="glass-card p-6 bg-surface-container-low/70 border border-white/5 rounded-3xl space-y-6 shadow-xl relative">
              
              {/* Promotional Header Badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-secondary text-white text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">
                KHUYẾN MẠI GIẢM GIÁ 50%
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-secondary font-mono text-[9px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>CƠ HỘI SỞ HỮU GÓI VIP</span>
                </div>
                <h2 className="font-display font-black text-base text-on-surface tracking-tight">Nâng cấp Lên PREMIUM PRO ngay hôm nay</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Trải nghiệm đầy đủ tính năng biên kịch AI không giới hạn, máy chạy chữ thông minh và bộ chỉnh tốc độ lên tới 500 WPM giúp bạn chuyên nghiệp hơn trước ống kính.
                </p>
              </div>

              {/* BILLING TOGGLE (Monthly vs Yearly) */}
              <div className="flex p-1 bg-surface-container rounded-2xl max-w-[280px] border border-white/5">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-primary text-white shadow-md font-extrabold"
                      : "text-on-surface-variant/70 hover:text-white"
                  }`}
                >
                  Hàng tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    billingCycle === "yearly"
                      ? "bg-primary text-white shadow-md font-extrabold"
                      : "text-on-surface-variant/70 hover:text-white"
                  }`}
                >
                  <span>Hàng năm</span>
                  <span className="text-[8px] bg-emerald-500 text-white px-1 py-0.2 rounded font-mono font-bold scale-90">SAVE 33%</span>
                </button>
              </div>

              {/* BENEFITS LIST GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-container/30 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ffcc]" />
                  <span>Lưu trữ Vô Hạn kịch bản đám mây</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ffcc]" />
                  <span>Bộ lọc WPM mở rộng: 100 - 500 WPM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ffcc]" />
                  <span>Hỗ trợ kỹ thuật ánh nhìn sát camera</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00ffcc]" />
                  <span>Biên tập kịch bản AI nâng cao không giới hạn</span>
                </div>
              </div>

              {/* PROMO CODE BOX */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase font-bold block">Nhập mã ưu đãi (Nếu có):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Mã giảm giá (Ví dụ: SIEUPRO, FREEPRO)"
                    className="flex-1 h-9 px-3 bg-surface-container border border-white/5 rounded-xl text-xs text-on-surface outline-none placeholder:text-on-surface-variant/30 uppercase focus:border-secondary/40"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 bg-secondary text-white text-[10px] font-mono font-bold uppercase rounded-xl hover:opacity-90 active:scale-95 transition-all"
                  >
                    Áp dụng
                  </button>
                </div>
                {promoMessage.text && (
                  <p className={`text-[10px] font-mono ${promoMessage.type === "success" ? "text-emerald-400" : "text-recording-red"}`}>
                    ★ {promoMessage.text}
                  </p>
                )}
              </div>

              {/* PRICING BLOCK */}
              <div className="p-4 bg-surface-container rounded-2xl border border-white/[0.02] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Tổng chi phí nâng cấp:</span>
                  <div className="flex items-baseline gap-2">
                    {appliedDiscount > 0 && (
                      <span className="text-xs line-through text-on-surface-variant/50 font-mono">
                        {currentOriginalPrice.toLocaleString("vi-VN")} ₫
                      </span>
                    )}
                    <span className="text-xl font-display font-black text-[#00ffcc] neon-glow">
                      {currentFinalPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-on-surface-variant">
                    {billingCycle === "monthly" ? "/ mỗi tháng thanh toán" : "/ một năm duy nhất"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[8px] bg-secondary/10 border border-secondary/25 text-secondary px-2.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                    Xác thực an toàn
                  </span>
                </div>
              </div>

              {/* METHOD SELECTION TABS */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono text-on-surface-variant/70 uppercase font-bold block">Chọn phương thức thanh toán:</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 p-3.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === "card" 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-surface-container/50 border-white/5 text-on-surface-variant/70 hover:border-white/10"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <p className="text-xxs font-mono font-black uppercase tracking-wider leading-none">Thẻ Tín Dụng</p>
                      <p className="text-[9px] leading-tight text-on-surface-variant">Visa / Mastercard / JCB</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("qr")}
                    className={`flex-1 p-3.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === "qr" 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-surface-container/50 border-white/5 text-on-surface-variant/70 hover:border-white/10"
                    }`}
                  >
                    <QrCode className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <p className="text-xxs font-mono font-black uppercase tracking-wider leading-none">Quét Mã QR</p>
                      <p className="text-[9px] leading-tight text-on-surface-variant">VietQR / MoMo / ZaloPay</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* DYNAMIC FORMS SECTION */}
              <div className="pt-2">
                {paymentMethod === "card" ? (
                  /* CARD METHOD: Renders beautiful visual plastic card and form inputs */
                  <div className="space-y-4">
                    
                    {/* VISUAL MINI CARD GRAPHIC */}
                    <div className="relative w-full h-[156px] rounded-2xl bg-gradient-to-tr from-[#111119] via-slate-900 to-[#1e1e2f] border border-white/15 p-5 flex flex-col justify-between overflow-hidden shadow-xl font-mono select-none">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-cards-grid bg-[size:10px_10px] opacity-10 pointer-events-none"></div>
                      <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>

                      <div className="flex justify-between items-start z-10">
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-white/40 tracking-widest font-bold uppercase">PRO MEMBERSHIP CARD</span>
                          <div className="h-6 w-9 rounded bg-[#ffcc00]/25 border border-[#ffcc00]/30 flex items-center justify-center text-[10px] text-[#ffcc00]">CHIP</div>
                        </div>
                        <div className="text-right text-[10px] font-black tracking-widest text-[#00ffcc] neon-glow">
                          PREMIUM
                        </div>
                      </div>

                      {/* Display Numbers formatted */}
                      <div className="text-sm font-bold tracking-widest text-center text-[#dae2fd] py-2 z-10">
                        {cardNumber || "••••  ••••  ••••  ••••"}
                      </div>

                      <div className="flex justify-between items-end z-10">
                        <div>
                          <span className="text-[7px] text-white/35 block uppercase">Chủ Thẻ / Cardholder</span>
                          <span className="text-xxs font-bold text-white uppercase tracking-wider">{cardName || "TEN CHU THE"}</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[7px] text-white/35 block uppercase">Hạn / Expiry</span>
                            <span className="text-xxs font-bold text-white">{cardExpiry || "MM/YY"}</span>
                          </div>
                          <div>
                            <span className="text-[7px] text-white/35 block uppercase">CVC</span>
                            <span className="text-xxs font-bold text-white">{cardCvc || "•••"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE INPUTS FORM */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-on-surface-variant font-bold uppercase block">Số Thẻ (Card Number):</label>
                        <input
                          type="text"
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          onFocus={() => setFocusedField("number")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full h-10 px-3 bg-surface-container border border-white/5 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-on-surface-variant font-bold uppercase block">Tên Trên Thẻ (Card Name):</label>
                        <input
                          type="text"
                          placeholder="NATHAN TRAN"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full h-10 px-3 bg-surface-container border border-white/5 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40 uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-on-surface-variant font-bold uppercase block">Ngày Hết Hạn (Expiry MM/YY):</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          onFocus={() => setFocusedField("expiry")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full h-10 px-3 bg-surface-container border border-white/5 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-on-surface-variant font-bold uppercase block">Mã Bảo Mật (CVC):</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          onFocus={() => setFocusedField("cvc")}
                          onBlur={() => setFocusedField(null)}
                          className="w-full h-10 px-3 bg-surface-container border border-white/5 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* QR METHOD: Displays a realistic QR Code scanner payload */
                  <div className="p-4 bg-surface-container border border-white/5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                    
                    {/* QR Code Graphic Frame */}
                    <div className="w-32 h-32 bg-white rounded-xl p-2.5 flex items-center justify-center shrink-0 border border-white/10 shadow-lg relative overflow-hidden group">
                      
                      {/* Decorative scanning neon line in overlay */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00ffcc] shadow-[0_0_10px_#00ffcc] animate-scan pointer-events-none"></div>

                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=PRO_UPGRADE_${email}_CYCLE_${billingCycle}_VAL_${currentFinalPrice}`} 
                        alt="QR Code Pay"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center gap-1 text-secondary font-mono font-bold text-[10px]">
                        <span>NGÂN HÀNG THỤ HƯỞNG: VIETCOMBANK</span>
                      </div>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase font-bold leading-tight">
                        Số tài khoản: <strong className="text-white">9982.5574.999</strong><br />
                        Tên tài khoản: <strong className="text-white">VTELEPROMPTER VIP GATEWAY</strong><br />
                        Nội dung chuyển khoản: <strong className="text-primary tracking-wider font-extrabold uppercase">VTELE PRO {username ? username.toUpperCase().replace(/\s+/g, "") : "VIP"}</strong>
                      </p>
                      
                      <div className="p-2.5 bg-background border border-white/5 rounded-xl flex items-start gap-1.5 text-[10px] leading-relaxed text-on-surface-variant font-mono">
                        <AlertCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        <span>Mẹo: Quét mã QR trên bằng ứng dụng Ngân hàng (VietQR) hoặc ví MoMo để tự động điền số tiền chính xác và lời nhắn bảo mật.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION CALL TO ACTION TRIGGERS */}
              {checkoutPhase === "verifying" ? (
                /* TRANSACTION LOADER SCREEN */
                <div className="p-5 border border-primary/20 bg-primary/5 rounded-2xl space-y-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-primary italic animate-pulse">{progressMessage}</span>
                    <span className="font-bold text-white">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary via-[#ff2d78] to-[#00ffcc] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                /* NORMAL BUTTON SUBMISSION TRIGGER */
                <button
                  onClick={handleRegisterPro}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-display text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2.5 shadow-xl hover:shadow-[0_0_25px_rgba(255,45,120,0.35)] hover:scale-[1.01] active:scale-95 transition-all text-center select-none cursor-pointer"
                >
                  <ShieldCheck className="w-4.5 h-4.5 fill-current/10" />
                  <span>KÍCH HOẠT ĐĂNG KÝ BẢN PRO NGAY</span>
                </button>
              )}

              <p className="text-[10px] text-on-surface-variant/40 text-center font-mono leading-relaxed">
                Khi bấm đăng ký, bạn đồng ý với Điều khoản Sử dụng & Chính sách Bảo mật của vTeleprompter.<br />Giao dịch được mã hóa SSL 256-bit cực kỳ tin cậy và an toàn tuyệt đối.
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

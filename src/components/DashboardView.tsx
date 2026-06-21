import { useState, useMemo } from "react";
import { Search, Bell, Plus, MoreVertical, FileText, Trash2, Copy, Edit3, Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { Workspace, Script } from "../types";
import { DEFAULT_WORKSPACES, calculateDuration } from "../data";

interface DashboardViewProps {
  scripts: Script[];
  workspaces: Workspace[];
  onSelectScript: (scriptId: string) => void;
  onAddScript: (folderId: string) => void;
  onDuplicateScript: (script: Script) => void;
  onDeleteScript: (scriptId: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({
  scripts,
  workspaces,
  onSelectScript,
  onAddScript,
  onDuplicateScript,
  onDeleteScript,
  setActiveTab
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [activeMenuScriptId, setActiveMenuScriptId] = useState<string | null>(null);

  // Calculate script count for each workspace
  const workspaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workspaces.forEach(w => {
      counts[w.id] = scripts.filter(s => s.folderId === w.id).length;
    });
    return counts;
  }, [scripts, workspaces]);

  // Filter scripts based on search term and selected workspace filter
  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const matchSearch =
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWorkspace = selectedWorkspace ? script.folderId === selectedWorkspace : true;
      return matchSearch && matchWorkspace;
    });
  }, [scripts, searchTerm, selectedWorkspace]);

  const handleToggleWorkspaceFilter = (id: string) => {
    if (selectedWorkspace === id) {
      setSelectedWorkspace(null); // Clear filter
    } else {
      setSelectedWorkspace(id);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* TOP HEADER */}
      <header className="flex justify-between items-center py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 p-[2px] bg-gradient-to-tr from-primary to-secondary">
            <img
              className="w-full h-full object-cover rounded-full"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_ydHhlq2eZmFJYWXx3sUS3uL840yDpMiw1rVOuAyUKjXn6tcrTqSR5EL9A--g1_9VwJPBkFKM_LZyckUK_Z2D1vqZHsR4PcrjcfP3j6cogeAKBUEU--gDC9eYIuvCxgYgxbP-Jps6GfHmmSg6sWYUqDgd8Uk75evMmWur6dToENaOvMChFdUzXRvf3O_1RWV6V4q-AJaLl-NH0YDFCoDz2dk9pfjtIRH4pbHNGt-SwWndXKJYlsICezyTQ8P4mjj6sVRqnZprGMt9"
              alt="Avatar Profile"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-primary neon-glow-pink">PromptFlow</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#00ffcc]">AI Creator Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-bright/40 text-on-surface-variant hover:text-on-surface transition-colors">
            <Bell className="w-5 h-5 animate-pulse text-[#00ffcc]" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <section className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/60">
          <Search className="w-5 h-5 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kịch bản, tệp thư mục, hoặc từ khóa..."
          className="w-full h-14 pl-12 pr-4 bg-surface-container border border-white/5 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all text-sm focus:shadow-[0_0_15px_rgba(255,45,120,0.05)]"
        />
      </section>

      {/* WORKSPACES CAROUSEL */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-display font-bold text-base text-primary uppercase tracking-wide">Workspaces / Thư mục</h2>
          <button 
            onClick={() => setSelectedWorkspace(null)} 
            className="text-secondary text-xs font-mono font-medium hover:underline flex items-center gap-1 uppercase"
          >
            Tất cả thư mục <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-3 pt-1 no-scrollbar [-webkit-overflow-scrolling:touch]">
          {workspaces.map((ws) => {
            const isSelected = selectedWorkspace === ws.id;
            const count = workspaceCounts[ws.id] || 0;

            return (
              <div
                key={ws.id}
                onClick={() => handleToggleWorkspaceFilter(ws.id)}
                className={`flex-shrink-0 w-[42%] xs:w-32 h-28 sm:h-40 rounded-2xl p-3 sm:p-4 flex flex-col justify-between border transition-all cursor-pointer group relative ${
                  isSelected
                    ? "bg-gradient-to-b from-[#ff2d78]/25 to-surface-container border-primary shadow-[0_0_15px_rgba(255,45,120,0.15)]"
                    : "bg-surface-container border-white/5 hover:border-primary/40"
                }`}
              >
                {/* Horizontal marker indicator */}
                {isSelected && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_#ff2d78]"></span>
                )}

                {/* Simulated Materials Symbol icons represented dynamically based on meta configs */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${ws.color}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-on-surface line-clamp-1">{ws.name}</p>
                  <p className="text-[10px] font-mono font-medium text-on-surface-variant/70 uppercase">
                    {count} Kịch bản
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT SCRIPTS LIST */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-display font-medium text-base text-primary hover:text-secondary transition-colors uppercase tracking-wider">Kịch bản gần đây</h2>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Filter className="w-3.5 h-3.5" />
            <span>Đang lọc: {selectedWorkspace ? workspaces.find(w => w.id === selectedWorkspace)?.name : "Tất cả"}</span>
          </div>
        </div>

        {filteredScripts.length === 0 ? (
          <div className="p-8 text-center bg-surface-container border border-white/5 rounded-2xl space-y-2">
            <p className="text-on-surface-variant/80 text-sm">Chưa có kịch bản nào phù hợp với tìm kiếm của bạn.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedWorkspace(null);
              }}
              className="text-primary text-xs font-mono font-semibold hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className="relative group p-4 bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(255,45,120,0.04)] transition-all flex flex-col gap-3"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div
                    onClick={() => onSelectScript(script.id)}
                    className="flex-1 flex flex-wrap items-center gap-2 cursor-pointer"
                  >
                    <h3 className="font-display text-base font-bold text-on-surface group-hover:text-primary transition-colors pr-2">
                      {script.title}
                    </h3>
                    {script.isPro && (
                      <span className="bg-gradient-to-r from-[#ff2d78] to-[#ffb784] text-white text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase shadow-[0_0_8px_rgba(255,45,120,0.3)]">
                        PRO
                      </span>
                    )}
                  </div>

                  {/* Operational Settings Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuScriptId(activeMenuScriptId === script.id ? null : script.id)}
                      className="p-1 hover:bg-surface-bright/50 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenuScriptId === script.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-surface-dim border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden text-xs">
                        <button
                          onClick={() => {
                            onSelectScript(script.id);
                            setActiveMenuScriptId(null);
                          }}
                          className="w-full text-left p-2.5 flex items-center gap-2 hover:bg-primary/10 hover:text-primary text-on-surface transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          onClick={() => {
                            onDuplicateScript(script);
                            setActiveMenuScriptId(null);
                          }}
                          className="w-full text-left p-2.5 flex items-center gap-2 hover:bg-secondary/10 hover:text-secondary text-on-surface transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nhân bản</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeleteScript(script.id);
                            setActiveMenuScriptId(null);
                          }}
                          className="w-full text-left p-2.5 flex items-center gap-2 hover:bg-recording-red/10 text-recording-red hover:text-recording-red transition-colors border-t border-white/5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa bỏ</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Context Script Preview Text */}
                <p 
                  onClick={() => onSelectScript(script.id)}
                  className="text-on-surface-variant/80 text-xs line-clamp-2 italic cursor-pointer leading-relaxed hover:text-on-surface transition-colors"
                >
                  "{script.content}"
                </p>

                {/* Meta details footer info */}
                <div onClick={() => onSelectScript(script.id)} className="flex flex-wrap items-center gap-4 mt-2 text-[10px] font-mono text-on-surface-variant uppercase cursor-pointer">
                  <div className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="text-primary font-bold">⏱</span>
                    <span>{calculateDuration(script.content, script.wpm || 130)}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-secondary transition-colors">
                    <span className="text-secondary font-bold">📁</span>
                    <span>{workspaces.find(w => w.id === script.folderId)?.name || "TikTok"}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-tertiary transition-colors ml-auto text-[9px] text-on-surface-variant/40">
                    <span>Đã lưu: {new Date(script.lastUpdated).toLocaleDateString("vi")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FLOATING ACTION ADD NEW SCRIPT FAB BUTTON (Aligned with guide) */}
      <button
        onClick={() => onAddScript(selectedWorkspace || "tiktok")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-[#ff2d78] to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 hover:scale-105 transition-all outline-none duration-200"
      >
        <Plus className="w-8 h-8 font-bold" />
      </button>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Search, Folder, Video, Sliders, ChevronRight, Sparkles, Filter, FileText } from "lucide-react";
import { Workspace, Script } from "../types";
import { calculateDuration } from "../data";

interface RecordCatalogViewProps {
  scripts: Script[];
  workspaces: Workspace[];
  onSelectScriptToRecord: (scriptId: string) => void;
  onAddScript: (folderId: string) => void;
}

export default function RecordCatalogView({
  scripts,
  workspaces,
  onSelectScriptToRecord,
  onAddScript
}: RecordCatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(null);

  // Filter scripts based on folder filter & search keywords
  const filteredScripts = useMemo(() => {
    return scripts.filter(s => {
      const matchSearch = 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchFolder = activeFolderFilter ? s.folderId === activeFolderFilter : true;
      return matchSearch && matchFolder;
    });
  }, [scripts, searchTerm, activeFolderFilter]);

  // Group scripts by workspaces for categorization panels
  const groupedScripts = useMemo(() => {
    const groups: Record<string, Script[]> = {};
    workspaces.forEach(ws => {
      groups[ws.id] = scripts.filter(s => s.folderId === ws.id);
    });
    return groups;
  }, [scripts, workspaces]);

  return (
    <div className="space-y-6 pb-28 font-sans">
      
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-recording-red/10 rounded-lg text-recording-red select-none animate-pulse">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-primary neon-glow-pink">Studio Recording Catalog</h1>
            <p className="text-[9px] font-mono text-[#00ffcc] uppercase tracking-widest font-bold">Danh mục quay kịch bản</p>
          </div>
        </div>
      </header>

      {/* SEARCH AND FILTERING BANNER */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/50">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhanh kịch bản muốn quay..."
            className="w-full h-12 pl-12 pr-4 bg-surface-container border border-white/5 focus:border-recording-red/40 rounded-xl text-on-surface placeholder:text-on-surface-variant/30 outline-none text-xs focus:ring-1 focus:ring-recording-red/20 transition-all"
          />
        </div>

        {/* Categories / Folder filtration filters */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-wider text-on-surface-variant/60 uppercase block px-1">Lọc theo thư mục:</span>
          <div className="flex overflow-x-auto gap-2 pt-0.5 pb-2 px-1 no-scrollbar text-nowrap [-webkit-overflow-scrolling:touch]">
            <button
              onClick={() => setActiveFolderFilter(null)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeFolderFilter === null
                  ? "bg-recording-red/15 border-recording-red text-recording-red font-bold"
                  : "bg-surface-container border-white/5 text-on-surface-variant hover:border-white/10"
              }`}
            >
              ★ Tất cả kịch bản ({scripts.length})
            </button>
            {workspaces.map(ws => {
              const count = groupedScripts[ws.id]?.length || 0;
              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveFolderFilter(ws.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    activeFolderFilter === ws.id
                      ? "bg-recording-red/15 border-recording-red text-recording-red font-bold"
                      : "bg-surface-container border-white/5 text-on-surface-variant hover:border-white/10"
                  }`}
                >
                  📁 {ws.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CATALOG BODY */}
      <div className="space-y-5">
        <div className="flex justify-between items-center px-1 pt-1">
          <h2 className="font-display font-extrabold text-[#e8e0f0] text-sm tracking-wide uppercase">Chọn kịch bản phù hợp</h2>
          <span className="text-[9px] font-mono text-on-surface-variant uppercase">Tìm thấy: {filteredScripts.length} mục</span>
        </div>

        {filteredScripts.length === 0 ? (
          <div className="p-10 text-center bg-surface-container-low border border-white/5 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-on-surface-variant/40">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-on-surface-variant/80 text-xs">Không tìm thấy kịch bản nào phù hợp trong thư mục này.</p>
              <p className="text-[10px] text-on-surface-variant/40">Hãy tạo mới kịch bản trực tiếp trong thư mục này để bắt đầu quay ngay!</p>
            </div>
            <button
              onClick={() => onAddScript(activeFolderFilter || "tiktok")}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              + Tạo kịch bản mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredScripts.map((script) => {
              const parentFolder = workspaces.find(w => w.id === script.folderId);
              
              return (
                <div
                  key={script.id}
                  className="glass-card relative p-5 bg-surface-container-low border border-white/5 hover:border-recording-red/30 rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(239,68,68,0.05)] transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                >
                  <div className="flex-1 space-y-2">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-surface-container border border-white/5 text-secondary text-[9px] font-mono rounded-md uppercase tracking-wide">
                        📁 {parentFolder?.name || "Kịch bản"}
                      </span>
                      {script.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-on-surface-variant/60 text-[9px] font-mono uppercase tracking-widest">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Script details */}
                    <div>
                      <h3 className="font-display text-base font-bold text-on-surface group-hover:text-recording-red transition-colors">
                        {script.title}
                      </h3>
                      <p className="text-on-surface-variant/80 text-xs line-clamp-2 italic leading-relaxed mt-1">
                        "{script.content}"
                      </p>
                    </div>

                    {/* Meta tags indicators */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-on-surface-variant uppercase cursor-pointer">
                      <div className="flex items-center gap-1">
                        <span className="text-recording-red">⏱</span>
                        <span>Thời lượng: {calculateDuration(script.content, script.wpm || 130)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-secondary">⚡</span>
                        <span>{script.wpm || 130} WPM</span>
                      </div>
                    </div>
                  </div>

                  {/* Immediate record action button */}
                  <button
                    onClick={() => onSelectScriptToRecord(script.id)}
                    className="w-full md:w-auto px-5 py-3 bg-recording-red/15 hover:bg-recording-red border border-recording-red/35 hover:border-recording-red text-recording-red hover:text-white rounded-xl flex items-center justify-center gap-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    <Video className="w-4 h-4 fill-current shrink-0" />
                    <span>Quay Video Ngay</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

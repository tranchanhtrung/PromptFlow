import React, { useState, useEffect } from "react";
import { ArrowLeft, History, Settings as SettingsIcon, Sparkles, Bold, Italic, List, Link, Plus, Eye, Video, Check, FolderPlus, Trash2, FileText, Menu, X, Upload, Pencil } from "lucide-react";
import { Script, Workspace } from "../types";
import { calculateDuration, getWordCount } from "../data";

interface EditorViewProps {
  script: Script;
  scripts: Script[];
  workspaces: Workspace[];
  onSave: (updated: Partial<Script>, scriptId?: string) => void;
  onBack: () => void;
  onStartTeleprompter: () => void;
  onStartRecordingMode: () => void;
  onAddScript: (folderId: string, importData?: { title: string; content: string }) => void;
  onDeleteScript: (scriptId: string) => void;
  onSelectScript: (scriptId: string) => void;
  onAddWorkspace: (name: string) => string;
  onUpdateWorkspace: (id: string, name: string) => void;
  onDeleteWorkspace: (id: string) => void;
}

export default function EditorView({
  script,
  scripts,
  workspaces,
  onSave,
  onBack,
  onStartTeleprompter,
  onStartRecordingMode,
  onAddScript,
  onDeleteScript,
  onSelectScript,
  onAddWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace
}: EditorViewProps) {
  const [title, setTitle] = useState(script.title);
  const [content, setContent] = useState(script.content);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(script.tags);
  const [activeFolderId, setActiveFolderId] = useState(script.folderId);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isLocalSettingsOpen, setIsLocalSettingsOpen] = useState(false);
  
  // Local Settings configuration inside the Settings Modal
  const [speed, setSpeed] = useState(script.wpm);
  const [fontSize, setFontSize] = useState(script.fontSize);
  const [voiceTracking, setVoiceTracking] = useState(true);

  // Folder & Script Tree Local UI States
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1024 : true);

  // Script Import States & Functions
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importContent, setImportContent] = useState("");
  const [importError, setImportError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // States for Editing script inline in list
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingScriptTitle, setEditingScriptTitle] = useState("");

  // States for deleting confirmation inline in list
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingScriptId, setDeletingScriptId] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImportFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
  };

  const processImportFile = (file: File) => {
    setImportError("");
    const reader = new FileReader();

    if (file.name.endsWith(".json")) {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.title || json.content) {
            setImportTitle(json.title || file.name.replace(/\.[^/.]+$/, ""));
            setImportContent(json.content || "");
          } else {
            setImportError("File JSON cần chứa trường 'title' hoặc 'content'.");
          }
        } catch (err) {
          setImportError("Không thể đọc file JSON. Vui lòng kiểm tra định dạng.");
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".txt")) {
      reader.onload = (event) => {
        setImportTitle(file.name.replace(/\.[^/.]+$/, ""));
        setImportContent(event.target?.result as string || "");
      };
      reader.readAsText(file);
    } else {
      setImportError("Hệ thống chỉ hỗ trợ nhập file .txt hoặc .json");
    }
  };

  const handleExecuteImport = () => {
    if (!importContent.trim()) {
      setImportError("Nội dung kịch bản không được để trống.");
      return;
    }
    const finalTitle = importTitle.trim() || "Kịch bản nhập khẩu";
    onAddScript(activeFolderId, { title: finalTitle, content: importContent });
    // Reset and close
    setImportTitle("");
    setImportContent("");
    setImportError("");
    setIsImportOpen(false);
  };

  // Synchronize internal states if activeScript gets changed externally
  useEffect(() => {
    setTitle(script.title);
    setContent(script.content);
    setTags(script.tags);
    setSpeed(script.wpm);
    setFontSize(script.fontSize);
    setActiveFolderId(script.folderId);
  }, [script.id, script.title, script.content, script.tags, script.wpm, script.fontSize, script.folderId]);

  // Auto-save changes locally with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSave({
        title,
        content,
        tags,
        wpm: speed,
        fontSize,
        folderId: activeFolderId,
        duration: calculateDuration(content, speed)
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, tags, speed, fontSize, activeFolderId]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toUpperCase())) {
      const updatedTags = [...tags, newTag.trim().toUpperCase()];
      setTags(updatedTags);
      setNewTag("");
      setIsTagsOpen(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const applyTextMarker = (symbol: string) => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let markedText = "";

    if (symbol === "bold") {
      markedText = `**${selectedText || "văn bản đậm"}**`;
    } else if (symbol === "italic") {
      markedText = `*${selectedText || "văn bản nghiêng"}*`;
    } else if (symbol === "list") {
      markedText = `\n• ${selectedText || "mục danh sách"}`;
    } else if (symbol === "pause") {
      markedText = `${selectedText} [Pause] `;
    }

    const newContent = text.substring(0, start) + markedText + text.substring(end);
    setContent(newContent);
    textarea.focus();
  };

  return (
    <div className="space-y-6 pb-36 font-sans">
      {/* HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md flex justify-between items-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-bright/40 rounded-full">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-lg text-primary neon-glow-pink">PromptFlow</h1>
            <p className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest text-[#00ffcc]">Scriptwriter Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* FOLDER & SCRIPT TREE TOGGLE BUTTON */}
          <button 
            type="button"
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
            className={`p-2 transition-colors rounded-full flex items-center gap-1.5 ${isSidebarExpanded ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-bright/30'}`}
            title="Quản lý thư mục & kịch bản"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline">Thư mục & File</span>
          </button>

          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-bright/30 rounded-full hidden sm:block">
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsLocalSettingsOpen(true)} 
            className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-bright/30 rounded-full"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs ring-1 ring-primary/40 shadow-md">
            JD
          </div>
        </div>
      </header>

      {/* spacer to offset fixed header */}
      <div className="h-10"></div>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pt-4">

        {/* FOLDER & SCRIPT MANAGEMENT SIDEBAR */}
        {isSidebarExpanded && (
          <div className="col-span-1 lg:col-span-1 glass-card rounded-2xl p-5 border border-white/5 space-y-5 bg-surface-container-low/60 backdrop-blur-md animate-in slide-in-from-left duration-200">
            
            {/* 1. THƯ MỤC (FOLDERS / WORKSPACES) MANAGEMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-secondary text-sm">📁</span>
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#e8e0f0] font-bold">Thư mục kịch bản</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddingFolder(!isAddingFolder)} 
                  className="text-[9px] font-mono text-primary hover:text-[#00ffcc] border border-primary/20 hover:border-primary px-2 py-0.5 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Plus className="w-2.5 h-2.5" /> +THƯ MỤC
                </button>
              </div>

              {/* Add folder text-input state */}
              {isAddingFolder && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newFolderName.trim()) {
                      const newId = onAddWorkspace(newFolderName.trim());
                      setActiveFolderId(newId);
                      setIsAddingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  className="flex items-center gap-2 p-2 bg-background/50 border border-primary/20 rounded-xl"
                >
                  <input 
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Tên thư mục mới..."
                    className="bg-transparent flex-1 text-xs text-on-surface outline-none border-none p-0 focus:ring-0 placeholder:text-on-surface-variant/30"
                    autoFocus
                  />
                  <button type="submit" className="px-2 py-1 bg-primary text-on-primary text-[10px] rounded-lg font-bold hover:opacity-90 transition-opacity">
                    Ok
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingFolder(false);
                      setNewFolderName("");
                    }}
                    className="px-2 py-1 bg-surface-container text-on-surface-variant text-[10px] rounded-lg font-bold"
                  >
                    Hủy
                  </button>
                </form>
              )}

              {/* Play list of folders */}
              <div className="space-y-1 max-h-[180px] overflow-y-auto no-scrollbar pr-0.5">
                {workspaces.map((ws) => {
                  const isSelected = activeFolderId === ws.id;
                  const isEditing = editingFolderId === ws.id;
                  const count = scripts.filter(s => s.folderId === ws.id).length;

                  return (
                    <div 
                      key={ws.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-[0_0_10px_rgba(255,45,120,0.05)]" 
                          : "bg-background/20 border-white/5 text-on-surface-variant hover:border-white/10"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input 
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="bg-surface-container border border-primary/20 rounded-md px-1.5 py-0.5 text-xs text-on-surface outline-none w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingFolderName.trim()) {
                                  onUpdateWorkspace(ws.id, editingFolderName.trim());
                                  setEditingFolderId(null);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingFolderId(null);
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (editingFolderName.trim()) {
                                onUpdateWorkspace(ws.id, editingFolderName.trim());
                                setEditingFolderId(null);
                              }
                            }}
                            className="text-[#00ffcc] font-bold text-xs px-1"
                          >
                            ✓
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEditingFolderId(null)}
                            className="text-recording-red font-bold text-xs px-1"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveFolderId(ws.id);
                              // Auto load first script of this workspace if it has any
                              const wsScripts = scripts.filter(s => s.folderId === ws.id);
                              if (wsScripts.length > 0) {
                                onSelectScript(wsScripts[0].id);
                              }
                            }}
                            className="flex-1 flex items-center gap-2 text-left font-medium overflow-hidden outline-none"
                          >
                            <span className="shrink-0">📁</span>
                            <span className="truncate">{ws.name}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-white/5 border border-white/5 text-on-surface-variant rounded font-mono font-bold shrink-0">{count}</span>
                          </button>
                          
                          {deletingFolderId === ws.id ? (
                            <div className="flex items-center gap-1 shrink-0 ml-1 bg-[#ff4a4a]/10 px-1.5 py-0.5 rounded-lg border border-[#ff4a4a]/20 text-[10px]">
                              <span className="text-[9px] text-[#ff4a4a] font-mono mr-1">Xóa?</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  onDeleteWorkspace(ws.id);
                                  const remainder = workspaces.filter(w => w.id !== ws.id);
                                  if (remainder.length > 0) {
                                    setActiveFolderId(remainder[0].id);
                                  }
                                  setDeletingFolderId(null);
                                }}
                                className="font-bold text-emerald-400 hover:text-emerald-300 px-1 font-mono uppercase cursor-pointer"
                              >
                                Có
                              </button>
                              <span className="text-white/20">|</span>
                              <button 
                                type="button"
                                onClick={() => setDeletingFolderId(null)}
                                className="font-bold text-slate-400 hover:text-slate-300 px-1 font-mono uppercase cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <button 
                                type="button"
                                title="Sửa tên thư mục"
                                onClick={() => {
                                  setEditingFolderId(ws.id);
                                  setEditingFolderName(ws.name);
                                }}
                                className="p-1 hover:text-primary transition-colors text-xs cursor-pointer"
                              >
                                ✏️
                              </button>
                              <button 
                                type="button"
                                title="Xóa thư mục"
                                onClick={() => {
                                  setDeletingFolderId(ws.id);
                                }}
                                className="p-1 hover:text-recording-red transition-colors text-xs cursor-pointer"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-white/5"></div>

            {/* 2. SCRIPT (KỊCH BẢN) MANAGEMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-primary text-sm">⚡</span>
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#e8e0f0] font-[#00ffcc]">Kịch bản trong mục</h3>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      onAddScript(activeFolderId);
                    }} 
                    className="text-[9px] font-mono text-secondary hover:text-[#00ffcc] border border-secondary/20 hover:border-secondary px-1.5 py-0.5 rounded-lg hover:bg-secondary/5 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    title="Tạo mới kịch bản trắng"
                  >
                    <Plus className="w-2.5 h-2.5" /> +THÊM
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsImportOpen(true);
                    }} 
                    className="text-[9px] font-mono text-[#00ffcc] hover:text-[#00ffcc]/80 border border-[#00ffcc]/20 hover:border-[#00ffcc]/60 px-1.5 py-0.5 rounded-lg hover:bg-[#00ffcc]/5 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    title="Nhập kịch bản từ file .txt, .json hoặc dán trực tiếp"
                  >
                    <Upload className="w-2.5 h-2.5" /> IMPORT
                  </button>
                </div>
              </div>

              {/* Vertical scrollable script listing */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
                {scripts.filter(s => s.folderId === activeFolderId).length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-white/5 rounded-xl">
                    <p className="text-[10px] text-on-surface-variant/30 font-mono">Chưa có kịch bản</p>
                    <div className="flex gap-2 justify-center mt-2">
                      <button
                        type="button"
                        onClick={() => onAddScript(activeFolderId)}
                        className="text-[10px] font-bold text-primary underline outline-none"
                      >
                        + Tạo mới
                      </button>
                      <span className="text-white/10 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        className="text-[10px] font-bold text-[#00ffcc] underline outline-none"
                      >
                        📥 Nhập file
                      </button>
                    </div>
                  </div>
                ) : (
                  scripts.filter(s => s.folderId === activeFolderId).map((s) => {
                    const isActive = s.id === script.id;
                    const isEditing = editingScriptId === s.id;
                    return (
                      <div 
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                          isActive 
                            ? "border-primary bg-primary/5 text-white" 
                            : "border-white/5 bg-background/10 text-on-surface-variant hover:border-white/10"
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-1.5 pr-2">
                            <input 
                              type="text"
                              value={editingScriptTitle}
                              onChange={(e) => setEditingScriptTitle(e.target.value)}
                              className="flex-1 h-8 px-2 bg-background border border-[#00ffcc]/50 rounded-lg text-xs text-white outline-none focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc]/20 font-bold"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  onSave({ title: editingScriptTitle }, s.id);
                                  if (isActive) {
                                    setTitle(editingScriptTitle);
                                  }
                                  setEditingScriptId(null);
                                } else if (e.key === "Escape") {
                                  setEditingScriptId(null);
                                }
                              }}
                              onBlur={() => {
                                onSave({ title: editingScriptTitle }, s.id);
                                if (isActive) {
                                  setTitle(editingScriptTitle);
                                }
                                setEditingScriptId(null);
                              }}
                            />
                            <button
                              onClick={() => {
                                onSave({ title: editingScriptTitle }, s.id);
                                if (isActive) {
                                  setTitle(editingScriptTitle);
                                }
                                setEditingScriptId(null);
                              }}
                              className="p-1 text-[#00ffcc] hover:text-[#00ffcc]/80"
                              title="Lưu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => onSelectScript(s.id)}
                            className="flex-1 text-left font-display font-medium truncate pr-2 group outline-none"
                          >
                            <div className={`truncate ${isActive ? "text-primary font-bold" : "text-on-surface/80 group-hover:text-white"}`}>
                              {s.title || "Kịch bản chưa đặt tên"}
                            </div>
                            <div className="text-[9px] text-on-surface-variant/50 font-mono mt-0.5 uppercase tracking-wider">
                              ⏱ {calculateDuration(s.content, s.wpm || 130)} • {s.content.split(/\s+/).filter(Boolean).length} từ
                            </div>
                          </button>
                        )}

                        {!isEditing && (
                          deletingScriptId === s.id ? (
                            <div className="flex items-center gap-1 shrink-0 ml-1 bg-[#ff4a4a]/10 px-1.5 py-0.5 rounded-lg border border-[#ff4a4a]/20 text-[10px]">
                              <span className="text-[9px] text-[#ff4a4a] font-mono mr-1">Xóa?</span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteScript(s.id);
                                  // Pick replacement only if we deleted the currently active script
                                  if (isActive) {
                                    const remainder = scripts.filter(sc => sc.folderId === activeFolderId && sc.id !== s.id);
                                    if (remainder.length > 0) {
                                      onSelectScript(remainder[0].id);
                                    } else {
                                      const allRemaining = scripts.filter(sc => sc.id !== s.id);
                                      if (allRemaining.length > 0) {
                                        onSelectScript(allRemaining[0].id);
                                      }
                                    }
                                  }
                                  setDeletingScriptId(null);
                                }}
                                className="font-bold text-emerald-400 hover:text-emerald-300 px-1 font-mono uppercase cursor-pointer"
                              >
                                Có
                              </button>
                              <span className="text-white/20">|</span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingScriptId(null);
                                }}
                                className="font-bold text-slate-400 hover:text-slate-300 px-1 font-mono uppercase cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                type="button"
                                title="Sửa tiêu đề"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingScriptId(s.id);
                                  setEditingScriptTitle(s.title || "");
                                }}
                                className="p-1.5 text-primary hover:text-white hover:bg-primary/20 rounded-lg transition-all cursor-pointer opacity-80 hover:opacity-100 shrink-0"
                              >
                                <Pencil className="w-3.5 h-3.5 text-primary" />
                              </button>

                              <button 
                                type="button"
                                title="Xóa kịch bản"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingScriptId(s.id);
                                }}
                                className="p-1.5 text-[#ff4a4a] hover:text-white hover:bg-[#ff4a4a]/20 rounded-lg transition-all cursor-pointer opacity-80 hover:opacity-100 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-recording-red" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* COMPOSER EDITOR AREA */}
        <div className={`col-span-1 ${isSidebarExpanded ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
          
          {/* SCRIPT TITLE COMPONENT */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 ml-0.5">SCRIPT TITLE / TIÊU ĐỀ KỊCH BẢN</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề kịch bản..."
              className="w-full bg-transparent border-none p-0 font-display font-extrabold text-2xl text-primary placeholder:text-on-surface-variant/20 focus:ring-0 outline-none neon-glow-pink"
            />
          </div>

          {/* WORKSPACE SELECTION PILLS */}
          <div className="space-y-1.5 pb-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 ml-0.5">FOLDER / THƯ MỤC LƯU TRỮ</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {workspaces.map((ws) => {
                const isSelected = activeFolderId === ws.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setActiveFolderId(ws.id);
                      onSave({ folderId: ws.id });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? "bg-[#ff2d78]/15 border-primary text-primary font-bold shadow-[0_0_12px_rgba(255,45,120,0.2)] scale-102"
                        : "bg-surface-container border-white/5 text-on-surface-variant hover:border-white/10"
                    }`}
                  >
                    <span>📂</span>
                    <span>{ws.name}</span>
                    {isSelected && <span className="text-[9px] font-bold text-[#00ffcc] ml-0.5">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORMATTING TOOLBAR & TAGS */}
          <div className="flex flex-wrap items-center gap-3 py-1 border-t border-b border-white/5">
            <div className="flex items-center bg-surface-container rounded-lg p-1 border border-white/5 shrink-0">
              <button 
                type="button"
                onClick={() => applyTextMarker("bold")}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded-md transition-all shrink-0"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => applyTextMarker("italic")}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded-md transition-all shrink-0"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => applyTextMarker("list")}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded-md transition-all shrink-0"
                title="Bulleted List"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
              <button 
                type="button"
                onClick={() => applyTextMarker("pause")}
                className="p-1 px-1.5 text-[9px] font-mono border border-dashed border-primary/40 rounded-md text-primary hover:bg-primary/10 transition-all shrink-0"
                title="Thêm ngắt giọng"
              >
                + ngắt giọng [Pause]
              </button>
            </div>

            {/* Dynamic Tags row */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => handleRemoveTag(tag)}
                  className="px-2.5 py-1 bg-surface-container text-secondary text-[10px] font-mono rounded-full flex items-center gap-1 cursor-pointer hover:bg-recording-red/10 hover:text-recording-red border border-secondary/15 select-none hover:border-recording-red/30 shrink-0 transition-colors"
                  title="Click để xóa tag"
                >
                  # {tag} ×
                </span>
              ))}

              <span className="px-2.5 py-1 bg-surface-container text-primary text-[10px] font-mono rounded-full flex items-center gap-1 border border-primary/15 shrink-0">
                ⏰ {calculateDuration(content, speed)}
              </span>

              <div className="relative shrink-0">
                {isTagsOpen ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="TAG mới"
                      className="bg-surface-container border border-primary/20 text-xs px-2 py-0.5 rounded-lg w-16 text-on-surface placeholder:text-on-surface-variant/30 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag();
                      }}
                      autoFocus
                    />
                    <button onClick={handleAddTag} className="p-1 bg-primary text-on-primary rounded-md">
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setNewTag("");
                        setIsTagsOpen(false);
                      }}
                      className="p-1 bg-surface-container text-on-surface-variant rounded-md text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsTagsOpen(true)}
                    className="px-2.5 py-1 border border-dashed border-outline-variant/50 text-on-surface-variant text-[10px] font-mono rounded-full hover:border-primary hover:text-primary transition-all shrink-0"
                  >
                    + ADD TAG
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED SCRIPT EDITOR TEXTAREA */}
          <div className="relative group">
            <div className="glass-card rounded-xl p-5 min-h-[460px] shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 flex flex-col">
              <textarea
                id="editor-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Kịch bản của bạn chạy ở đây... Sử dụng dấu [Pause] để đánh dấu điểm ngắt nhịp của Teleprompter..."
                className="w-full flex-1 min-h-[400px] bg-transparent border-none p-0 text-sm md:text-base text-on-surface placeholder:text-on-surface-variant/20 focus:ring-0 resize-none leading-relaxed outline-none no-scrollbar"
              />
            </div>
          </div>

        </div>

      </div>

      {/* LOWER CONTEXT ACTIONS PANEL */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pt-1 bg-gradient-to-t from-background via-background/95 to-transparent z-40">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button
            onClick={onStartTeleprompter}
            className="flex-1 h-14 bg-surface-container-high border border-white/5 hover:border-[#00ffcc]/30 text-on-surface flex items-center justify-center gap-3 rounded-xl font-display text-sm font-bold hover:bg-surface-bright active:scale-95 transition-all outline-none"
          >
            <Eye className="w-5 h-5 text-secondary" />
            <span className="uppercase tracking-wide text-xs">Phóng to Chữ (Teleprompter)</span>
          </button>

          <button
            onClick={onStartRecordingMode}
            className="flex-1 h-14 bg-recording-red/10 border-2 border-recording-red text-recording-red flex items-center justify-center gap-3 rounded-xl font-display text-sm font-bold hover:bg-recording-red hover:text-white active:scale-95 transition-all outline-none"
          >
            <Video className="w-5 h-5" />
            <span className="uppercase tracking-wide text-xs">Quay video & Chữ chạy</span>
          </button>
        </div>
      </div>

      {/* LOCAL SCRIPT SETTINGS MODAL */}
      {isLocalSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container rounded-2xl p-6 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-medium text-lg text-primary neon-glow-pink">Script Settings</h3>
              <button 
                onClick={() => setIsLocalSettingsOpen(false)}
                className="p-1 hover:bg-surface-bright rounded-full text-on-surface-variant hover:text-on-surface"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Speed WPM */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant font-label uppercase">Tốc độ cuộn chữ (WPM)</span>
                  <span className="text-secondary font-bold font-mono">{speed} WPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="220"
                  step="10"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-primary bg-surface-variant h-1 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Default Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant font-label uppercase">Kích cỡ chữ Teleprompter</span>
                  <span className="text-primary font-bold font-mono">{fontSize}px</span>
                </div>
                <div className="flex gap-2">
                  {[20, 28, 36, 48].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg transition-colors capitalize ${
                        fontSize === size 
                          ? "bg-primary text-on-primary font-bold" 
                          : "bg-surface-variant hover:bg-surface-bright text-on-surface"
                      }`}
                    >
                      {size === 20 ? "Nhỏ" : size === 28 ? "Vừa" : size === 36 ? "Lớn" : "Rộng"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Tracking Toggle */}
              <div className="flex justify-between items-center p-4 bg-surface-container-high rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-secondary tracking-widest text-[#00ffcc]">🎙</span>
                  <div>
                    <p className="font-bold text-xs text-on-surface">Voice Tracking / Nhận diện giọng để cuộn</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">Tự động cuộn theo tốc độ nói của bạn</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVoiceTracking(!voiceTracking)}
                  className={`w-11 h-6 rounded-full relative flex items-center px-1 transition-colors ${
                    voiceTracking ? "bg-[#00ffcc]/30" : "bg-surface-variant"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-transform ${
                    voiceTracking ? "bg-[#00ffcc] translate-x-5" : "bg-on-surface-variant"
                  }`} />
                </button>
              </div>

              <button
                onClick={() => {
                  onSave({ wpm: speed, fontSize });
                  setIsLocalSettingsOpen(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold font-label text-xs uppercase rounded-xl tracking-wider shadow-lg hover:opacity-95 transition-all active:scale-95 outline-none"
              >
                LƯU THIẾT LẬP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCRIPT IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-surface-container rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setImportTitle("");
                setImportContent("");
                setImportError("");
                setIsImportOpen(false);
              }}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-on-surface-variant hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="font-display font-extrabold text-lg text-primary flex items-center gap-2 uppercase tracking-wide">
                <Upload className="w-5 h-5 text-[#00ffcc] animate-pulse" />
                <span>Nhập Kịch Bản</span>
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5 uppercase tracking-wider text-[#00ffcc]/80">
                Hỗ trợ tải lên file (.txt, .json) hoặc dán trực tiếp
              </p>
            </div>

            {/* ERROR BANNER */}
            {importError && (
              <div className="mb-4 p-3 rounded-xl bg-recording-red/10 border border-recording-red/30 text-recording-red text-xs font-mono animate-bounce">
                ⚠️ {importError}
              </div>
            )}

            <div className="space-y-4 flex-1">
              {/* DRAG AND DROP ZONE */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                  isDragging 
                    ? "border-[#00ffcc] bg-[#00ffcc]/5 scale-98" 
                    : "border-white/10 hover:border-primary/40 bg-background/30"
                }`}
              >
                <Upload className={`w-8 h-8 mb-2 transition-transform ${isDragging ? "text-[#00ffcc] scale-110" : "text-on-surface-variant/40"}`} />
                <p className="text-xs text-on-surface font-semibold">Kéo & thả file kịch bản tại đây</p>
                <p className="text-[10px] text-on-surface-variant mt-1 col-span-2">Đình dạng hỗ trợ: .txt hoặc .json</p>
                
                <div className="relative mt-3">
                  <button className="px-3 py-1.5 bg-primary/20 hover:bg-primary/35 border border-primary/30 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all">
                    Chọn tệp từ máy
                  </button>
                  <input
                    type="file"
                    accept=".txt,.json"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* MANUAL PASTE AREA */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-on-surface-variant/80 uppercase font-bold">Tiêu đề kịch bản:</label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    placeholder="Nhập tiêu đề (hoặc tự động lấy từ tên file)..."
                    className="w-full h-10 px-3 bg-background/50 border border-white/15 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-on-surface-variant/80 uppercase font-bold">Nội dung kịch bản:</label>
                  <textarea
                    value={importContent}
                    onChange={(e) => setImportContent(e.target.value)}
                    placeholder="Nhập nội dung kịch bản hoặc dán trực tiếp văn bản của bạn tại đây... Sử dụng dấu [Pause] để đánh dấu điểm ngắt nhịp của Teleprompter..."
                    rows={6}
                    className="w-full p-3 bg-background/50 border border-white/15 rounded-xl text-xs text-on-surface outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setImportTitle("");
                  setImportContent("");
                  setImportError("");
                  setIsImportOpen(false);
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-xs text-on-surface font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteImport}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl shadow-lg hover:opacity-95 text-xs font-bold uppercase transition-all"
              >
                Nhập kịch bản
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect } from "react";
import { Home, FileText, Video, Sliders, Sparkles, FolderPlus, Compass, Settings as SettingsIcon, User, ShieldCheck } from "lucide-react";

import { Script, Workspace } from "./types";
import { DEFAULT_SCRIPTS, DEFAULT_WORKSPACES, calculateDuration } from "./data";

// Extracted Modular Component Views
import DashboardView from "./components/DashboardView";
import EditorView from "./components/EditorView";
import RecordingStudioView from "./components/RecordingStudioView";
import TeleprompterView from "./components/TeleprompterView";
import SettingsView from "./components/SettingsView";
import RecordCatalogView from "./components/RecordCatalogView";
import AccountView from "./components/AccountView";

const STORAGE_KEY = "promptflow_scripts_v1";

export default function App() {
  // Navigation tabs current position
  const [activeTab, setActiveTab] = useState<string>("home");

  // Multi-view context toggles: "dashboard" | "editor" | "studio" | "teleprompter" | "settings"
  const [currentView, setCurrentView] = useState<string>("dashboard");

  // Loaded scripts state initialized from cache or defaults
  const [scripts, setScripts] = useState<Script[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error("Cache parser failed", e); }
    }
    return DEFAULT_SCRIPTS;
  });

  // Loaded folder (workspaces) state initialized from cache or defaults
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const cached = localStorage.getItem("promptflow_workspaces_v1");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error("Workspaces cache parser failed", e); }
    }
    return DEFAULT_WORKSPACES;
  });

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // Settings defaults
  const [defaultWpm, setDefaultWpm] = useState<number>(() => {
    const cached = localStorage.getItem("promptflow_default_wpm");
    return cached ? Number(cached) : 130;
  });
  const [defaultFontSize, setDefaultFontSize] = useState<number>(() => {
    const cached = localStorage.getItem("promptflow_default_font_size");
    return cached ? Number(cached) : 28;
  });
  const [defaultFontFamily, setDefaultFontFamily] = useState<string>(() => {
    return localStorage.getItem("promptflow_default_font_family") || "Sora";
  });

  // Load Pro Status
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem("promptflow_user_is_pro") === "true";
  });

  // Sync Pro Status
  useEffect(() => {
    localStorage.setItem("promptflow_user_is_pro", isPro ? "true" : "false");
  }, [isPro]);

  // Save scripts to cache when changes are saved
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }, [scripts]);

  // Save workspaces to cache when changes are made
  useEffect(() => {
    localStorage.setItem("promptflow_workspaces_v1", JSON.stringify(workspaces));
  }, [workspaces]);

  // Folder (Workspace) Management CRUD Actions
  const handleAddWorkspace = (name: string) => {
    const newId = `folder-${Date.now()}`;
    const newWs: Workspace = {
      id: newId,
      name,
      icon: "folder",
      color: "text-primary bg-primary/20 border border-primary/20"
    };
    setWorkspaces(prev => [...prev, newWs]);
    return newId;
  };

  const handleUpdateWorkspace = (id: string, name: string) => {
    setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name } : ws));
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) {
      alert("Không thể xóa thư mục duy nhất còn lại!");
      return;
    }
    const remainingWs = workspaces.filter(ws => ws.id !== id);
    const backupId = remainingWs[0].id;
    setWorkspaces(remainingWs);
    // Shift auto transition script folders
    setScripts(prev => prev.map(s => s.folderId === id ? { ...s, folderId: backupId } : s));
  };

  // Handle saving default settings preferences
  const handleSaveDefaults = (wpm: number, fontSize: number, fontFamily: string) => {
    setDefaultWpm(wpm);
    setDefaultFontSize(fontSize);
    setDefaultFontFamily(fontFamily);
    localStorage.setItem("promptflow_default_wpm", wpm.toString());
    localStorage.setItem("promptflow_default_font_size", fontSize.toString());
    localStorage.setItem("promptflow_default_font_family", fontFamily);
  };

  // Find the current selected script object
  const activeScript = scripts.find(s => s.id === selectedScriptId);

  // 1. Script Management triggers
  const handleSelectScript = (id: string) => {
    setSelectedScriptId(id);
    setCurrentView("editor");
  };

  const handleAddScript = (folderId: string, importData?: { title: string; content: string }) => {
    const newId = `script-${Date.now()}`;
    const newScript: Script = {
      id: newId,
      title: importData?.title || "New Custom Video Script",
      content: importData?.content || "Bắt đầu gõ kịch bản chạy chữ ở đây... Nhấn nhẹ nút AI Assistant phía dưới góc phải màn hình để được trợ giúp soạn thảo cực kỳ nhanh bằng Gemini nhé. [Pause]",
      folderId: folderId || "tiktok",
      tags: ["CREATOR"],
      wpm: defaultWpm,
      fontSize: defaultFontSize,
      duration: importData ? calculateDuration(importData.content, defaultWpm) : "0:30 min",
      isPro: false,
      lastUpdated: new Date().toISOString()
    };

    setScripts(prev => [newScript, ...prev]);
    setSelectedScriptId(newId);
    setCurrentView("editor");
  };

  const handleDuplicateScript = (script: Script) => {
    const duplicated: Script = {
      ...script,
      id: `script-${Date.now()}`,
      title: `${script.title} (Nhân bản)`,
      lastUpdated: new Date().toISOString()
    };
    setScripts(prev => [duplicated, ...prev]);
  };

  const handleDeleteScript = (scriptId: string) => {
    setScripts(prev => prev.filter(s => s.id !== scriptId));
    if (selectedScriptId === scriptId) {
      setSelectedScriptId(null);
      setCurrentView("dashboard");
    }
  };

  const handleUpdateScript = (fields: Partial<Script>, scriptId?: string) => {
    const targetId = scriptId || selectedScriptId;
    if (!targetId) return;
    setScripts(prev => prev.map(s => {
      if (s.id === targetId) {
        return {
          ...s,
          ...fields,
          lastUpdated: new Date().toISOString()
        };
      }
      return s;
    }));
  };

  // Quick launch default or first script helper for "Scripts" and "Record" tabs shortcut
  const handleTabTransition = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      setCurrentView("dashboard");
    } else if (tab === "scripts") {
      // Open the first script or open editor
      if (scripts.length > 0) {
        setSelectedScriptId(scripts[0].id);
        setCurrentView("editor");
      } else {
        handleAddScript("tiktok");
      }
    } else if (tab === "record") {
      // Transition to Record Catalog select state instead of blindly launching
      setCurrentView("record-catalog");
    } else if (tab === "settings") {
      setCurrentView("settings");
    } else if (tab === "account") {
      setCurrentView("account");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-on-surface select-none font-sans antialiased grid-bg px-4 sm:px-6">
      
      {/* Background radial atmosphere glow filters */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[40%] bg-primary/5 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[35%] bg-secondary/3 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        
        {/* VIEW ROUTER BODY */}
        {currentView === "dashboard" && (
          <DashboardView
            scripts={scripts}
            workspaces={workspaces}
            onSelectScript={handleSelectScript}
            onAddScript={handleAddScript}
            onDuplicateScript={handleDuplicateScript}
            onDeleteScript={handleDeleteScript}
            setActiveTab={handleTabTransition}
          />
        )}

        {currentView === "editor" && activeScript && (
          <EditorView
            script={activeScript}
            scripts={scripts}
            workspaces={workspaces}
            onSave={handleUpdateScript}
            onBack={() => {
              setCurrentView("dashboard");
              setActiveTab("home");
            }}
            onStartTeleprompter={() => setCurrentView("teleprompter")}
            onStartRecordingMode={() => setCurrentView("studio")}
            onAddScript={handleAddScript}
            onDeleteScript={handleDeleteScript}
            onSelectScript={handleSelectScript}
            onAddWorkspace={handleAddWorkspace}
            onUpdateWorkspace={handleUpdateWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
          />
        )}

        {currentView === "record-catalog" && (
          <RecordCatalogView
            scripts={scripts}
            workspaces={workspaces}
            onSelectScriptToRecord={(scriptId) => {
              setSelectedScriptId(scriptId);
              setCurrentView("studio");
            }}
            onAddScript={(folderId) => {
              handleAddScript(folderId);
            }}
          />
        )}

        {currentView === "studio" && activeScript && (
          <RecordingStudioView
            script={activeScript}
            onExit={() => setCurrentView("editor")}
            defaultWpm={defaultWpm}
            defaultFontSize={defaultFontSize}
            defaultFontFamily={defaultFontFamily}
          />
        )}

        {currentView === "teleprompter" && activeScript && (
          <TeleprompterView
            script={activeScript}
            onExit={() => setCurrentView("editor")}
            defaultWpm={defaultWpm}
            defaultFontSize={defaultFontSize}
            defaultFontFamily={defaultFontFamily}
          />
        )}

        {currentView === "settings" && (
          <SettingsView
            defaultWpm={defaultWpm}
            defaultFontSize={defaultFontSize}
            defaultFontFamily={defaultFontFamily}
            onSaveDefaults={handleSaveDefaults}
          />
        )}

        {currentView === "account" && (
          <AccountView
            isPro={isPro}
            onTogglePro={setIsPro}
            userEmail="tranchanhtrung@gmail.com"
          />
        )}

      </div>

      {/* FIXED FOOTER NAVIGATION MENU TAB BAR */}
      {currentView !== "studio" && currentView !== "teleprompter" && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface-container border-t border-white/5 shadow-2xl flex justify-around items-center h-20 px-2 xs:px-4 sm:px-6 backdrop-blur-md">
          {/* Home Tab */}
          <button
            onClick={() => handleTabTransition("home")}
            className={`flex flex-col items-center justify-center transition-all px-2 xs:px-3 sm:px-4 py-1.5 rounded-xl outline-none ${
              activeTab === "home" && currentView === "dashboard"
                ? "bg-primary-container/20 text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,45,120,0.1)] scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Home className="w-5 h-5 animate-in fade-in" />
            <span className="font-label text-[9px] xs:text-[10px] uppercase font-bold tracking-wider mt-1">Home</span>
          </button>

          {/* Scripts Tab */}
          <button
            onClick={() => handleTabTransition("scripts")}
            className={`flex flex-col items-center justify-center transition-all px-2 xs:px-3 sm:px-4 py-1.5 rounded-xl outline-none ${
              activeTab === "scripts" || currentView === "editor"
                ? "bg-primary-container/20 text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,45,120,0.1)] scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-label text-[9px] xs:text-[10px] uppercase font-bold tracking-wider mt-1">Scripts</span>
          </button>

          {/* Record Tab */}
          <button
            onClick={() => handleTabTransition("record")}
            className={`flex flex-col items-center justify-center transition-all px-2 xs:px-3 sm:px-4 py-1.5 rounded-xl outline-none ${
              activeTab === "record"
                ? "bg-primary-container/20 text-primary border border-primary/25 shadow-[0_0_12px_rgba(255,45,120,0.1)] scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Video className="w-5 h-5 text-secondary animate-pulse" />
            <span className="font-label text-[9px] xs:text-[10px] uppercase font-bold tracking-wider mt-1 text-secondary">Record</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => handleTabTransition("settings")}
            className={`flex flex-col items-center justify-center transition-all px-2 xs:px-3 sm:px-4 py-1.5 rounded-xl outline-none ${
              activeTab === "settings" && currentView === "settings"
                ? "bg-primary-container/20 text-[#ff2d78] border border-primary/25 shadow-[0_0_12px_rgba(255,45,120,0.1)] scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="font-label text-[9px] xs:text-[10px] uppercase font-bold tracking-wider mt-1">Settings</span>
          </button>

          {/* Account Tab */}
          <button
            onClick={() => handleTabTransition("account")}
            className={`flex flex-col items-center justify-center transition-all px-2 xs:px-3 sm:px-4 py-1.5 rounded-xl outline-none relative ${
              activeTab === "account" && currentView === "account"
                ? "bg-primary-container/20 text-[#00ffcc] border border-primary/25 shadow-[0_0_12px_rgba(0,255,204,0.15)] scale-102"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {isPro ? (
              <ShieldCheck className="w-5 h-5 text-amber-400 stroke-[2.25] animate-pulse" />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className={`font-label text-[9px] xs:text-[10px] uppercase font-bold tracking-wider mt-1 ${isPro ? "text-amber-400" : ""}`}>
              {isPro ? "PRO Acc" : "Account"}
            </span>
            {!isPro && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            )}
          </button>
        </nav>
      )}



    </div>
  );
}

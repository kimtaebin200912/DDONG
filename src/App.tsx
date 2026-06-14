import React, { useState, useEffect } from "react";
import { Plus, Trash2, Menu } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load notes list on mount
  useEffect(() => {
    const saved = localStorage.getItem("minimal_notebook_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    } else {
      // Create a clean initial note
      const initial: Note = {
        id: "note_initial",
        title: "",
        content: ""
      };
      setNotes([initial]);
      setActiveId(initial.id);
      localStorage.setItem("minimal_notebook_list", JSON.stringify([initial]));
    }
  }, []);

  // Sync to localStorage
  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem("minimal_notebook_list", JSON.stringify(updated));
  };

  // Add a new blank note
  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: "",
      content: ""
    };
    const updated = [newNote, ...notes];
    saveNotes(updated);
    setActiveId(newNote.id);
  };

  // Delete note
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = notes.filter(n => n.id !== id);
    saveNotes(remaining);
    
    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        setActiveId(null);
      }
    }
  };

  // Edit current active note fields
  const handleEditActiveNote = (field: "title" | "content", value: string) => {
    if (!activeId) return;
    const updated = notes.map(note => {
      if (note.id === activeId) {
        return { ...note, [field]: value };
      }
      return note;
    });
    saveNotes(updated);
  };

  const activeNote = notes.find(n => n.id === activeId);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex h-screen overflow-hidden font-sans select-none">
      
      {/* SIDEBAR: NOTES LIST */}
      <aside 
        className={`bg-stone-100 border-r border-stone-200 flex flex-col h-full shrink-0 select-none transition-all duration-200 ${
          isSidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden border-r-0"
        }`}
      >
        
        {/* Sidebar Header & Create Action */}
        <div className="p-4 border-b border-stone-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-stone-200 text-stone-500 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              title="사이드바 닫기"
              id="sidebar-toggle-close"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-stone-800 tracking-tight">모든 노트</h2>
          </div>
          <button
            onClick={handleCreateNote}
            className="p-1.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center"
            title="새 메모 만들기"
            id="btn-create-note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Notes Items Feed */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center text-xs text-stone-400 py-10">
              메모가 없습니다.
            </div>
          ) : (
            notes.map((note) => {
              const isActive = activeId === note.id;
              const titleToShow = note.title.trim() ? note.title : "제목 없음";
              const summaryToShow = note.content.trim() ? note.content : "텍스트 내용이 없습니다.";

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveId(note.id)}
                  className={`group p-3 rounded-xl transition-all cursor-pointer flex flex-col relative text-left ${
                    isActive
                      ? "bg-white border border-stone-200/80 shadow-xs font-semibold text-stone-950"
                      : "hover:bg-stone-200/40 text-stone-600"
                  }`}
                  id={`sidebar-item-${note.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm truncate flex-1 block leading-normal">
                      {titleToShow}
                    </span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded-md transition-all self-center shrink-0"
                      title="메모 삭제"
                      id={`btn-delete-${note.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-400 truncate mt-0.5 font-normal block">
                    {summaryToShow}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN VIEW: WRITING CANVAS */}
      <main className="flex-1 bg-white overflow-hidden flex flex-col h-full min-w-0">
        {activeNote ? (
          <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-6 sm:px-12 py-10 overflow-hidden">
            
            {/* Minimal Title Block with Optionally Show Sidebar toggle */}
            <div className="flex items-center gap-3 shrink-0">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 hover:bg-stone-100 text-stone-600 hover:text-stone-800 rounded-lg transition-colors shrink-0 flex items-center cursor-pointer"
                  title="모든 노트 열기"
                  id="btn-open-sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleEditActiveNote("title", e.target.value)}
                placeholder="제목"
                className="w-full text-2xl md:text-3xl font-sans font-bold text-stone-950 border-none outline-none placeholder-stone-200 py-1.5 focus:ring-0 shrink-0 select-text"
                id="editor-note-title"
              />
            </div>

            {/* Aesthetic Single Hairline Separator */}
            <div className="h-px bg-stone-100 my-4 shrink-0" />

            {/* Minimal Body Pad */}
            <div className="flex-1 overflow-hidden relative">
              <textarea
                value={activeNote.content}
                onChange={(e) => handleEditActiveNote("content", e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full h-full text-stone-700 border-none outline-none focus:ring-0 py-1 text-base leading-relaxed resize-none bg-transparent font-sans overflow-y-auto select-text"
                id="editor-note-content"
              />
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-2 select-none relative">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 p-2 hover:bg-stone-100 text-stone-600 rounded-lg transition-all flex items-center cursor-pointer"
                title="모든 노트 열기"
                id="btn-open-sidebar-fallback"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <p className="text-sm font-semibold">선택된 메모가 없습니다.</p>
            <button
              onClick={handleCreateNote}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-lg text-xs font-medium cursor-pointer transition-all active:scale-[0.98]"
              id="editor-creation-fallback"
            >
              새 메모 만들기
            </button>
          </div>
        )}
      </main>

    </div>
  );
}

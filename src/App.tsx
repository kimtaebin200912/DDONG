import React, { useState, useEffect } from "react";
import { Plus, Trash2, Menu, CloudLightning } from "lucide-react";

// ⚠️ [필수 고치기] 내 진짜 수파베이스 정보를 여기에 정확히 복사해 넣으세요!
const SUPABASE_URL = "내_수파베이스_주소";
const SUPABASE_KEY = "내_수파베이스_ANON_KEY";

// @ts-ignore
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // 수파베이스 저장 상태 표시용

  // 1. 앱이 켜질 때 수파베이스 DB에서 최신 데이터 목록을 실시간으로 긁어옴
  useEffect(() => {
    if (!supabaseClient) return;
    
    async function fetchFromSupabase() {
      const { data, error } = await supabaseClient
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // 수파베이스의 id, title, content 구조를 내 리액트 형식에 맞춤
        const loadedNotes: Note[] = data.map((d: any) => ({
          id: d.id,
          title: d.title || "",
          content: d.content || ""
        }));
        
        setNotes(loadedNotes);
        if (loadedNotes.length > 0) {
          setActiveId(loadedNotes[0].id);
        }
      } else {
        // 수파베이스에 아무것도 없거나 에러나면 기본 뼈대 하나 생성
        const initial: Note = { id: `note_initial`, title: "", content: "" };
        setNotes([initial]);
        setActiveId(initial.id);
      }
    }

    fetchFromSupabase();
  }, []);

  // 2. 새 메모 버튼 클릭 시 -> 수파베이스 DB에 즉시 빈 행 하나 생성
  const handleCreateNote = async () => {
    if (!supabaseClient) return;

    const newId = `note_${Date.now()}`;
    const newNote: Note = { id: newId, title: "", content: "" };

    // 화면에 먼저 반영
    setNotes([newNote, ...notes]);
    setActiveId(newId);

    // 수파베이스 DB에 즉시 전송
    await supabaseClient
      .from("notes")
      .insert([{ id: newId, title: "", content: "" }]);
  };

  // 3. 메모 삭제 버튼 클릭 시 -> 수파베이스 DB에서 즉시 제거
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supabaseClient) return;

    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    
    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        setActiveId(null);
      }
    }

    // 수파베이스 DB에서 해당 ID 데이터 삭제
    await supabaseClient.from("notes").delete().eq("id", id);
  };

  // 4. 제목이나 본문 내용을 타이핑할 때 -> 디바운스(0.5초 대기) 후 수파베이스 DB에 실시간 업데이트 저장
  useEffect(() => {
    if (!activeId || !supabaseClient) return;
    const activeNote = notes.find(n => n.id === activeId);
    if (!activeNote) return;

    // 사용자가 타자를 멈추고 0.5초 뒤에 자동으로 수파베이스에 자동 저장함
    const timeOutId = setTimeout(async () => {
      setIsSaving(true);
      await supabaseClient
        .from("notes")
        .upsert({
          id: activeNote.id,
          title: activeNote.title,
          content: activeNote.content
        });
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [notes, activeId]);

  // 입력창 핸들러
  const handleEditActiveNote = (field: "title" | "content", value: string) => {
    if (!activeId) return;
    setNotes(prev => prev.map(note => note.id === activeId ? { ...note, [field]: value } : note));
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
            {isSaving && <CloudLightning className="w-3.5 h-3.5 text-emerald-500 animate-pulse" title="DB 동기화 중" />}
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

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center text-xs text-stone-400 py-10">메모가 없습니다.</div>
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
                    <span className="text-xs sm:text-sm truncate flex-1 block leading-normal">{titleToShow}</span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded-md transition-all self-center shrink-0"
                      title="메모 삭제"
                      id={`btn-delete-${note.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-400 truncate mt-0.5 font-normal block">{summaryToShow}</span>
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

            <div className="h-px bg-stone-100 my-4 shrink-0" />

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

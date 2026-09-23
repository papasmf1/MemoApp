'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Note,
  Tag,
  ViewFilter,
  SortOption,
  SaveStatus,
  UserProfile,
} from '@/lib/types';
import { getStorage } from '@/lib/storage';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { NoteList } from '@/components/notes/note-list';
import { NoteEditor } from '@/components/notes/note-editor';
import { TrashView } from '@/components/notes/trash-view';
import { AuthModal } from '@/components/modals/auth-modal';
import { ShareModal } from '@/components/modals/share-modal';
import { ShortcutsModal } from '@/components/modals/shortcuts-modal';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { FileText, Plus } from 'lucide-react';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>({ type: 'all' });
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [tags, setTags] = useState<Tag[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Modals & Mobile Drawer
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize user & auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser({ id: 'guest', email: 'guest@webnotepad.local', isGuest: true });
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id, email: user.email || '', isGuest: false });
      } else {
        setUser({ id: 'guest', email: 'guest@webnotepad.local', isGuest: true });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', isGuest: false });
      } else {
        setUser({ id: 'guest', email: 'guest@webnotepad.local', isGuest: true });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const storage = getStorage(!user?.isGuest);

  // 2. Load data
  const loadData = useCallback(async () => {
    try {
      // Active notes
      const activeNotes = await storage.getNotes(currentFilter, sortOption, searchQuery);
      setNotes(activeNotes);

      // Trash notes
      const trash = await storage.getNotes({ type: 'trash' });
      setTrashNotes(trash);

      // Tags
      const loadedTags = await storage.getTags();
      setTags(loadedTags);

      // If active notes exist and no note is selected, select the first one
      if (currentFilter.type !== 'trash') {
        setSelectedNoteId((prevId) => {
          if (prevId && activeNotes.some((n) => n.id === prevId)) {
            return prevId;
          }
          return activeNotes.length > 0 ? activeNotes[0].id : null;
        });
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
    }
  }, [storage, currentFilter, sortOption, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected note object
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // 3. New note creation
  const handleNewNote = async () => {
    try {
      const defaultTag = currentFilter.type === 'tag' ? [currentFilter.tagName] : [];
      const created = await storage.createNote({
        title: '',
        content: '',
        tags: defaultTag,
      });

      setNotes((prev) => [created, ...prev]);
      setSelectedNoteId(created.id);
      setIsMobileEditorOpen(true);
      toast.success('새 메모가 생성되었습니다.');
      loadData();
    } catch {
      toast.error('새 메모 생성에 실패했습니다.');
    }
  };

  // 4. Autosave logic with 500ms debounce
  const debouncedSave = (noteId: string, updates: Partial<Note>) => {
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await storage.updateNote(noteId, updates);
        setSaveStatus('saved');
        loadData();
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
        toast.error('메모 자동 저장에 실패했습니다.');
      }
    }, 500);
  };

  const handleUpdateTitle = (title: string) => {
    if (!selectedNoteId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, title } : n))
    );
    debouncedSave(selectedNoteId, { title });
  };

  const handleUpdateContent = (content: string) => {
    if (!selectedNoteId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, content } : n))
    );
    debouncedSave(selectedNoteId, { content });
  };

  const handleUpdateTags = (tags: string[]) => {
    if (!selectedNoteId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, tags } : n))
    );
    debouncedSave(selectedNoteId, { tags });
  };

  // 5. Pin toggle
  const handleTogglePin = async (noteId?: string) => {
    const targetId = noteId || selectedNoteId;
    if (!targetId) return;

    try {
      await storage.togglePin(targetId);
      loadData();
    } catch {
      toast.error('고정 상태 변경 실패');
    }
  };

  // 6. Delete note (move to trash)
  const handleDeleteNote = async (noteId?: string) => {
    const targetId = noteId || selectedNoteId;
    if (!targetId) return;

    try {
      await storage.softDeleteNote(targetId);
      toast.success('메모가 휴지통으로 이동되었습니다.');
      loadData();
      setIsMobileEditorOpen(false);
    } catch {
      toast.error('삭제 처리에 실패했습니다.');
    }
  };

  // 7. Trash actions
  const handleRestore = async (id: string) => {
    try {
      await storage.restoreNote(id);
      toast.success('메모가 복구되었습니다.');
      loadData();
    } catch {
      toast.error('복구 실패');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await storage.permanentDeleteNote(id);
      toast.success('메모가 영구 삭제되었습니다.');
      loadData();
    } catch {
      toast.error('영구 삭제 실패');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await storage.emptyTrash();
      toast.success('휴지통을 모두 비웠습니다.');
      loadData();
    } catch {
      toast.error('휴지통 비우기 실패');
    }
  };

  // 8. Sharing
  const handleGenerateShare = async (noteId: string) => {
    const token = await storage.createShareLink(noteId);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, share_token: token } : n))
    );
    return token;
  };

  const handleRevokeShare = async (noteId: string) => {
    await storage.revokeShareLink(noteId);
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, share_token: null } : n))
    );
  };

  // 9. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside modal or input except Cmd+K
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (selectedNote) {
          storage.updateNote(selectedNote.id, {
            title: selectedNote.title,
            content: selectedNote.content,
            tags: selectedNote.tags,
          }).then(() => {
            setSaveStatus('saved');
            toast.success('메모가 저장되었습니다.');
          });
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleTogglePin();
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDeleteNote();
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsAuthOpen(false);
        setIsShareOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote, storage]);

  // Counts
  const allCount = notes.length;
  const pinnedCount = notes.filter((n) => n.is_pinned).length;
  const trashCount = trashNotes.length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19]">
      {/* Header */}
      <Header
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={async () => {
          if (isSupabaseConfigured()) {
            const supabase = createClient();
            await supabase.auth.signOut();
            toast.success('로그아웃되었습니다.');
          }
          setUser({ id: 'guest', email: 'guest@webnotepad.local', isGuest: true });
        }}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onFocusSearch={() => searchInputRef.current?.focus()}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentFilter={currentFilter}
          onSelectFilter={(f) => {
            setCurrentFilter(f);
            setIsMobileEditorOpen(false);
          }}
          onNewNote={handleNewNote}
          allCount={allCount}
          pinnedCount={pinnedCount}
          trashCount={trashCount}
          tags={tags}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Middle/Center: Note List or Trash */}
        <div
          className={`flex-1 md:flex-initial md:w-80 lg:w-96 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 transition-all ${
            isMobileEditorOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          <NoteList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setIsMobileEditorOpen(true);
            }}
            onTogglePin={handleTogglePin}
            onDeleteNote={handleDeleteNote}
            onNewNote={handleNewNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
            currentFilter={currentFilter}
            searchInputRef={searchInputRef}
          />
        </div>

        {/* Right Detail Panel: Note Editor or Trash View */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden transition-all ${
            isMobileEditorOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {currentFilter.type === 'trash' ? (
            <TrashView
              trashNotes={trashNotes}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onEmptyTrash={handleEmptyTrash}
            />
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              saveStatus={saveStatus}
              onUpdateTitle={handleUpdateTitle}
              onUpdateContent={handleUpdateContent}
              onUpdateTags={handleUpdateTags}
              onTogglePin={() => handleTogglePin(selectedNote.id)}
              onDelete={() => handleDeleteNote(selectedNote.id)}
              onOpenShare={() => setIsShareOpen(true)}
              onBackMobile={() => setIsMobileEditorOpen(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 select-none">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-4 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                선택된 메모가 없습니다
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                좌측 목록에서 메모를 선택하거나, 새로운 메모를 작성해보세요.
              </p>
              <button
                onClick={handleNewNote}
                className="mt-5 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                새 메모 작성하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(email) => {
          setUser({ id: 'auth-user', email, isGuest: false });
          loadData();
        }}
      />

      {selectedNote && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          noteId={selectedNote.id}
          noteTitle={selectedNote.title}
          shareToken={selectedNote.share_token}
          onGenerateShare={handleGenerateShare}
          onRevokeShare={handleRevokeShare}
        />
      )}

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

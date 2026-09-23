'use client';

import React, { useRef } from 'react';
import { Search, X, ArrowUpDown, FileText, Plus } from 'lucide-react';
import { Note, SortOption, ViewFilter } from '@/lib/types';
import { NoteCard } from './note-card';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  currentFilter: ViewFilter;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onTogglePin,
  onDeleteNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  currentFilter,
  searchInputRef,
}: NoteListProps) {
  const isAllView = currentFilter.type === 'all';
  const pinnedNotes = isAllView ? notes.filter((n) => n.is_pinned) : [];
  const otherNotes = isAllView ? notes.filter((n) => !n.is_pinned) : notes;

  const getFilterTitle = () => {
    if (currentFilter.type === 'pinned') return '고정된 메모';
    if (currentFilter.type === 'tag') return `#${currentFilter.tagName} 메모`;
    return '전체 메모';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
      {/* Top Search and Sort Bar */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목, 본문, 태그 검색..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View title & Sort Dropdown */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {getFilterTitle()} ({notes.length})
          </span>

          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="updated_desc">최근 수정순</option>
              <option value="created_desc">생성일순</option>
              <option value="title_asc">제목순 (가나다)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4 select-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {searchQuery ? '검색 결과가 없습니다' : '작성된 메모가 없습니다'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
              {searchQuery
                ? '다른 키워드로 검색해보세요.'
                : '새로운 메모를 작성하여 생각을 기록해보세요.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewNote}
                className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                새 메모 작성
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned section in All View */}
            {isAllView && pinnedNotes.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 px-1">
                  <span>📌 고정된 메모</span>
                  <span className="text-slate-400 text-[10px]">({pinnedNotes.length})</span>
                </div>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onSelect={() => onSelectNote(note.id)}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}

            {/* Other / Regular notes */}
            {isAllView && pinnedNotes.length > 0 && otherNotes.length > 0 && (
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-1 pt-2">
                메모 ({otherNotes.length})
              </div>
            )}

            <div className="space-y-2">
              {otherNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSelected={selectedNoteId === note.id}
                  onSelect={() => onSelectNote(note.id)}
                  onTogglePin={(e) => {
                    e.stopPropagation();
                    onTogglePin(note.id);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

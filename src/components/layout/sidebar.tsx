'use client';

import React from 'react';
import {
  Plus,
  FileText,
  Pin,
  Trash2,
  Tag as TagIcon,
  FolderOpen,
  X,
} from 'lucide-react';
import { ViewFilter, Tag } from '@/lib/types';

interface SidebarProps {
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onNewNote: () => void;
  allCount: number;
  pinnedCount: number;
  trashCount: number;
  tags: Tag[];
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentFilter,
  onSelectFilter,
  onNewNote,
  allCount,
  pinnedCount,
  trashCount,
  tags,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const isAll = currentFilter.type === 'all';
  const isPinned = currentFilter.type === 'pinned';
  const isTrash = currentFilter.type === 'trash';
  const selectedTag = currentFilter.type === 'tag' ? currentFilter.tagName : null;

  const content = (
    <div className="flex flex-col h-full p-3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Mobile close button */}
      {onCloseMobile && (
        <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">메뉴</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* New Note Button */}
      <button
        onClick={() => {
          onNewNote();
          onCloseMobile?.();
        }}
        className="flex items-center justify-between w-full px-4 py-2.5 mb-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/25 active:scale-[0.98] transition-all group cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          새 메모
        </span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-normal rounded-md bg-white/20 text-white">
          ⌘N
        </kbd>
      </button>

      {/* Primary Navigation Views */}
      <div className="space-y-1 mb-6">
        <button
          onClick={() => {
            onSelectFilter({ type: 'all' });
            onCloseMobile?.();
          }}
          className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
            isAll
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <FileText className={`w-4 h-4 ${isAll ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            전체 메모
          </span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {allCount}
          </span>
        </button>

        <button
          onClick={() => {
            onSelectFilter({ type: 'pinned' });
            onCloseMobile?.();
          }}
          className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
            isPinned
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Pin className={`w-4 h-4 ${isPinned ? 'text-amber-500' : 'text-slate-400'}`} />
            고정된 메모
          </span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {pinnedCount}
          </span>
        </button>

        <button
          onClick={() => {
            onSelectFilter({ type: 'trash' });
            onCloseMobile?.();
          }}
          className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
            isTrash
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Trash2 className={`w-4 h-4 ${isTrash ? 'text-red-500' : 'text-slate-400'}`} />
            휴지통
          </span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {trashCount}
          </span>
        </button>
      </div>

      {/* Tags Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            태그 목록
          </span>
          <TagIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {tags.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              등록된 태그가 없습니다.<br />메모에 태그를 추가해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tags.map((tag) => {
              const active = selectedTag === tag.name;
              return (
                <button
                  key={tag.name}
                  onClick={() => {
                    if (active) {
                      onSelectFilter({ type: 'all' });
                    } else {
                      onSelectFilter({ type: 'tag', tagName: tag.name });
                    }
                    onCloseMobile?.();
                  }}
                  className={`flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 text-xs">#</span>
                    <span className="truncate">{tag.name}</span>
                  </span>
                  {tag.count !== undefined && (
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      {tag.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 h-[calc(100vh-3.5rem)]">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 h-full z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

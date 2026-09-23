'use client';

import React from 'react';
import { Pin, Trash2, Tag as TagIcon } from 'lucide-react';
import { Note } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  searchQuery?: string;
}

export function NoteCard({
  note,
  isSelected,
  onSelect,
  onTogglePin,
  onDelete,
  searchQuery,
}: NoteCardProps) {
  // Strip common markdown characters for cleaner snippet preview
  const cleanSnippet = (note.content || '')
    .replace(/[#*`_~>[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 rounded-2xl transition-all cursor-pointer border select-none ${
        isSelected
          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      {/* Title & Pin Indicator */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3
          className={`text-sm font-semibold truncate leading-snug ${
            isSelected
              ? 'text-indigo-950 dark:text-indigo-200'
              : 'text-slate-800 dark:text-slate-200'
          }`}
        >
          {note.title.trim() || '제목 없는 메모'}
        </h3>

        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={`p-1 rounded-md transition-colors ${
                note.is_pinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 opacity-0 group-hover:opacity-100'
              }`}
              title={note.is_pinned ? '고정 해제' : '상단에 고정'}
            >
              <Pin className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              title="삭제 (휴지통으로 이동)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Snippet Preview */}
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {cleanSnippet || '추가된 본문 내용이 없습니다.'}
      </p>

      {/* Footer: Date & Tags */}
      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
        <span title={note.updated_at}>
          {formatRelativeTime(note.updated_at)}
        </span>

        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[80px]"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-[10px] text-slate-400">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

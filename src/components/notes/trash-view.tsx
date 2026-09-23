'use client';

import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import { Note } from '@/lib/types';
import { formatFullDateTime, formatRelativeTime } from '@/lib/utils';
import { ConfirmDialog } from '@/components/modals/confirm-dialog';

interface TrashViewProps {
  trashNotes: Note[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export function TrashView({
  trashNotes,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: TrashViewProps) {
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">휴지통</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              삭제된 메모는 보관되며, 언제든 복구하거나 영구 삭제할 수 있습니다.
            </p>
          </div>
        </div>

        {trashNotes.length > 0 && (
          <button
            onClick={() => setEmptyConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            휴지통 비우기
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {trashNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              휴지통이 비어 있습니다
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              삭제된 메모가 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-4xl">
            {trashNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                    {note.title.trim() || '제목 없는 메모'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {note.content || '본문 내용 없음'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    삭제 일시: {note.deleted_at ? formatFullDateTime(note.deleted_at) : '알 수 없음'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => onRestore(note.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    복구
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(note.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    영구 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty Trash Confirm Dialog */}
      <ConfirmDialog
        isOpen={emptyConfirmOpen}
        title="휴지통을 완전히 비우시겠습니까?"
        description="휴지통의 모든 메모가 영구적으로 삭제되며, 복구할 수 없습니다."
        confirmText="휴지통 비우기"
        isDestructive={true}
        onConfirm={() => {
          onEmptyTrash();
          setEmptyConfirmOpen(false);
        }}
        onCancel={() => setEmptyConfirmOpen(false)}
      />

      {/* Permanent Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="메모를 영구히 삭제하시겠습니까?"
        description="이 작업은 취소할 수 없으며 데이터가 완전히 삭제됩니다."
        confirmText="영구 삭제"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetId) {
            onPermanentDelete(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

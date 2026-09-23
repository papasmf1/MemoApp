'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / Cmd + N', desc: '새 메모 작성 및 즉시 편집' },
    { key: 'Ctrl / Cmd + K', desc: '실시간 검색창으로 포커스 이동' },
    { key: 'Ctrl / Cmd + S', desc: '현재 메모 즉시 강제 저장' },
    { key: 'Ctrl / Cmd + P', desc: '메모 상단 고정(Pin) 토글' },
    { key: 'Ctrl / Cmd + Shift + D', desc: '현재 메모 삭제 (휴지통 이동)' },
    { key: 'Ctrl / Cmd + Shift + P', desc: '마크다운 편집 / 미리보기 모드 전환' },
    { key: 'Ctrl / Cmd + E', desc: '현재 메모 마크다운(.md) 내보내기' },
    { key: 'Esc', desc: '모달 닫기 / 검색 입력 초기화' },
    { key: '?', desc: '키보드 단축키 안내 열기' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">키보드 단축키</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">빠른 작업을 위한 키보드 단축키 모음</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2.5">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

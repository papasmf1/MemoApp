'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, X, Globe, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  shareToken: string | null;
  onGenerateShare: (noteId: string) => Promise<string>;
  onRevokeShare: (noteId: string) => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  shareToken,
  onGenerateShare,
  onRevokeShare,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareToken ? `${origin}/share/${shareToken}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('공유 링크가 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('클립보드 복사에 실패했습니다.');
    }
  };

  const handleEnableShare = async () => {
    setLoading(true);
    try {
      await onGenerateShare(noteId);
      toast.success('읽기 전용 공유 링크가 활성화되었습니다.');
    } catch {
      toast.error('공유 링크 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableShare = async () => {
    setLoading(true);
    try {
      await onRevokeShare(noteId);
      toast.success('공유 링크가 비활성화되었습니다.');
    } catch {
      toast.error('공유 링크 해제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">메모 공유</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {noteTitle || '제목 없는 메모'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <Globe className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              공유 링크를 가진 사람은 누구나 이 메모를 <strong>읽기 전용</strong>으로 열람할 수 있습니다. (편집 불가)
            </div>
          </div>

          {shareToken ? (
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                공유 URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden select-all"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  공유 링크 활성 상태
                </span>
                <button
                  onClick={handleDisableShare}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  링크 회수 (비활성화)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                현재 이 메모는 비공개 상태입니다.
              </p>
              <button
                onClick={handleEnableShare}
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                {loading ? '생성 중...' : '읽기 전용 공유 링크 만들기'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

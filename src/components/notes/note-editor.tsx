'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Pin,
  Share2,
  Trash2,
  Download,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Edit3,
  Columns,
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Code,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  CheckSquare,
  ArrowLeft,
  X,
  Plus,
} from 'lucide-react';
import { Note, SaveStatus } from '@/lib/types';
import { downloadFile, getWordAndCharCount, formatRelativeTime } from '@/lib/utils';
import { MarkdownPreview } from './markdown-preview';

interface NoteEditorProps {
  note: Note;
  saveStatus: SaveStatus;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onUpdateTags: (tags: string[]) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onOpenShare: () => void;
  onBackMobile?: () => void;
}

export type EditorViewMode = 'edit' | 'split' | 'preview';

export function NoteEditor({
  note,
  saveStatus,
  onUpdateTitle,
  onUpdateContent,
  onUpdateTags,
  onTogglePin,
  onDelete,
  onOpenShare,
  onBackMobile,
}: NoteEditorProps) {
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-switch to edit mode on small screens if split was default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('edit');
    }
  }, []);

  const stats = getWordAndCharCount(note.content || '');

  // Markdown toolbar helper
  const insertMarkdown = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = note.content || '';
    const selected = current.substring(start, end) || defaultPlaceholder;

    const newContent =
      current.substring(0, start) +
      prefix +
      selected +
      suffix +
      current.substring(end);

    onUpdateContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, '');
      if (val && !note.tags?.includes(val)) {
        onUpdateTags([...(note.tags || []), val]);
      }
      setNewTagInput('');
      setShowTagInput(false);
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onUpdateTags((note.tags || []).filter((t) => t !== tagName));
  };

  const handleExport = (format: 'md' | 'txt') => {
    const filename = `${note.title.trim() || 'memo'}.${format}`;
    const content =
      format === 'md'
        ? `# ${note.title}\n\n${note.content}`
        : `${note.title}\n\n${note.content}`;
    downloadFile(filename, content, format === 'md' ? 'text/markdown' : 'text/plain');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="목록으로 돌아가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                <span className="text-indigo-600 dark:text-indigo-400">저장 중...</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500">저장 실패</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">저장됨</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="편집 모드"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">편집</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="분할 보기"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>분할</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              title="미리보기 모드"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">미리보기</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Pin toggle */}
          <button
            onClick={onTogglePin}
            className={`p-2 rounded-xl border transition-all ${
              note.is_pinned
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 border-amber-200 dark:border-amber-800'
                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={note.is_pinned ? '고정 해제' : '상단 고정 (Cmd+P)'}
          >
            <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>

          {/* Share button */}
          <button
            onClick={onOpenShare}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="읽기 전용 링크 공유"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="파일 내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 w-36 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                마크다운 (.md)
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                텍스트 (.txt)
              </button>
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 border border-slate-200 dark:border-slate-800 transition-colors"
            title="삭제 (휴지통 이동)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Tags Header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="제목을 입력하세요..."
          className="w-full text-xl sm:text-2xl font-bold bg-transparent text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-hidden"
        />

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {note.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {showTagInput ? (
            <input
              type="text"
              autoFocus
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => {
                if (newTagInput.trim()) {
                  handleRemoveTag('');
                }
                setShowTagInput(false);
              }}
              placeholder="태그 입력 후 Enter..."
              className="px-2 py-0.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden w-28"
            />
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3 h-3" />
              태그 추가
            </button>
          )}
        </div>
      </div>

      {/* Markdown Toolbar (visible in edit and split modes) */}
      {viewMode !== 'preview' && (
        <div className="flex items-center gap-1 px-6 py-1.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => insertMarkdown('**', '**', '굵게')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="굵게 (**텍스트**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('*', '*', '기울임')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="기울임 (*텍스트*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('~~', '~~', '취소선')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="취소선 (~~텍스트~~)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={() => insertMarkdown('## ', '', '제목')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="제목 (## )"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('`', '`', 'code')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="인라인 코드 (`code`)"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('```\n', '\n```', '코드 블록')}
            className="px-1.5 py-0.5 text-xs font-mono rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="코드 블록"
          >
            {'</>'}
          </button>
          <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={() => insertMarkdown('- ', '', '목록 항목')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="글머리 기호 목록 (- )"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('1. ', '', '번호 목록')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="번호 목록 (1. )"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('- [ ] ', '', '할 일')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="체크박스 할 일 (- [ ] )"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('> ', '', '인용구')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="인용구 (> )"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertMarkdown('[', '](https://)', '링크 텍스트')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            title="하이퍼링크"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor & Preview Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Textarea Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`h-full flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              placeholder="내용을 마크다운 문법으로 자유롭게 작성해보세요..."
              className="flex-1 w-full p-6 text-sm sm:text-base leading-relaxed resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden font-mono"
            />
          </div>
        )}

        {/* Markdown Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full overflow-y-auto p-6 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <MarkdownPreview content={note.content} />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>{stats.chars}자</span>
          <span>•</span>
          <span>{stats.words}단어</span>
          <span>•</span>
          <span>{stats.lines}줄</span>
        </div>

        <div className="flex items-center gap-2">
          <span>최종 수정: {formatRelativeTime(note.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

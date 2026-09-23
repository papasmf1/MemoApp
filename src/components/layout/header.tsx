'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {
  FileText,
  Search,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenShortcuts: () => void;
  onFocusSearch: () => void;
  onToggleSidebar?: () => void;
}

export function Header({
  user,
  onOpenAuth,
  onLogout,
  onOpenShortcuts,
  onFocusSearch,
  onToggleSidebar,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="사이드바 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              웹 메모장
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut button */}
        <button
          onClick={onFocusSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>메모 검색...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`현재 테마: ${theme || 'system'} (클릭하여 전환)`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Laptop className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Shortcuts Help */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="단축키 안내 (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Auth / Guest Status */}
        {user && !user.isGuest ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[120px] truncate">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition-all border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>로그인 / 동기화</span>
          </button>
        )}
      </div>
    </header>
  );
}

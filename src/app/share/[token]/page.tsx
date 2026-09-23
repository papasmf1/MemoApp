import React from 'react';
import Link from 'next/link';
import { FileText, Copy, ArrowLeft, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { MarkdownPreview } from '@/components/notes/markdown-preview';
import { formatFullDateTime } from '@/lib/utils';
import { LocalStorageRepository } from '@/lib/storage/local-storage';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedNotePage({ params }: SharePageProps) {
  const { token } = await params;

  // Let's attempt to fetch from Supabase if configured or LocalStorage fallback
  let note: any = null;

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('notes')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        note_tags (
          tags (
            name
          )
        )
      `)
      .eq('share_token', token)
      .is('deleted_at', null)
      .maybeSingle();

    if (data) {
      note = {
        id: data.id,
        title: data.title,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        tags: data.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [],
      };
    }
  } catch {
    // If Supabase call failed or not configured, check demo/local token
  }

  // Fallback for demo / local token
  if (!note && token === 'demo-welcome-token') {
    note = await LocalStorageRepository.getSharedNote(token);
  }

  if (!note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-500 mb-4 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          공유된 메모를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          공유 링크가 만료되었거나 작성자에 의해 비활성화되었습니다.
        </p>
        <Link
          href="/"
          className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
        >
          <ArrowLeft className="w-4 h-4" />
          웹 메모장 홈으로 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Banner */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <FileText className="w-4 h-4" />
          <span>웹 메모장 (Web Notepad)</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            읽기 전용 공유
          </span>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            내 메모장 만들기
          </Link>
        </div>
      </header>

      {/* Note Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10">
        <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {note.title || '제목 없는 메모'}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pb-6 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatFullDateTime(note.created_at)}</span>
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <div className="flex gap-1">
                  {note.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Markdown Body */}
          <div className="pt-6">
            <MarkdownPreview content={note.content} />
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        웹 브라우저에서 바로 작성하고 자동 저장되는 웹 메모장
      </footer>
    </div>
  );
}

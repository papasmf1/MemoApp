'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!configured) {
      setErrorMsg('Supabase 설정(.env.local)이 완료되지 않았습니다. 현재는 로컬 게스트 모드로 동작 중입니다.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          toast.success('회원가입 및 로그인이 완료되었습니다!');
          onAuthSuccess(email);
          onClose();
        } else {
          toast.success('회원가입 확인 메일이 발송되었습니다. 메일함을 확인해주세요.');
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success('로그인되었습니다.');
          onAuthSuccess(email);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '인증 처리에 실패했습니다.');
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
              {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {isSignUp ? '계정 만들기 (회원가입)' : '로그인'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                여러 기기에서 안전하게 메모를 동기화하세요
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

        {!configured && (
          <div className="mx-6 mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Supabase 미설정 안내:</strong> 현재 서버 환경 변수가 설정되지 않아 브라우저 <code>localStorage</code>로 메모가 보관됩니다. Supabase 연동 시 클라우드 동기화를 이용하실 수 있습니다.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-200 dark:border-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading ? '처리 중...' : isSignUp ? '회원가입 완료하기' : '로그인'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {isSignUp ? (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  로그인하기
                </button>
              </>
            ) : (
              <>
                아직 계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  무료 회원가입
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

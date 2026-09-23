import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: '웹 메모장 — 빠르고 가벼운 온라인 메모장',
  description: '웹 브라우저에서 바로 작성하고 자동 저장되는 스마트하고 가벼운 메모장',
  keywords: ['메모장', '웹메모', '노트', '온라인메모장', '마크다운', 'Web Notepad'],
  authors: [{ name: 'Web Notepad Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0b0f19]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}

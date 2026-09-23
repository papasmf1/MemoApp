'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const renderedHtml = useMemo(() => {
    if (!content || content.trim() === '') {
      return '<p class="text-slate-400 italic">내용이 비어있습니다.</p>';
    }

    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      // Parse markdown to HTML
      const rawHtml = marked.parse(content) as string;

      // Basic XSS defense: strip unsafe script/iframe/event tags
      const sanitized = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');

      return sanitized;
    } catch (e) {
      console.error('Markdown parse error:', e);
      return '<p class="text-red-500">마크다운 렌더링 중 오류가 발생했습니다.</p>';
    }
  }, [content]);

  return (
    <div
      className={`markdown-body text-slate-800 dark:text-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

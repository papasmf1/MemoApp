import { Note, Tag, ViewFilter, SortOption } from '@/lib/types';

const STORAGE_KEY = 'web_notepad_notes_v1';
const TAGS_KEY = 'web_notepad_tags_v1';

const INITIAL_NOTES: Note[] = [
  {
    id: 'welcome-note-1',
    user_id: 'guest',
    title: '✨ 웹 메모장에 오신 것을 환영합니다!',
    content: `# 빠르고 가벼운 브라우저 메모장

브라우저를 열고 바로 작성하세요. 입력하는 모든 내용은 **자동 저장**됩니다.

## 🚀 주요 기능
- **자동 저장**: 타이핑을 멈추면 0.5초 후 즉시 저장됩니다.
- **마크다운 지원**: 상단 툴바를 이용하거나 직접 문법을 입력해 서식화할 수 있습니다.
- **고정 기능**: 자주 보는 메모는 상단 핀을 눌러 고정하세요.
- **태그 분류**: \`#개발\`, \`#아이디어\` 등 태그를 추가하여 손쉽게 필터링할 수 있습니다.
- **단축키**:
  - \`Ctrl / Cmd + N\`: 새 메모 작성
  - \`Ctrl / Cmd + K\`: 검색창 열기
  - \`Ctrl / Cmd + S\`: 즉시 저장
  - \`Ctrl / Cmd + P\`: 메모 고정 토글
  - \`?\`: 단축키 목록 보기

우측 상단의 **공유** 버튼으로 읽기 전용 링크를 만들거나, **내보내기**로 \`.md\` / \`.txt\` 파일을 다운로드할 수 있습니다.
`,
    is_pinned: true,
    deleted_at: null,
    share_token: 'demo-welcome-token',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
    tags: ['가이드', '시작하기'],
  },
  {
    id: 'markdown-demo-2',
    user_id: 'guest',
    title: '📝 마크다운 서식 미리보기 예제',
    content: `## 풍부한 텍스트 표현

웹 메모장은 다양한 마크다운 서식을 실시간으로 지원합니다.

### 1. 코드 블록
\`\`\`typescript
interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
}
\`\`\`

### 2. 할 일 목록 (Task List)
- [x] 웹 메모장 설치 및 실행
- [x] 다크 모드 전환해보기
- [ ] 첫 번째 개인 메모 작성하기
- [ ] 태그 추가해보기

### 3. 인용구 & 강조
> "가장 단순한 기록이 가장 강력한 기억보다 오래 남는다."

*기울임 텍스트*, **굵은 텍스트**, 그리고 [Google](https://google.com) 링크까지 손쉽게 작성해보세요!
`,
    is_pinned: false,
    deleted_at: null,
    share_token: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    tags: ['마크다운', '예제'],
  },
  {
    id: 'todo-idea-3',
    user_id: 'guest',
    title: '💡 프로젝트 아이디어 & 할 일',
    content: `## 다음 스프린트 목표
1. Supabase 연동 확인 및 Auth 로그인 테스트
2. 모바일 브라우저 PWA 추가 검토
3. 개인 블로그 글 초안 정리하기
`,
    is_pinned: false,
    deleted_at: null,
    share_token: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    tags: ['아이디어', '할일'],
  }
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getStoredNotes(): Note[] {
  if (!isBrowser()) return INITIAL_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notes from localStorage', e);
    return INITIAL_NOTES;
  }
}

function saveStoredNotes(notes: Note[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes to localStorage', e);
  }
}

export const LocalStorageRepository = {
  async getNotes(filter?: ViewFilter, sort: SortOption = 'updated_desc', search?: string): Promise<Note[]> {
    let notes = getStoredNotes();

    // 1. Filter deleted/trash
    if (filter?.type === 'trash') {
      notes = notes.filter((n) => n.deleted_at !== null);
    } else {
      notes = notes.filter((n) => n.deleted_at === null);
      if (filter?.type === 'pinned') {
        notes = notes.filter((n) => n.is_pinned);
      } else if (filter?.type === 'tag') {
        notes = notes.filter((n) => n.tags?.includes(filter.tagName));
      }
    }

    // 2. Search
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    notes.sort((a, b) => {
      // If not in trash and not sorting by specific non-pinned, pinned comes first if enabled
      if (sort === 'title_asc') {
        return a.title.localeCompare(b.title, 'ko');
      } else if (sort === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // updated_desc
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return notes;
  },

  async getNoteById(id: string): Promise<Note | null> {
    const notes = getStoredNotes();
    return notes.find((n) => n.id === id) || null;
  },

  async createNote(payload: Partial<Note> = {}): Promise<Note> {
    const notes = getStoredNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'note-' + Date.now(),
      user_id: payload.user_id || 'guest',
      title: payload.title !== undefined ? payload.title : '',
      content: payload.content !== undefined ? payload.content : '',
      is_pinned: payload.is_pinned ?? false,
      deleted_at: null,
      share_token: null,
      created_at: now,
      updated_at: now,
      tags: payload.tags || [],
    };

    notes.unshift(newNote);
    saveStoredNotes(notes);
    return newNote;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const notes = getStoredNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error('Note not found');
    }

    const current = notes[index];
    const updated: Note = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    notes[index] = updated;
    saveStoredNotes(notes);
    return updated;
  },

  async softDeleteNote(id: string): Promise<void> {
    const notes = getStoredNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      notes[index].deleted_at = new Date().toISOString();
      notes[index].is_pinned = false; // unpin when moving to trash
      notes[index].updated_at = new Date().toISOString();
      saveStoredNotes(notes);
    }
  },

  async restoreNote(id: string): Promise<void> {
    const notes = getStoredNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      notes[index].deleted_at = null;
      notes[index].updated_at = new Date().toISOString();
      saveStoredNotes(notes);
    }
  },

  async permanentDeleteNote(id: string): Promise<void> {
    const notes = getStoredNotes().filter((n) => n.id !== id);
    saveStoredNotes(notes);
  },

  async emptyTrash(): Promise<void> {
    const notes = getStoredNotes().filter((n) => n.deleted_at === null);
    saveStoredNotes(notes);
  },

  async togglePin(id: string): Promise<Note> {
    const note = await this.getNoteById(id);
    if (!note) throw new Error('Note not found');
    return this.updateNote(id, { is_pinned: !note.is_pinned });
  },

  async getTags(): Promise<Tag[]> {
    const notes = getStoredNotes().filter((n) => n.deleted_at === null);
    const tagMap = new Map<string, number>();

    notes.forEach((n) => {
      n.tags?.forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) {
          tagMap.set(trimmed, (tagMap.get(trimmed) || 0) + 1);
        }
      });
    });

    return Array.from(tagMap.entries()).map(([name, count]) => ({
      id: `tag-${name}`,
      user_id: 'guest',
      name,
      count,
    }));
  },

  async createTag(name: string): Promise<Tag> {
    const trimmed = name.trim();
    return {
      id: `tag-${trimmed}`,
      user_id: 'guest',
      name: trimmed,
      count: 0,
    };
  },

  async deleteTag(name: string): Promise<void> {
    const notes = getStoredNotes();
    notes.forEach((n) => {
      if (n.tags) {
        n.tags = n.tags.filter((t) => t !== name);
      }
    });
    saveStoredNotes(notes);
  },

  async createShareLink(id: string): Promise<string> {
    const note = await this.getNoteById(id);
    if (!note) throw new Error('Note not found');

    const token = note.share_token || ('share_' + Math.random().toString(36).substring(2, 10));
    await this.updateNote(id, { share_token: token });
    return token;
  },

  async revokeShareLink(id: string): Promise<void> {
    await this.updateNote(id, { share_token: null });
  },

  async getSharedNote(token: string): Promise<Note | null> {
    const notes = getStoredNotes();
    const found = notes.find((n) => n.share_token === token && n.deleted_at === null);
    return found || null;
  },
};

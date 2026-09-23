export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  deleted_at: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
  count?: number;
}

export type SortOption = 'updated_desc' | 'created_desc' | 'title_asc';

export type ViewFilter = 
  | { type: 'all' }
  | { type: 'pinned' }
  | { type: 'trash' }
  | { type: 'tag'; tagName: string };

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface UserProfile {
  id: string;
  email: string;
  isGuest: boolean;
}

export interface StorageAdapter {
  getNotes(filter?: ViewFilter, sort?: SortOption, search?: string): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  createNote(note: Partial<Note>): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  softDeleteNote(id: string): Promise<void>;
  restoreNote(id: string): Promise<void>;
  permanentDeleteNote(id: string): Promise<void>;
  emptyTrash(): Promise<void>;
  getTags(): Promise<Tag[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(name: string): Promise<void>;
  togglePin(id: string): Promise<Note>;
  createShareLink(id: string): Promise<string>;
  revokeShareLink(id: string): Promise<void>;
  getSharedNote(token: string): Promise<Note | null>;
}

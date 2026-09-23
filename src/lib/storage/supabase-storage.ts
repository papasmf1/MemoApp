import { Note, Tag, ViewFilter, SortOption } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export const SupabaseStorageRepository = {
  async getNotes(filter?: ViewFilter, sort: SortOption = 'updated_desc', search?: string): Promise<Note[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('notes')
      .select(`
        id,
        user_id,
        title,
        content,
        is_pinned,
        deleted_at,
        share_token,
        created_at,
        updated_at,
        note_tags (
          tags (
            name
          )
        )
      `)
      .eq('user_id', user.id);

    // Filter
    if (filter?.type === 'trash') {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
      if (filter?.type === 'pinned') {
        query = query.eq('is_pinned', true);
      }
    }

    // Search
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`);
    }

    // Sort
    if (sort === 'title_asc') {
      query = query.order('title', { ascending: true });
    } else if (sort === 'created_desc') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase getNotes error:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notes: Note[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content: row.content,
      is_pinned: row.is_pinned,
      deleted_at: row.deleted_at,
      share_token: row.share_token,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: row.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [],
    }));

    if (filter?.type === 'tag') {
      notes = notes.filter((n) => n.tags?.includes(filter.tagName));
    }

    return notes;
  },

  async getNoteById(id: string): Promise<Note | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notes')
      .select(`
        id,
        user_id,
        title,
        content,
        is_pinned,
        deleted_at,
        share_token,
        created_at,
        updated_at,
        note_tags (
          tags (
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      content: data.content,
      is_pinned: data.is_pinned,
      deleted_at: data.deleted_at,
      share_token: data.share_token,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: data.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [],
    };
  },

  async createNote(payload: Partial<Note> = {}): Promise<Note> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: payload.title || '',
        content: payload.content || '',
        is_pinned: payload.is_pinned ?? false,
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create note');

    // Tags
    if (payload.tags && payload.tags.length > 0) {
      await this.syncTags(data.id, payload.tags);
    }

    return {
      ...data,
      tags: payload.tags || [],
    };
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const supabase = createClient();
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.is_pinned !== undefined) payload.is_pinned = updates.is_pinned;
    if (updates.deleted_at !== undefined) payload.deleted_at = updates.deleted_at;
    if (updates.share_token !== undefined) payload.share_token = updates.share_token;

    const { data, error } = await supabase
      .from('notes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update note');

    if (updates.tags !== undefined) {
      await this.syncTags(id, updates.tags);
    }

    return {
      ...data,
      tags: updates.tags || [],
    };
  },

  async softDeleteNote(id: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString(), is_pinned: false })
      .eq('id', id);
  },

  async restoreNote(id: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('notes')
      .update({ deleted_at: null })
      .eq('id', id);
  },

  async permanentDeleteNote(id: string): Promise<void> {
    const supabase = createClient();
    await supabase.from('notes').delete().eq('id', id);
  },

  async emptyTrash(): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notes')
      .delete()
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null);
  },

  async togglePin(id: string): Promise<Note> {
    const note = await this.getNoteById(id);
    if (!note) throw new Error('Note not found');
    return this.updateNote(id, { is_pinned: !note.is_pinned });
  },

  async getTags(): Promise<Tag[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tags')
      .select('id, user_id, name, created_at')
      .eq('user_id', user.id);

    if (error || !data) return [];
    return data;
  },

  async createTag(name: string): Promise<Tag> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();
    if (error || !data) throw error || new Error('Failed to create tag');
    return data;
  },

  async deleteTag(name: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('tags').delete().eq('user_id', user.id).eq('name', name);
  },

  async syncTags(noteId: string, tags: string[]): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Remove existing note_tags
    await supabase.from('note_tags').delete().eq('note_id', noteId);

    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;

      // Upsert tag
      let { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmed)
        .maybeSingle();

      if (!tag) {
        const { data: createdTag } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name: trimmed })
          .select('id')
          .single();
        tag = createdTag;
      }

      if (tag) {
        await supabase
          .from('note_tags')
          .insert({ note_id: noteId, tag_id: tag.id });
      }
    }
  },

  async createShareLink(id: string): Promise<string> {
    const token = 'share_' + Math.random().toString(36).substring(2, 10);
    await this.updateNote(id, { share_token: token });
    return token;
  },

  async revokeShareLink(id: string): Promise<void> {
    await this.updateNote(id, { share_token: null });
  },

  async getSharedNote(token: string): Promise<Note | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notes')
      .select(`
        id,
        user_id,
        title,
        content,
        is_pinned,
        deleted_at,
        share_token,
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
      .single();

    if (error || !data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      content: data.content,
      is_pinned: data.is_pinned,
      deleted_at: data.deleted_at,
      share_token: data.share_token,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: data.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || [],
    };
  },
};

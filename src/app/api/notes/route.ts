import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'updated_desc';

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
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (q && q.trim() !== '') {
      query = query.or(`title.ilike.%${q.trim()}%,content.ilike.%${q.trim()}%`);
    }

    if (sort === 'title_asc') {
      query = query.order('title', { ascending: true });
    } else if (sort === 'created_desc') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let notes = (data || []).map((row: any) => ({
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

    if (tag) {
      notes = notes.filter((n: { tags: string[] }) => n.tags.includes(tag));
    }

    return NextResponse.json({ data: notes });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title = '', content = '', is_pinned = false, tags = [] } = body;

    // Content length limit from TRD (100,000 characters)
    if (content.length > 100000) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '본문은 100,000자 이내여야 합니다.' } },
        { status: 400 }
      );
    }

    const { data: newNote, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        content,
        is_pinned,
      })
      .select()
      .single();

    if (error || !newNote) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error?.message || 'Failed to create' } }, { status: 500 });
    }

    // Insert tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tName of tags) {
        const trimmed = String(tName).trim();
        if (!trimmed) continue;

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
          await supabase.from('note_tags').insert({
            note_id: newNote.id,
            tag_id: tag.id,
          });
        }
      }
    }

    return NextResponse.json({
      data: {
        ...newNote,
        tags,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

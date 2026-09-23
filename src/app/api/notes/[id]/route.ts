import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

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
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '메모를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = {
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

    return NextResponse.json({ data: note });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, is_pinned, tags } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      if (content.length > 100000) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '본문은 100,000자 이내여야 합니다.' } },
          { status: 400 }
        );
      }
      updates.content = content;
    }
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;

    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updatedNote) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: error?.message || '수정에 실패했습니다.' } },
        { status: 500 }
      );
    }

    // Sync tags if provided
    if (Array.isArray(tags)) {
      await supabase.from('note_tags').delete().eq('note_id', id);

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
            note_id: id,
            tag_id: tag.id,
          });
        }
      }
    }

    return NextResponse.json({
      data: {
        ...updatedNote,
        tags: tags !== undefined ? tags : [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    // Soft delete: set deleted_at and unpin
    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString(), is_pinned: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: { message: '휴지통으로 이동되었습니다.' } });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

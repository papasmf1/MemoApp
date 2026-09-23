import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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
    const { tags = [] } = body;

    // Verify ownership
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '메모를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // Replace note_tags
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

    return NextResponse.json({ data: { message: '태그가 동기화되었습니다.', tags } });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

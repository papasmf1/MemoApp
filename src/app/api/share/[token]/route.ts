import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
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
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '공유된 메모를 찾을 수 없거나 삭제되었습니다.' } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const note = {
      id: data.id,
      title: data.title,
      content: data.content,
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

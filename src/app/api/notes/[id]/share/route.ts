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

    const shareToken = 'share_' + Math.random().toString(36).substring(2, 10);

    const { data, error } = await supabase
      .from('notes')
      .update({ share_token: shareToken })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, share_token')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error?.message || 'Failed to create share link' } }, { status: 500 });
    }

    return NextResponse.json({ data: { share_token: data.share_token } });
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

    const { error } = await supabase
      .from('notes')
      .update({ share_token: null })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: { message: '공유 링크가 비활성화되었습니다.' } });
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 });
  }
}

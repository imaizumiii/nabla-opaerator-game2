import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バックエンドURLを環境変数から取得
    let backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    // プロトコルがない場合は自動的にhttps://を追加
    if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }
    
    // バックエンドAPIにリクエストを転送
    const response = await fetch(`${backendUrl}/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errorData.detail || `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

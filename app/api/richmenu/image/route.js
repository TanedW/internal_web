import { NextResponse } from 'next/server';
import { getBotToken } from '@/lib/botConfig';
import { getRichMenuImage } from '@/lib/lineApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const botKey = searchParams.get('botKey');
  const menuId = searchParams.get('menuId');

  if (!botKey || !menuId) {
    return NextResponse.json({ error: 'Missing botKey or menuId' }, { status: 400 });
  }

  const token = getBotToken(botKey);
  if (!token) {
    return NextResponse.json({ error: 'Invalid botKey' }, { status: 400 });
  }

  try {
    const imageResponse = await getRichMenuImage(token, menuId);

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`LINE API Error: ${errorText}`);
      return NextResponse.json({ error: `Failed to fetch image from LINE API: ${imageResponse.statusText}` }, { status: imageResponse.status });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching rich menu image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

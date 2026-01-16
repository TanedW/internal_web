import { callLineAPI } from '@/lib/lineApi';
import { getBotToken } from '@/lib/botConfig';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const botKey = searchParams.get('botKey');

    if (!botKey) {
      return Response.json(
        { error: 'botKey is required' },
        { status: 400 }
      );
    }

    const token = getBotToken(botKey);
    if (!token) {
      return Response.json(
        { error: 'Invalid bot key' },
        { status: 400 }
      );
    }

    const result = await callLineAPI(
      'https://api.line.me/v2/bot/user/all/richmenu',
      'GET',
      null,
      token
    );

    if (result.code === 200) {
      return Response.json({
        currentMenuId: result.response?.richMenuId || null,
      });
    }

    return Response.json(
      { currentMenuId: null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch current menu', details: error.message },
      { status: 500 }
    );
  }
}

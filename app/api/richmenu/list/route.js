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
      'https://api.line.me/v2/bot/richmenu/list',
      'GET',
      null,
      token
    );

    if (result.code === 200) {
      return Response.json({
        richmenus: result.response?.richmenus || [],
      });
    }

    return Response.json(
      { richmenus: [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch menus', details: error.message },
      { status: 500 }
    );
  }
}

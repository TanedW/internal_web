import { callLineAPI } from '@/lib/lineApi';
import { getBotToken } from '@/lib/botConfig';

export async function POST(request) {
  try {
    const { botKey, menuId } = await request.json();

    if (!botKey || !menuId) {
      return Response.json(
        { error: 'botKey and menuId are required' },
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
      `https://api.line.me/v2/bot/richmenu/${menuId}`,
      'DELETE',
      null,
      token
    );

    if (result.code === 200) {
      return Response.json({
        success: true,
        message: 'Menu deleted successfully',
      });
    }

    return Response.json(
      { error: result.response?.message || 'Failed to delete menu' },
      { status: result.code || 400 }
    );
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

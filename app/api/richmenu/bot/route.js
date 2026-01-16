import { getBotToken, getBotDefinition } from '@/lib/botConfig';
import { getBotInfo } from '@/lib/lineApi';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const botKey = searchParams.get('key');

    if (!botKey) {
      return Response.json(
        { error: 'Bot key is required' },
        { status: 400 }
      );
    }

    const definition = getBotDefinition(botKey);
    if (!definition) {
      return Response.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    const token = definition.token;

    try {
      const result = await getBotInfo(token);
      const botInfo = result?.response;

      return Response.json({
        key: botKey,
        name: botInfo?.displayName || botKey,
        pictureUrl: botInfo?.pictureUrl || '',
        basicId: botInfo?.basicId || '',
        userId: botInfo?.userId || '',
      });
    } catch (error) {
      console.error('Error fetching from LINE API:', error);
      return Response.json({
        key: botKey,
        name: botKey,
        pictureUrl: '',
        basicId: '',
        userId: '',
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

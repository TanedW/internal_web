import { getAllBotKeys, getBotDefinition } from '@/lib/botConfig';
import { getBotInfo } from '@/lib/lineApi';

export async function GET(request) {
  try {
    const botKeys = getAllBotKeys();
    const bots = [];

    for (const key of botKeys) {
      const definition = getBotDefinition(key);
      if (!definition) continue;

      try {
        const infoResult = await getBotInfo(definition.token);
        const info = infoResult?.response;

        bots.push({
          key,
          name: info?.displayName || key,
          pictureUrl: info?.pictureUrl || '',
          basicId: info?.basicId || '',
          userId: info?.userId || '',
        });
      } catch (error) {
        console.error(`Error fetching info for ${key}:`, error);
        bots.push({
          key,
          name: key,
          pictureUrl: '',
          basicId: '',
          userId: '',
        });
      }
    }

    return Response.json(bots);
  } catch (error) {
    console.error('Error fetching bots:', error);
    return Response.json(
      { error: 'Failed to fetch bots', details: error.message },
      { status: 500 }
    );
  }
}

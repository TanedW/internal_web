import { pool } from './db.js';

// BOT_DEFINITIONS is deprecated for token storage.
// Tokens are now fetched from the database.
// This object is kept for now to avoid breaking other functions.
const BOT_DEFINITIONS = {
  traffy_main: {
    token: '+N8p7NFwLJvBXi3aYz/XPSase0h3AMYRFsortd4npmrPQ9yab4NP+/P6Hi8w2Se7DFcQvwgKNZCKXi3pYhFQv2av639yW78zoJmF0MUkuHmhqR42wZkONUrDr+Hvp2WPatic8gwttJMgm8+zhKwg5QdB04t89/1O/w1cDnyilFU=',
    secret: '',
  },
};

/**
 * Fetches the bot's channel access token from the database.
 * @param {string} botKey - The key of the bot (e.g., '@123abcde').
 * @returns {Promise<string|null>} The channel access token or null if not found.
 */
export async function getBotToken(botKey) {
  try {
    const result = await pool.query('SELECT channel_token FROM line_bots WHERE bot_key = $1', [botKey]);
    if (result.rows.length > 0) {
      return result.rows[0].channel_token;
    }
    console.warn(`Token not found in DB for botKey: ${botKey}`);
    return null;
  } catch (error) {
    console.error('Error fetching bot token from DB:', error);
    return null;
  }
}

export function getBotDefinition(botKey) {
  return BOT_DEFINITIONS[botKey] || null;
}

export function getAllBotKeys() {
  return Object.keys(BOT_DEFINITIONS);
}

export function isBotExists(botKey) {
  return BOT_DEFINITIONS.hasOwnProperty(botKey);
}

export function addBot(botKey, token, secret = '') {
  BOT_DEFINITIONS[botKey] = { token, secret };
}

export default BOT_DEFINITIONS;

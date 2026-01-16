const BOT_DEFINITIONS = {
  traffy_main: {
    token: '+N8p7NFwLJvBXi3aYz/XPSase0h3AMYRFsortd4npmrPQ9yab4NP+/P6Hi8w2Se7DFcQvwgKNZCKXi3pYhFQv2av639yW78zoJmF0MUkuHmhqR42wZkONUrDr+Hvp2WPatic8gwttJMgm8+zhKwg5QdB04t89/1O/w1cDnyilFU=',
    secret: '',
  },
};

export function getBotToken(botKey) {
  const bot = BOT_DEFINITIONS[botKey];
  return bot?.token || null;
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

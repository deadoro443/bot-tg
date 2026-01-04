const { getUserTokens } = require('../utils/tokenManager');

module.exports = {
  name: 'me',
  async execute(bot, msg) {
    const chatId = msg.chat.id;

    try {
      const tokens = await getUserTokens(chatId);

      const mensaje = `*📌 InfoARG*\n\n*👋 ¡Bienvenid@ a InfoARG!*\nUsá el comando */comandos* para aprender a usar el bot y ver sus funciones.\n\n*Tu ID:* \`${chatId}\`\n*Tokens:* \`${tokens}\``;

      bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error al obtener los tokens:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al obtener tus tokens.');
    }
  }
};

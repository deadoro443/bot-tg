const { getUserTokens } = require('../utils/tokenManager');
const config = require('../config.json');

module.exports = {
    name: 'tokensde',
    execute: async (bot, msg) => {
        const chatId = msg.chat.id;

        if (!config.admin_ids.includes(chatId)) {
            return bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
        }

        const args = msg.text.split(' ');
        if (args.length < 2) {
            return bot.sendMessage(chatId, '❗ Uso: /tokensde <user_id>');
        }

        const userId = args[1];

        try {
            const tokens = await getUserTokens(userId);
            bot.sendMessage(chatId, `👤 El usuario ${userId} tiene ${tokens} token(s).`);
        } catch (error) {
            console.error('Error al obtener tokens del usuario:', error);
            bot.sendMessage(chatId, '❌ Ocurrió un error al obtener los tokens del usuario.');
        }
    }
};

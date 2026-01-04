const { getUserTokens, removeTokens } = require('../utils/tokenManager');
const config = require('../config.json');

module.exports = {
  name: 'remove',
  execute: async (bot, msg) => {
    const chatId = msg.chat.id;

    // Verificamos si es admin
    if (!config.admin_ids.includes(chatId)) {
      return bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    }

    const args = msg.text.split(' ');
    if (args.length < 3) {
      return bot.sendMessage(chatId, '❗ Uso: /remove <user_id> <cantidad>');
    }

    const userId = args[1];
    const amount = parseInt(args[2]);

    if (isNaN(amount) || amount <= 0) {
      return bot.sendMessage(chatId, '❗ La cantidad debe ser un número válido mayor que 0.');
    }

    try {
      // Obtener los tokens actuales del usuario
      const currentTokens = await getUserTokens(userId);

      if (currentTokens < amount) {
        return bot.sendMessage(chatId, `⚠️ El usuario \`${userId}\` no tiene suficientes tokens. Tiene *${currentTokens}* token(s).`, {
          parse_mode: 'Markdown'
        });
      }

      // Eliminar los tokens
      await removeTokens(userId, amount);

      // Obtener los tokens después de la eliminación
      const updatedTokens = await getUserTokens(userId);

      // Intentar obtener información del usuario
      let userInfo;
      try {
        userInfo = await bot.getChat(userId);
      } catch (error) {
        console.error('No se pudo obtener información del usuario:', error);
      }

      const userIdentifier = userInfo ? 
        `${userId} (@${userInfo.username || 'Sin username'})` : 
        userId;

      bot.sendMessage(chatId, `Se eliminaron *${amount}* token(s) del usuario \`${userIdentifier}\`.\nAhora tiene *${updatedTokens}* token(s).`, {
        parse_mode: 'Markdown'
      });

      // Enviar log al grupo
      const logGroupId = config.log_group_id;
      const adminUsername = msg.from.username || msg.from.first_name;
      const logMessage = `🔔 *Logs remove*\n\n👤 Admin: @${adminUsername}\n🎯 Usuario: \`${userIdentifier}\`\n💰 Tokens removidos: *${amount}*\n💼 Total de tokens: *${updatedTokens}*`;
      
      bot.sendMessage(logGroupId, logMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error al eliminar tokens:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al eliminar los tokens.');
    }
  }
};
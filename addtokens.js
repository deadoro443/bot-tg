const { addTokens, getUserTokens } = require('../utils/tokenManager');
const config = require('../config.json');

module.exports = {
  name: 'add',
  execute: async (bot, msg) => {
    const chatId = msg.chat.id;

    // Verificamos si es admin
    if (!config.admin_ids.includes(chatId)) {
      return bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    }

    const args = msg.text.split(' ');
    if (args.length < 3) {
      return bot.sendMessage(chatId, '❗ Uso: /add <user_id> <cantidad>');
    }

    const userId = args[1];
    const amount = parseInt(args[2]);

    if (isNaN(amount) || amount <= 0) {
      return bot.sendMessage(chatId, '❗ La cantidad debe ser un número válido mayor que 0.');
    }

    try {
      await addTokens(userId, amount);
      const totalTokens = await getUserTokens(userId);

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

      bot.sendMessage(chatId, `Se le agregaron *${amount} token(s)* al usuario \`${userIdentifier}\` con éxito.\nAhora tiene *${totalTokens} token(s)*.`, {
        parse_mode: 'Markdown'
      });

      // Enviar log al grupo
      const logGroupId = config.log_group_id;
      const adminUsername = msg.from.username || msg.from.first_name;
      const logMessage = `🔔 *Logs add*\n\n👤 Admin: @${adminUsername}\n🎯 Usuario: \`${userIdentifier}\`\n💰 Tokens añadidos: *${amount}*\n💼 Total de tokens: *${totalTokens}*`;
      
      bot.sendMessage(logGroupId, logMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error al agregar tokens:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al agregar los tokens.');
    }
  }
};
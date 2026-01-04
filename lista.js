const { getAllUsersWithTokens } = require('../utils/tokenManager');
const config = require('../config.json');

module.exports = {
  name: 'listaadmin',
  async execute(bot, msg) {
    const chatId = msg.chat.id;

    if (!config.admin_ids.includes(chatId)) {
      return bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    }

    try {
      const allUsers = await getAllUsersWithTokens();
      
      // Filtrar usuarios que tienen tokens (más de 0)
      const usersWithTokens = allUsers.filter(user => user.tokens > 0);

      if (usersWithTokens.length === 0) {
        return bot.sendMessage(chatId, 'No hay usuarios con tokens.');
      }

      let message = '📊 Lista de usuarios con tokens:\n\n';
      
      for (const user of usersWithTokens) {
        let userInfo;
        try {
          userInfo = await bot.getChat(user.userId);
        } catch (error) {
          console.error(`No se pudo obtener información del usuario ${user.userId}:`, error);
        }

        const userIdentifier = userInfo ? 
          `${user.userId} (@${userInfo.username || 'Sin username'})` : 
          user.userId;

        message += `👤 Usuario: ${userIdentifier}\n`;
        message += `   💰 Tokens actuales: ${user.tokens}\n\n`;
      }

      // Dividir el mensaje si es demasiado largo
      const maxLength = 4096; // Límite de caracteres para un mensaje de Telegram
      if (message.length > maxLength) {
        let parts = [];
        while (message.length > 0) {
          parts.push(message.substr(0, maxLength));
          message = message.substr(maxLength);
        }
        for (let part of parts) {
          await bot.sendMessage(chatId, part);
        }
      } else {
        await bot.sendMessage(chatId, message);
      }
    } catch (error) {
      console.error('Error al obtener la lista de usuarios:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al obtener la lista de usuarios.');
    }
  }
};
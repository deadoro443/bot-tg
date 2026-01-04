module.exports = {
    name: 'idgrupo',
    execute(bot, msg) {
      const chatId = msg.chat.id;
      const chatType = msg.chat.type;
      let message;
  
      if (chatType === 'private') {
        message = `Este es un chat privado.\nID del chat: \`${chatId}\``;
      } else {
        const groupName = msg.chat.title;
        message = `Nombre del grupo: *${groupName}*\nID del grupo: \`${chatId}\``;
      }
  
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  };
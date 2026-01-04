module.exports = {
    name: 'start',
    async execute(bot, msg) {
      const chatId = msg.chat.id;
  
      const mensaje = `👋 *¡Bienvenid@ a InfoARG BOT!*
  
  Este bot te permite consultar información útil a partir de datos públicos.
  
  📌 Usá el comando */comandos* para ver la lista de funciones disponibles.
  
  ℹ️ Si tenés dudas o sugerencias, podés escribirnos.`;
  
      bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    }
  };
  
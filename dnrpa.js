// comandos/dnrpa.js
const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'dnrpass',
  async execute(bot, msg, dominio) {
    const chatId = msg.chat.id;

    if (!dominio) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar una patente (proba con mayúsculas/minuscula) Ejemplo: UWU666');
    }

    try {
      const url = `http://127.0.0.1:7055/agd/patente/${dominio}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta es válida
      if (!rawData || !rawData.data || !Array.isArray(rawData.data.titular_historial)) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados para la patente proporcionada.');
      }

      // Si la lista de titulares históricos está vacía
      if (rawData.data.titular_historial.length === 0) {
        return bot.sendMessage(chatId, '❌ No se encontraron titulares asociados a esta patente.');
      }

      const titulares = rawData.data.titular_historial.map(titular => {
        return `- ${titular.nombre} (CUIL: ${titular.cuil})`;
      }).join('\n');

      // Consumo de tokens (2 tokens en este caso, por el tipo de búsqueda)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Formateamos el mensaje con los titulares
      const mensaje = `
» Patente: ${dominio}
» Titulares históricos:
${titulares}
`;

      // Enviar el mensaje al usuario
      await bot.sendMessage(chatId, mensaje, { parse_mode: "Markdown" });
      
    } catch (error) {
      console.error('❌ Error al consultar la patente:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda.');
    }
  }
};

// comandos/tel.js
const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'tel',
  async execute(bot, msg, telefono) {
    const chatId = msg.chat.id;

    if (!telefono || telefono.length < 10) {
      return bot.sendMessage(chatId, '⚠️ ¡Debes proporcionar un número de teléfono válido!');
    }

    try {
      const url = `http://127.0.0.1:7055/agd/telefono/${telefono}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta es válida
      if (!rawData || !rawData.data || !Array.isArray(rawData.data)) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados para el teléfono proporcionado.');
      }

      // Si la lista de titulares está vacía
      if (rawData.data.length === 0) {
        return bot.sendMessage(chatId, '❌ No se encontraron titulares asociados a este teléfono.');
      }

      const titulares = rawData.data.map(titular => {
        return `- ${titular.nombre} (CUIL: ${titular.cuil})`;
      }).join('\n');

      // Consumo de tokens (2 tokens en este caso, por el tipo de búsqueda)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Formateamos el mensaje con los titulares
      const mensaje = `
» Teléfono: ${telefono}
» Titulares:
${titulares}
`;

      // Enviar el mensaje al usuario
      await bot.sendMessage(chatId, mensaje, { parse_mode: "Markdown" });
      
    } catch (error) {
      console.error('❌ Error al consultar el teléfono:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda.');
    }
  }
};

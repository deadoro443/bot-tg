const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'renaperssdgfkgdskdsgnsgdjksdgn',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    // Asegurarse de que args sea un array y extraer dni y sexo
    const [dni, sexo] = Array.isArray(args) ? args : (args || '').split(/\s+/);

    if (!dni || !sexo || !['M', 'F'].includes(sexo.toUpperCase())) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar DNI y sexo (M/F). Ejemplo: /renaper2 12345678 M');
    }

    try {
      const url = `http://localhost:7002/renaper?dni=${dni}&sexo=${sexo.toUpperCase()}`;
      const response = await axios.get(url);
      const data = response.data;

      if (!data || data.error) {
        return bot.sendMessage(chatId, `❌ Error en la consulta: ${data.error || 'Sin resultados'}`);
      }

      const tieneDatosUtiles = data.nombre || data.apellido || data.fecha_nacimiento;
      if (!tieneDatosUtiles) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos.');
      }

      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens. Comprá más para seguir usando el bot.');
      }

      const mensaje = `✅ *Resultado para DNI ${dni} y sexo ${sexo.toUpperCase()}:*\n\n` +
        `*Nombre:* ${data.nombre || 'N/A'}\n` +
        `*Apellido:* ${data.apellido || 'N/A'}\n` +
        `*Fecha de nacimiento:* ${data.fecha_nacimiento || 'N/A'}`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('❌ Error en comando renaper2:', error.message || error);
      if (error.response) {
        console.error('Respuesta de error:', error.response.data);
      }
      return bot.sendMessage(chatId, '❌ Hubo un error al realizar la consulta. Por favor, intenta más tarde.');
    }
  }
};
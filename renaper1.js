const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'renasdjsss',
  async execute(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const parts = text.trim().split(/\s+/);

    if (parts.length < 3) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI y el sexo. Ejemplo: /rena 12345678 1');
    }

    const dni = parts[1];
    const sexo = parts[2];

    try {
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      const url = `http://localhost:9927/cmpc?dni=${dni}&sexo=${sexo}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const data = res.data;

      console.log('✅ Respuesta de la API:', data);

      if (!data || !data.nombre || !data.apellido) {
        return bot.sendMessage(chatId, '❌ No se encontraron datos válidos para el DNI y sexo proporcionados.');
      }

      let mensaje = `🧬 Resultado RENAPER para DNI ${dni}\n\n`;
      mensaje += `• Nombre: ${data.nombre || 'Sin datos'} ${data.apellido || 'Sin datos'}\n`;
      mensaje += `• Sexo: ${data.sexo || 'Sin datos'}\n`;
      mensaje += `• Fecha de Nacimiento: ${data.fecha_nacimiento || 'Sin datos'}\n`;
      mensaje += `• Provincia: ${data.provincia || 'Sin datos'}\n`;
      mensaje += `• Ciudad: ${data.ciudad || 'Sin datos'}\n`;
      mensaje += `• Calle: ${data.calle || 'Sin datos'}\n`;
      mensaje += `• Departamento: ${data.departamento || 'Sin datos'}\n`;
      mensaje += `• Piso: ${data.piso || 'Sin datos'}\n`;
      mensaje += `• Monoblock: ${data.monoblock || 'Sin datos'}\n`;
      mensaje += `• Código Postal: ${data.cp || 'Sin datos'}\n`;
      mensaje += `• Fecha de Fallecimiento: No registrado\n`;

      await bot.sendMessage(chatId, mensaje);

    } catch (error) {
      console.error('❌ Error en el comando rena:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda en RENAPER.');
    }
  }
}

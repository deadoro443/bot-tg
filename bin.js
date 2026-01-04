const axios = require('axios');

module.exports = {
  name: 'bin',
  description: 'Consulta información de un BIN (Bank Identification Number).',
  async execute(bot, msg, bin) {
    const chatId = msg.chat.id;

    // Validación básica
    if (!bin || isNaN(bin) || bin.length < 6) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un BIN válido (mínimo 6 dígitos numéricos). Ejemplo: /bin 554730');
    }

    const url = `https://api.paypertic.com/binservice/${bin}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      if (!data || Object.keys(data).length === 0) {
        return bot.sendMessage(chatId, '❌ No se encontraron datos para ese BIN.');
      }

      // Formatear la respuesta
      const mensaje = `
💳 *Información del BIN* \`${data.iin}\`

• *Marca:* ${data.brand || 'N/D'}
• *Tipo:* ${data.type || 'N/D'}
• *Subtipo:* ${data.subtype || 'N/D'}
• *País:* ${data.country || 'N/D'}
• *Emisor:* ${data.issuing_organization || 'N/D'}
• *Media Payment ID:* ${data.media_payment_id || 'N/D'}
      `;

      bot.sendMessage(chatId, mensaje.trim(), { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Error al consultar BIN:', error.message);
      bot.sendMessage(chatId, '❌ Ocurrió un error al consultar el BIN.');
    }
  }
};

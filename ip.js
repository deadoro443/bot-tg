const axios = require('axios');

module.exports = {
  name: 'ip',
  description: 'Consulta información de una dirección IP.',
  async execute(bot, msg, ip) {
    const chatId = msg.chat.id;

    if (!ip || typeof ip !== 'string' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar una IP válida. Ejemplo: /ip 179.23.198.200');
    }

    const url = `https://ipwho.is/${ip}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      if (!data.success) {
        return bot.sendMessage(chatId, `❌ IP no encontrada o inválida: ${ip}`);
      }

      const mensaje = `
🌐 *IP:* \`${data.ip}\`
${data.flag.emoji} *País:* ${data.country} (${data.country_code})
🏙️ *Ciudad:* ${data.city}, ${data.region}
🛰️ *ISP:* ${data.connection.isp}
🏢 *Organización:* ${data.connection.org}
🕓 *Zona horaria:* ${data.timezone.id} (${data.timezone.utc})
📍 *Ubicación:* [Ver en mapa](https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude})
      `;

      bot.sendMessage(chatId, mensaje.trim(), { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Error al consultar IP:', error.message);
      bot.sendMessage(chatId, '❌ Ocurrió un error al consultar la IP.');
    }
  }
};

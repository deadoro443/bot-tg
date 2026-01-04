const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'licencia',
  async execute(bot, msg, dni, sexo = 'M') {
    const chatId = msg.chat.id;

    if (!dni || !['M', 'F'].includes(sexo.toUpperCase())) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI y sexo (M/F) Ejemplo: 12345678 M');
    }

    try {
      const url = `https://fiscalizar.seguridadvial.gob.ar/api/licencias?numeroDocumento=${dni}&sexo=${sexo.toUpperCase()}`;
      console.log('🔍 Request a:', url);

      const res = await axios.get(url);
      const licencias = res.data;

      if (!Array.isArray(licencias) || licencias.length === 0) {
        return bot.sendMessage(chatId, '❌ No se encontraron licencias para este DNI.');
      }

      // Consumir token si hay licencia encontrada
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 1);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles.');
      }

      const licencia = licencias[0];

      let mensaje = `🪪 *Licencia encontrada para DNI ${dni}*\n\n`;
      mensaje += `» *Nombre:* ${licencia.nombre} ${licencia.apellido}\n`;
      mensaje += `» *Nacimiento:* ${licencia.fechaNacimiento.split('T')[0]}\n`;
      mensaje += `» *Emisión:* ${licencia.fechaEmision.split('T')[0]}\n`;
      mensaje += `» *Vencimiento:* ${licencia.fechaVencimiento.split('T')[0]}\n`;
      mensaje += `» *Lugar de emisión:* ${licencia.lugarEmision}, ${licencia.provincia}\n`;
      mensaje += `» *Clase:* ${licencia.clasesCodigos}\n`;
      mensaje += `» *Principiante:* ${licencia.principiante ? 'Sí' : 'No'}\n`;
      mensaje += `» *Observaciones:* ${licencia.observacionesEnLicencia || '-'}`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });

    } catch (err) {
      console.error('❌ Error al consultar licencia:', err.message || err);
      bot.sendMessage(chatId, '❌ Ocurrió un error al consultar la licencia.');
    }
  }
};

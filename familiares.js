const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');
const config = require('../config.json');

module.exports = {
  name: 'familiares',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI Ejemplo: 12345678');
    }

    try {
      // Realizar la solicitud a la API primero sin consumir el token
      const url = `${config.api_url}/familia/dni=${dni}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta de la API es válida
      if (!rawData || typeof rawData !== 'string') {
        return bot.sendMessage(chatId, '❌ Respuesta inválida de la API.');
      }

      if (rawData.includes('"error"')) {
        return bot.sendMessage(chatId, `❌ ${JSON.parse(rawData).error}`);
      }

      // Verificar si hay un "Nombre:" en la respuesta (solo así se consume el token)
      if (!rawData.includes('Nombre:')) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos para el DNI proporcionado.');
      }

      // Ahora que sabemos que la respuesta contiene "Nombre:", consumimos los tokens
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Separar los datos del titular y las personas relacionadas
      const partes = rawData.split("PERSONAS RELACIONADAS");
      const datosTitular = partes[0]?.trim();
      const relacionadasRaw = partes[1]?.trim();

      // Construcción del mensaje para enviar al usuario
      let mensaje = datosTitular
        .replace(/> Nombre:/g, '» *Nombre:*')
        .replace(/> DNI:/g, '» *DNI:*')
        .replace(/> Edad:/g, '» *Edad:*')
        .replace(/> Fecha de Nacimiento:/g, '» *Nacimiento:*')
        .replace(/> Domicilios:/g, '» *Domicilios:*')
        .replace(/> Municipio:/g, '» *Municipio:*')
        .replace(/> Provincia:/g, '» *Provincia:*')
        .replace(/> Telefonos:/g, '» *Teléfonos:*');

      if (relacionadasRaw) {
        const relacionadas = relacionadasRaw.split(/\n(?=> Nombre:)/g);
        for (const rel of relacionadas) {
          const personaRel = rel.trim();
          mensaje += "\n\n• *Persona Relacionada*\n" +
            personaRel
              .replace(/> Nombre:/g, '» *Nombre:*')
              .replace(/> DNI:/g, '» *DNI:*')
              .replace(/> Edad:/g, '» *Edad:*')
              .replace(/> Fecha de Nacimiento:/g, '» *Nacimiento:*')
              .replace(/> Domicilios:/g, '» *Domicilios:*')
              .replace(/> Municipio:/g, '» *Municipio:*')
              .replace(/> Provincia:/g, '» *Provincia:*')
              .replace(/> Telefonos:/g, '» *Teléfonos:*');
        }
      }

      // Enviar solo el mensaje con los datos
      await bot.sendMessage(chatId, mensaje, { parse_mode: "Markdown" });

    } catch (error) {
      console.error('❌ Error en el comando DNI:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda.');
    }
  }
}

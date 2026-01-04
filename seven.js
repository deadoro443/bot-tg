// commands/seven.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'seven',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;
    const sexo = 'M'; // Podrías pedirlo al usuario también

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI. Ejemplo: 12345678');
    }

    try {
      const url = `http://localhost:8011/buscar_dni/${dni}/${sexo}`;
      console.log('🔍 Request a:', url);
      const res = await axios.get(url);
      const rawData = res.data;

      if (!rawData || rawData.error) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos.');
      }
      if (!rawData.pdf_path) {
        return bot.sendMessage(chatId, '❌ No se generó un reporte para este DNI.');
      }

      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens.');
      }

      await bot.sendMessage(chatId, '📄 Generando el reporte...');

      const filePath = rawData.pdf_path;

      if (fs.existsSync(filePath)) {
        await bot.sendDocument(chatId, filePath);
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ PDF eliminado: ${filePath}`);
          }
        }, 30000);
      } else {
        bot.sendMessage(chatId, '❌ No se encontró el archivo PDF.');
      }

    } catch (error) {
      console.error('❌ Error en comando seven:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error en la búsqueda.');
    }
  }
};

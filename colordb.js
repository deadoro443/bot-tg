const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'colordb',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni || isNaN(dni)) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI válido. Ejemplo: /colordb 12345678');
    }

    await bot.sendMessage(chatId, '🔍 Buscando foto en la base de datos local...');

    // Ruta donde están las fotos
    const carpetaFotos = 'C:\\Users\\Administrator\\Desktop\\fotos';

    // Extensiones posibles
    const extensiones = ['.jpg', '.jpeg', '.png'];

    try {
      let encontrada = false;
      let fotoPath;

      for (const ext of extensiones) {
        fotoPath = path.join(carpetaFotos, `${dni}${ext}`);

        if (fs.existsSync(fotoPath)) {
          const stats = fs.statSync(fotoPath);

          if (stats.size === 0) {
            return bot.sendMessage(chatId, `⚠️ El archivo para el DNI ${dni} está vacío.`);
          }

          encontrada = true;
          break;
        }
      }

      if (encontrada) {
        // Verificamos tokens solo si se encontró una foto
        const tieneTokens = await checkAndConsumeToken(chatId.toString(), 4);
        if (!tieneTokens) {
          return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
        }

        const stream = fs.createReadStream(fotoPath);
        await bot.sendPhoto(chatId, stream, { caption: `📸 Foto encontrada para DNI ${dni}` });
      } else {
        await bot.sendMessage(chatId, `❌ No se encontró ninguna foto para el DNI ${dni}.`);
      }

    } catch (err) {
      console.error('❌ Error en /colordb:', err.message || err);
      await bot.sendMessage(chatId, '❌ Hubo un error al intentar buscar la foto.');
    }
  }
};
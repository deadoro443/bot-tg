const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'dnrpa2',
  async execute(bot, msg, ...args) {
    const chatId = msg.chat.id;
    const patente = args.join(' ').trim().toUpperCase();

    if (!patente || !/^[A-Z0-9]+$/.test(patente)) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar una patente Ejemplo: /dnrpa2 DPY373');
    }

    try {
      const waitingMsg = await bot.sendMessage(chatId, `🔍 Buscando datos de la patente *${patente}*...`, { parse_mode: 'Markdown' });

      const apiUrl = `http://127.0.0.1:8124/buscar_patente/${patente}`;
      const { data } = await axios.get(apiUrl);

      const pdfPath = data?.pdf_path;
      const tieneDatos = data?.datos && Object.keys(data.datos).length > 0;

      // Solo si hay PDF o datos válidos, se consumen tokens
      if (pdfPath || tieneDatos) {
        const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
        if (!tieneTokens) {
          await bot.deleteMessage(chatId, waitingMsg.message_id);
          return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
        }
      }

      await bot.deleteMessage(chatId, waitingMsg.message_id);

      // Si hay PDF, intentamos enviarlo
      if (pdfPath) {
        const absolutePath = path.isAbsolute(pdfPath)
          ? pdfPath
          : path.resolve('C:/Users/Administrator/Desktop/work', pdfPath);

        if (fs.existsSync(absolutePath)) {
          return await bot.sendDocument(chatId, absolutePath);
        } else {
          await bot.sendMessage(chatId, '⚠️ No se pudo encontrar el PDF generado en la ruta esperada.');
        }
      }

      // Si hay datos, se muestran
      if (tieneDatos) {
        let texto = `🧾 *Resultado para la patente ${patente}:*\n\n`;

        for (const [clave, valor] of Object.entries(data.datos)) {
          texto += `*${clave}:* ${valor}\n`;
        }

        return await bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
      }

      // Si no hay nada útil, se informa al usuario
      await bot.sendMessage(chatId, `⚠️ No se encontraron datos para la patente *${patente}* y no se generó un PDF.`);

    } catch (error) {
      console.error('Error en /dnrpa2:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al procesar la patente. Intentá nuevamente más tarde.');
    }
  }
};

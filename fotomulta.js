const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');

const DNI_USUARIO = "27060045";       // Definilo acá o cargalo de config
const TRAMITE_USUARIO = "00629197615";

module.exports = {
  name: 'fotomulta',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    if (typeof args === 'string') {
      args = args.trim().split(/\s+/);
    }

    console.log('args recibidos:', args);

    if (!args || args.length === 0) {
      return bot.sendMessage(chatId, '⚠️ Debes enviar la patente. Ejemplo: /fotomulta IOL603');
    }

    const patente = String(args[0]).toUpperCase();

    if (patente.length < 3) {
      return bot.sendMessage(chatId, '⚠️ La patente parece inválida. Debe tener al menos 3 caracteres. Ejemplo válido: IOL603');
    }

    try {
      const url = `http://localhost:5003/buscar?dni=${DNI_USUARIO}&tramite=${TRAMITE_USUARIO}&patente=${encodeURIComponent(patente)}`;
      console.log('🔍 Haciendo request a:', url);

      await bot.sendMessage(chatId, '⏳ Procesando tu consulta, por favor espera...');

      await axios.get(url);

      const DOWNLOAD_DIR = 'C:\\Users\\Administrator\\Desktop\\fotomulta\\pdfs';
      const fileName = `${patente}_fotomulta.pdf`;
      const filePath = path.join(DOWNLOAD_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        return bot.sendMessage(chatId, '❌ No se encontró el archivo PDF generado. Intentá nuevamente más tarde.');
      }

      // Consumir tokens solo si el PDF existe y se va a enviar
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens. Comprá más para seguir usando el bot.');
      }

      await bot.sendMessage(chatId, '📄 PDF listo, enviando PDF...');
      await bot.sendDocument(chatId, filePath);

    } catch (error) {
      console.error('❌ Error en el comando fotomulta:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda o enviar el PDF.');
    }
  }
};

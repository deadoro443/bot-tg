const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'sisa',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI Ejemplo: 44444444');
    }

    const pdfPath = path.join('C:/Users/Administrator/Desktop/SISA/pdfs', `informe_${dni}.pdf`);

    // Avisar que está generando el informe
    const loadingMessage = await bot.sendMessage(chatId, '⏳ Generando informe, esto puede tardar hasta 1 minuto...');

    try {
      // Llamar a la API local
      await axios.get(`http://127.0.0.1:7090/buscar/${dni}`);
    } catch (err) {
      console.error('Error al hacer la request a la API:', err.message);
      await bot.editMessageText('❌ Error al consultar la API de SISA.', {
        chat_id: chatId,
        message_id: loadingMessage.message_id
      });
      return;
    }

    // Esperar hasta 60 segundos a que se genere el PDF
    let pdfExists = false;
    for (let i = 0; i < 60; i++) {
      if (fs.existsSync(pdfPath)) {
        pdfExists = true;
        break;
      }
      await new Promise(res => setTimeout(res, 1000));
    }

    if (!pdfExists) {
      await bot.editMessageText('❌ No se pudo generar el PDF. Puede que el DNI no exista o el sitio no respondió.', {
        chat_id: chatId,
        message_id: loadingMessage.message_id
      });
      return;
    }

    // Consumir 2 tokens
    const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
    if (!tieneTokens) {
      await bot.editMessageText('❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.', {
        chat_id: chatId,
        message_id: loadingMessage.message_id
      });
      return;
    }

    // Enviar el PDF
    try {
      await bot.sendDocument(chatId, pdfPath, {}, {
        filename: `informe_${dni}.pdf`,
        contentType: 'application/pdf'
      });

      // Borrar mensaje de espera
      await bot.deleteMessage(chatId, loadingMessage.message_id);

      // Borrar el PDF después de enviarlo (opcional)
      await fsPromises.unlink(pdfPath);
    } catch (err) {
      console.error('Error al enviar el PDF:', err.message);
      await bot.editMessageText('❌ Error al enviar el PDF.', {
        chat_id: chatId,
        message_id: loadingMessage.message_id
      });
    }
  }
};

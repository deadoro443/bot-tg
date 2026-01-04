const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { checkAndConsumeToken, addTokens } = require('../utils/tokenManager');
const os = require('os');

module.exports = {
  name: 'comercial',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un CUIL válido Ejemplo: 24444444440');
    }

    if (!/^\d+$/.test(dni)) {
      return bot.sendMessage(chatId, '⚠️ El CUIL ingresado no es válido. Solo debe contener números.');
    }

    try {
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens. Comprá más para seguir usando el bot.');
      }

      await bot.sendMessage(chatId, '🔍 Solicitando el informe a comercial, por favor espera...');

      // Hacer la request a la API local
      const url = `http://127.0.0.1:7056/buscar_dni/${dni}`;
      await axios.get(url);

      // Esperar unos segundos a que el PDF se genere en la carpeta de descargas
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos

      // Ruta absoluta a la carpeta de descargas correcta
      const downloadsPath = 'C:\\Users\\Administrator\\Desktop\\multiburo\\downloads';
      const fileName = `${dni}.pdf`;
      const filePath = path.join(downloadsPath, fileName);

      if (!fs.existsSync(filePath)) {
        return bot.sendMessage(chatId, `❌ No se encontró el archivo PDF (${fileName}) en la carpeta de descargas. Asegurate de que se haya generado correctamente.`);
        let devolverToken = await addTokens(chatId.toString(), 1)
      }

      await bot.sendDocument(chatId, filePath, {
        filename: `informe_multiburo_${dni}.pdf`,
        contentType: 'application/pdf',
      });

      // Opcional: borrar después de enviar
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 30000);

    } catch (error) {
      console.error('❌ Error en comando /comercial:', error.message);
      await bot.sendMessage(chatId, '❌ Hubo un error al obtener el informe. Verificá el CUIL o intentá más tarde.');
      let devolverToken = await addTokens(chatId.toString(), 1)
    }
  }
};
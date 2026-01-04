const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'tel2',
  async execute(bot, msg, numero) {
    const chatId = msg.chat.id;

    if (!numero) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un número válido. Ejemplo: 1234567890');
    }

    let waitingMsg = null;

    try {
      // Verificar tokens al principio (sin consumirlos)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 3, true);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Mensaje de espera
      waitingMsg = await bot.sendMessage(chatId, '🔍 Buscando información del número, por favor espere...');

      // Realizar la solicitud a la API de FastAPI que consulta el número
      const url = `http://localhost:7777/consulta_celular/${numero}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta de la API es válida
      if (!rawData || rawData.error) {
        if (waitingMsg) {
          await bot.deleteMessage(chatId, waitingMsg.message_id);
        }
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos para el número proporcionado.');
      }

      // Consumir tokens si los resultados son válidos
      await checkAndConsumeToken(chatId.toString(), 3);

      // Ruta del PDF generado en el sistema
      const filePath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'WORKTEL', 'reportes', `reporte_${numero}.pdf`);

      console.log('🔍 Verificando archivo en:', filePath);

      // Verificar si el archivo existe antes de enviarlo
      if (fs.existsSync(filePath)) {
        await bot.sendDocument(chatId, filePath);

        // Elimina el archivo PDF después de 30 segundos
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ PDF eliminado automáticamente: ${filePath}`);
          }
        }, 30000);
      } else {
        bot.sendMessage(chatId, '❌ No se encontró el archivo PDF generado.');
      }

      // Eliminar el mensaje de espera
      if (waitingMsg) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
      }

    } catch (error) {
      console.error('❌ Error en el comando tel2:', error.message || error);
      if (waitingMsg) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
      }
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda para el número.');
    }
  }
};
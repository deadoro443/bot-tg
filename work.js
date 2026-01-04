const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { createPDF } = require('../utils/generatePDF');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'work',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI Ejemplo: 12345678');
    }

    try {
      // Realizar la solicitud a la API de FastAPI que consulta el DNI
      const url = `http://localhost:8001/buscar_dni/${dni}`;  // Ajusta la URL según tu FastAPI
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta de la API es válida
      if (!rawData || rawData.error) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos para el DNI proporcionado.');
      }

      // Verificar si los datos son válidos
      if (!rawData.pdf_path) {
        return bot.sendMessage(chatId, '❌ No se encontró un reporte para este DNI.');
      }

      // Consumir tokens si los resultados son válidos
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2); // Consumir 2 tokens si hay resultados
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Enviar el mensaje al usuario (sin mensaje extra)
      await bot.sendMessage(chatId, '📄 El reporte está listo. Ahora te lo enviaré en un momento.');

      // Ruta del PDF generado en el sistema
      const filePath = path.join('C:', 'Users', 'Administrator', 'Desktop', 'workdnipdf', 'reportes', `${dni}_reporte.pdf`);

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

    } catch (error) {
      console.error('❌ Error en el comando work:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda para el DNI.');
    }
  }
};

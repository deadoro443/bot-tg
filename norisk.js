const { checkAndConsumeToken, addTokens } = require('../utils/tokenManager');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'norisk',
  async execute(bot, msg, cuil) {
    const chatId = msg.chat.id;

    if (!cuil || cuil.length !== 11) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un CUIL válido. Ejemplo: /norisk 20123456780');
    }

    try {
      // Verificar tokens al principio (sin consumirlos)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 3, true);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Enviar mensaje de espera
      const waitingMessage = await bot.sendMessage(chatId, '🔍 Solicitando informe, por favor espera...');

      // Hacer la solicitud a la API local
      const url = `http://localhost:5050/consulta/${cuil}`;
      await axios.get(url);

      // Ruta del archivo PDF
      const pdfDir = 'C:\\Users\\Administrator\\Desktop\\norisk\\pdfs';
      const fileName = `informacion_${cuil}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      // Esperar a que el archivo se genere (máximo 60 segundos)
      let fileExists = false;
      for (let i = 0; i < 60; i++) {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size > 1024) { // Asegurarse de que el archivo tenga más de 1KB
            fileExists = true;
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!fileExists) {
        throw new Error('El archivo PDF no se generó correctamente en el tiempo esperado');
      }

      // Consumir tokens solo si el archivo es válido
      await checkAndConsumeToken(chatId.toString(), 3);

      // Enviar el documento
      await bot.sendDocument(chatId, filePath, {
        filename: `informenorisk_${cuil}.pdf`,
        contentType: 'application/pdf',
      });

      // Eliminar el mensaje de espera
      await bot.deleteMessage(chatId, waitingMessage.message_id);

      // Opcional: borrar el archivo después de enviarlo
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Archivo eliminado: ${filePath}`);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error en comando /norisk:', error.message);
      let errorMessage = '❌ Hubo un error al obtener el informe. Verificá el CUIL o intentá más tarde.';
      
      if (error.message === 'El archivo PDF no se generó correctamente en el tiempo esperado') {
        errorMessage = '❌ El informe no se generó correctamente. Por favor, intenta nuevamente.';
      }

      await bot.sendMessage(chatId, errorMessage);

      // Añadir 3 tokens automáticamente si la respuesta es incorrecta
      await addTokens(chatId.toString(), 3);
      await bot.sendMessage(chatId, '✅ Se han añadido 3 tokens a tu cuenta debido al error en la consulta.');
    }
  }
};
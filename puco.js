const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const config = require('../config.json');
const axios = require('axios');
const { checkAndConsumeToken, addTokens } = require('../utils/tokenManager');
const pdf = require('pdf-parse');

module.exports = {
  name: 'puco',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI. Ejemplo: /puco 12345678');
    }

    let waitingMsg = null;
    let tokenVerificado = false;

    async function handleError(errorMessage) {
      if (waitingMsg) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
      }
      await bot.sendMessage(chatId, errorMessage);
      if (tokenVerificado) {
        await addTokens(chatId.toString(), 1);
        await bot.sendMessage(chatId, '✅ Token devuelto debido a un error en el comando');
        console.log('✅ Token devuelto debido a un error');
      }
    }

    try {
      // Verificar tokens al principio (sin consumirlos)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 1, true);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }
      tokenVerificado = true;

      // Mensaje de espera
      waitingMsg = await bot.sendMessage(chatId, '🔍 Buscando información en PUCO, por favor espere...');

      const url = `http://localhost:8002/buscar_anses/${dni}`;
      console.log(`🔍 Haciendo request a: ${url}`);

      const res = await axios.get(url);
      console.log('✅ Request completado');

      // Ruta al archivo generado por la API
      const filename = `consulta_anses_${dni}.pdf`;
      const filePath = path.join('C:/Users/eth/Desktop/PUCO/pdfs', filename);
      console.log(`🔍 Buscando archivo en: ${filePath}`);

      // Esperar hasta 30 segundos para que se genere el archivo
      let fileExists = false;
      for (let i = 0; i < 30; i++) {
        if (fs.existsSync(filePath)) {
          fileExists = true;
          console.log(`✅ Archivo encontrado después de ${i + 1} segundos`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Verificar si el PDF existe
      if (!fileExists) {
        console.log('❌ El archivo no se encontró después de 30 segundos');
        return handleError('❌ No se pudo generar el reporte en PDF.');
      }

      // Verificar el contenido del PDF
      try {
        const dataBuffer = await fsPromises.readFile(filePath);
        const pdfData = await pdf(dataBuffer);
        const pdfText = pdfData.text.trim();

        if (pdfText.includes('La consulta no arrojó resultados.') || 
            pdfText.includes('INGRESA TU DOCUMENTO O CUIL/T')) {
          console.log('❌ PDF contiene mensaje de error o sin resultados');
          return handleError('❌ La consulta no arrojó resultados o el DNI ingresado es inválido.');
        }
      } catch (pdfError) {
        console.error('❌ Error al verificar el PDF:', pdfError.message);
        return handleError('❌ Error al verificar el contenido del reporte.');
      }

      // Consumir tokens solo si el PDF es válido
      await checkAndConsumeToken(chatId.toString(), 1);

      // Enviar el archivo PDF
      await bot.sendDocument(chatId, filePath);
      console.log('✅ Archivo PDF enviado con éxito');

      // Eliminar el mensaje de espera
      if (waitingMsg) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
      }

      // Borrar el archivo después de 20 segundos
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Archivo eliminado: ${filePath}`);
        }
      }, 20000);

    } catch (error) {
      console.error('❌ Error en el comando /puco:', error.message || error);
      return handleError('❌ Ocurrió un error al generar el reporte.');
    }
  }
}
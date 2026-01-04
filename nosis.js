const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { checkAndConsumeToken, addTokens } = require('../utils/tokenManager');

module.exports = {
  name: 'nosis',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    // Validaciones (mantén esta parte igual)

    try {
      // Verificar y consumir tokens (mantén esta parte igual)

      // Mensaje de espera
      await bot.sendMessage(chatId, '🔍 Aguarde un momento, estamos buscando la información solicitada...');

      // API URL
      const url = `http://127.0.0.1:7052/buscar?dni=${dni}`;
      
      // Hacer la solicitud a la API
      console.log(`Realizando solicitud a la API: ${url}`);
      const response = await axios.get(url);
      
      if (response.status !== 200) {
        throw new Error(`La API respondió con estado ${response.status}`);
      }

      // Ajustamos la ruta del archivo PDF para la nueva ubicación
      const pdfDir = 'C:\\Users\\Administrator\\Desktop\\NOSISAPI\\pdfs';
      const filePath = path.join(pdfDir, `informe_${dni}_print.pdf`);

      console.log(`Esperando que el archivo se genere en: ${filePath}`);

      // Esperamos a que el archivo esté disponible (máximo 30 segundos)
      let fileExists = false;
      for (let i = 0; i < 30; i++) {
        if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
          fileExists = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));  // Espera 1 segundo
      }

      if (!fileExists) {
        throw new Error('El archivo PDF no se generó en el tiempo esperado');
      }

      const stats = await fsPromises.stat(filePath);
      if (stats.size < 1000) {
        throw new Error('El archivo PDF generado es demasiado pequeño');
      }

      console.log(`Intentando enviar archivo: ${filePath}`);

      await bot.sendDocument(chatId, filePath, {
        filename: `informe_nosis_${dni}_print.pdf`,
        contentType: 'application/pdf',
      });

      console.log('Archivo enviado con éxito');

    } catch (error) {
      console.error('❌ Error en comando /nosis:', error.message);
      await bot.sendMessage(chatId, '❌ Hubo un error al obtener el informe. Verificá el CUIL o intentá más tarde.');
      await addTokens(chatId.toString(), 1);
    }
  }
};
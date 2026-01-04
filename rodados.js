const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { createPDF } = require('../utils/generatePDF');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'rodados',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI Ejemplo: 12345678');
    }

    try {
      // Realizar la solicitud a la API que consulta los rodados
      const url = `http://localhost:7054/rodados?dni=${dni}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      // Verificar si la respuesta de la API es válida
      if (!rawData || rawData.error) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos para el DNI proporcionado.');
      }

      // Verificar si los datos son válidos
      if (rawData.length === 0) {
        return bot.sendMessage(chatId, '❌ No se encontraron rodados asociados a este DNI.');
      }

      // Consumir tokens si los resultados son válidos
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2); // Consumir 2 tokens solo si hay resultados
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Construcción del mensaje para enviar al usuario
      let textoPDF = `📄 Consulta DNI: ${dni}\n\n`;
      let mensaje = `🚗 Información de rodados asociados al DNI ${dni}:\n\n`;

      rawData.forEach((item, index) => {
        textoPDF += `Rodado #${index + 1}:\n`;
        textoPDF += `Tipo: ${item.Tipo}\n`;
        textoPDF += `Número: ${item.Numero}\n`;
        textoPDF += `Fecha de Emisión: ${item.FechaDeEmision}\n`;
        textoPDF += `Dominio: ${item.Dominio}\n`;
        textoPDF += `Clase: ${item.Clase}\n`;
        textoPDF += `Marca: ${item.Marca}\n`;
        textoPDF += `Modelo: ${item.Modelo}\n`;
        textoPDF += `Año: ${item.Año}\n\n`;

        mensaje += `📝 *Rodado #${index + 1}*\n` +
          `*Tipo:* ${item.Tipo}\n` +
          `*Número:* ${item.Numero}\n` +
          `*Fecha de Emisión:* ${item.FechaDeEmision}\n` +
          `*Dominio:* ${item.Dominio}\n` +
          `*Clase:* ${item.Clase}\n` +
          `*Marca:* ${item.Marca}\n` +
          `*Modelo:* ${item.Modelo}\n` +
          `*Año:* ${item.Año}\n` +
          '--------------------------\n';
      });

      // Generar el archivo PDF con los datos
      const filename = `consulta_rodados_${dni}_${Date.now()}.pdf`;
      const tempDir = path.join(__dirname, '..', 'temp');
      const filePath = path.join(tempDir, filename);

      // Asegura que el directorio "temp" exista
      if (!fs.existsSync(tempDir)) {
        await fsPromises.mkdir(tempDir);
      }

      // Crear el PDF
      await createPDF(textoPDF, filePath);

      // Enviar el mensaje al usuario y el PDF
      await bot.sendMessage(chatId, mensaje, { parse_mode: "Markdown" });
      await bot.sendDocument(chatId, filePath);

      // Elimina el archivo PDF después de 30 segundos
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error en el comando rodados:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda de rodados.');
    }
  }
}

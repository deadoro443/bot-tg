const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'renaperrrrrrrrr',
  async execute(bot, msg, dni, sexo) {
    const chatId = msg.chat.id;

    if (!dni || !sexo || !['M', 'F'].includes(sexo.toUpperCase())) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI y sexo (M/F) Ejemplo: 44444444 F');
    }

    // Enviar mensaje inicial de espera
    await bot.sendMessage(chatId, '🔎 Aguarde, estamos realizando la búsqueda...');

    try {
      const url = `http://127.0.0.1:2250/renaper/${dni}/${sexo.toUpperCase()}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      if (rawData.error) {
        return bot.sendMessage(chatId, `❌ ${rawData.error}`);
      }

      if (!rawData.apellido || !rawData.cuil) {
        return bot.sendMessage(chatId, '❌ No se encontraron datos válidos para el DNI proporcionado.');
      }

      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 4);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      const mensaje = `
» Nombre: ${rawData.nombres || '-'} ${rawData.apellido || '-'}
» CUIL: ${rawData.cuil || '-'}
» ID Ciudadano: ${rawData.id_ciudadano || '-'}
» Trámite Principal: ${rawData.id_tramite_principal || '-'}
» Origen Fallecido: ${rawData.origen_fallecido || '-'}
» Mensaje Fallecido: ${rawData.mensaje_fallecido || '-'}

» Fecha de Nacimiento: ${rawData.fecha_nacimiento || '-'}
» Fecha de Emisión: ${rawData.fecha_emision || '-'}
» Fecha de Vencimiento: ${rawData.fecha_vencimiento || '-'}
» Ejemplar: ${rawData.ejemplar || '-'}
» Sexo: ${rawData.sexo || '-'}

» Domicilio: ${rawData.calle || '-'} ${rawData.numero || ''} ${rawData.monoblock || ''} ${rawData.barrio || ''} ${rawData.piso || ''}
» Municipio: ${rawData.municipio || '-'}
» Provincia: ${rawData.provincia || '-'}
» País: ${rawData.pais || '-'}
» Código Postal: ${rawData.codigo_postal || '-'}
      `.trim();

      const tempDir = path.join(__dirname, '..', 'temp');

      if (rawData.foto) {
        const imgPath = path.join(tempDir, `foto_${dni}.jpg`);
        const imgBuffer = Buffer.from(rawData.foto, 'base64');

        if (!fs.existsSync(tempDir)) {
          await fsPromises.mkdir(tempDir);
        }

        await fsPromises.writeFile(imgPath, imgBuffer);
        await bot.sendPhoto(chatId, imgPath);

        // Eliminar imagen tras 30 segundos
        setTimeout(() => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, 30000);
      }

      await bot.sendMessage(chatId, mensaje);

      // Ahora generamos y enviamos el código PDF417
      const pdfFilename = path.join(tempDir, `${dni}_pdf417.png`);
      const pdf417Code = `00${rawData.cuil}@${rawData.apellido}@${rawData.nombres}@${rawData.sexo}@${dni}@${rawData.fecha_nacimiento}@${rawData.fecha_vencimiento}`;

      // Asumiendo que tienes la función de generación de imagen PDF417
      await generate_pdf417_image(pdf417Code, pdfFilename);

      // Enviar la imagen PDF417
      await bot.sendPhoto(chatId, pdfFilename);

      // Eliminar la imagen tras 30 segundos
      setTimeout(() => {
        if (fs.existsSync(pdfFilename)) fs.unlinkSync(pdfFilename);
      }, 30000);

    } catch (error) {
      console.error('❌ Error en el comando renaper:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda.');
    }
  }
};

// Aquí generamos el código PDF417 usando la función que tienes para generar imágenes
async function generate_pdf417_image(pdf417Code, filename) {
  const { generatePDF417Image } = require('../utils/pdf_utils');  // Asegúrate de que la función esté en utils/pdf_utils.js
  await generatePDF417Image(pdf417Code, filename);  // Llama a la función de generación
}

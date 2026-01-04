const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'renaperrrrrsds',
  async execute(bot, msg, dni, sexo = 'M') {
    const chatId = msg.chat.id;

    if (!dni || !['M', 'F'].includes(sexo.toUpperCase())) {
      return bot.sendMessage(chatId, '⚠️ Uso correcto: /renaper <dni> <M/F>\nEjemplo: /foto 10000002 M');
    }

    try {
      const waitingMsg = await bot.sendMessage(chatId, '🔍 Consultando información... Por favor espere.');

      const url = `http://localhost:7894/renaper?dni=${dni}&sexo=${sexo.toUpperCase()}`;
      console.log('🔍 Request a:', url);

      const res = await axios.get(url);
      const data = res.data || {};

      // Validar si hay datos útiles
      if (!data.nombre) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
        return bot.sendMessage(chatId, '❌ No se encontró información válida para este DNI.');
      }

      // Solo en este punto se consumen los tokens
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 5);
      if (!tieneTokens) {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // ================================
      // Foto: base64
      // ================================
      let imageData = null;
      let imageFormat = 'jpg';

      if (data?.foto_base64) {
        imageData = data.foto_base64;
      } else if (data?.foto_url) {
        imageData = data.foto_url.replace(/^data:image\/\w+;base64,/, '');
        if (data.foto_url.includes('image/png')) imageFormat = 'png';
      }

      // ================================
      // Datos solicitados
      // ================================
      const dir = data.direccionReal || {};

      const texto = `📋 *Datos del DNI ${dni} (${sexo.toUpperCase()})*\n\n` +
        `👤 *Nombre:* ${data.nombre || 'N/D'}\n` +
        `   • *Apellido:* ${data.apellido || 'N/D'}\n` +
        `   • *Fecha de Nacimiento:* ${data.fecha_nacimiento || 'N/D'}\n` +
        `   • *Edad:* ${data.edad || 'N/D'}\n\n` +
        `📍 *Domicilio:*\n` +
        `   • *País:* ${dir.pais || 'ARGENTINA'}\n` +
        `   • *Provincia:* ${dir.provincia || 'N/D'}\n` +
        `   • *Localidad:* ${dir.localidad || 'N/D'}\n` +
        `   • *Municipio:* ${dir.municipio || 'N/D'}\n` +
        `   • *Código Postal:* ${dir.codigoPostal || 'N/D'}\n` +
        `   • *Calle:* ${dir.calle || 'N/D'} ${dir.numero || ''}\n` +
        `   • *Otros:* ${dir.otros || 'N/D'}`;

      // ================================
      // Enviar foto y datos
      // ================================
      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const tempFilePath = path.join(__dirname, '..', 'temp', `foto_${dni}.${imageFormat}`);
        if (!fs.existsSync(path.dirname(tempFilePath))) {
          fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
        }
        fs.writeFileSync(tempFilePath, imageBuffer);

        await bot.deleteMessage(chatId, waitingMsg.message_id);
        await bot.sendPhoto(chatId, tempFilePath, { caption: texto, parse_mode: 'Markdown' });

        setTimeout(() => {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`✅ Archivo eliminado: ${tempFilePath}`);
          }
        }, 30000);
      } else {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
        return bot.sendMessage(chatId, '❌ No se pudo obtener la foto para este DNI.');
      }

    } catch (err) {
      console.error('❌ Error en /foto:', err.message || err);
      bot.sendMessage(chatId, '❌ Ocurrió un error al obtener la información. Intente nuevamente más tarde.');
    }
  }
};


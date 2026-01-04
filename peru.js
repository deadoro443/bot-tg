const { checkAndConsumeToken, addTokens } = require('../utils/tokenManager');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'peru',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;
    const dni = args[0];

    if (!dni || dni.length !== 8 || isNaN(dni)) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI válido de 8 dígitos. Ejemplo: /peru 60693780');
    }

    try {
      // Verificar tokens (modo simulación primero)
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2, true);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens. Comprá más para seguir usando el bot.');
      }

      const waitingMessage = await bot.sendMessage(chatId, '🔍 Consultando base de datos peruana...');

      const url = `http://161.132.45.146:5940/random2/${dni}`;
      const response = await axios.get(url);

      if (response.data.codigo_respuesta !== '0000') {
        throw new Error('La API no devolvió resultados válidos');
      }

      const p = response.data.data;
      const texto = `
🧾 *Datos del DNI ${dni} (Perú)*

👤 *Nombre:* ${p.Nombres || 'Sin datos'}
🧔 *Padre:* ${p.Padre || 'Sin datos'}
👩 *Madre:* ${p.Madre || 'Sin datos'}
🧬 *Sexo:* ${p.Sexo || 'Sin datos'}

🎂 *Nacimiento:* ${p["Fecha Nac."] || 'Sin datos'}
🆔 *Inscripción:* ${p["Fecha de Inscripción"] || 'Sin datos'}
🕒 *Expedición:* ${p["Fecha Expedición"] || 'Sin datos'}

🏠 *Dirección:* ${p["Dirección"] || 'Sin datos'}
🌎 *Ubigeo:* ${p.Ubigeo || 'Sin datos'}
🏘️ *Urbanización:* ${p.Urbanización || 'Sin datos'}

📄 *Estado Civil:* ${p["Estado Civil"] || 'Sin datos'}
🔐 *Restricciones:* ${p.Restricciones || 'Sin datos'}
      `;

      // Consumir tokens ahora que la consulta fue exitosa
      await checkAndConsumeToken(chatId.toString(), 2);

      // Enviar datos
      await bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });

      // Enviar foto si está
      const foto = response.data.foto;
      if (foto) {
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempPath = path.join(tempDir, `foto_${dni}.jpg`);
        fs.writeFileSync(tempPath, Buffer.from(foto, 'base64'));

        await bot.sendPhoto(chatId, tempPath, { caption: `📸 Foto del DNI ${dni}` });

        // Borrar foto luego de 30 segundos
        setTimeout(() => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }, 30000);
      }

      // Borrar mensaje de espera
      await bot.deleteMessage(chatId, waitingMessage.message_id);

    } catch (error) {
      console.error('❌ Error en comando /peru:', error.message);

      await bot.sendMessage(chatId, '❌ Hubo un error al obtener los datos. Intentá más tarde o verifica el DNI.');
      
      // Reintegro automático de tokens
      await addTokens(chatId.toString(), 2);
      await bot.sendMessage(chatId, '✅ Se reintegraron 2 tokens debido al fallo en la consulta.');
    }
  }
};

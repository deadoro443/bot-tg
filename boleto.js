const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'boleto',
  async execute(bot, msg, ...args) {
    const chatId = msg.chat.id;
    const params = args.join(' ').trim().split(' ');

    // Validar que se proporcionen todos los parámetros
    if (params.length !== 3) {
      return bot.sendMessage(chatId, 
        '⚠️ Debes proporcionar DNI, CUIL y fecha de nacimiento.\n' +
        '📝 Ejemplo: /boleto 12345678 20123456789 15/05/2000'
      );
    }

    const [dni, cuil, fechaNacimiento] = params;

    // Validar formato DNI
    if (!dni || !/^\d{7,8}$/.test(dni)) {
      return bot.sendMessage(chatId, '⚠️ DNI inválido. Debe contener 7 u 8 dígitos.');
    }

    // Validar formato CUIL
    if (!cuil || !/^\d{11}$/.test(cuil)) {
      return bot.sendMessage(chatId, '⚠️ CUIL inválido. Debe contener 11 dígitos sin guiones.');
    }

    // Validar formato fecha
    if (!fechaNacimiento || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaNacimiento)) {
      return bot.sendMessage(chatId, '⚠️ Fecha inválida. Usar formato DD/MM/YYYY (ej: 15/05/2000).');
    }

    try {
      const waitingMsg = await bot.sendMessage(chatId, 
        `🔍 Buscando boleto estudiantil para DNI *${dni}*...`, 
        { parse_mode: 'Markdown' }
      );

      const apiUrl = `http://127.0.0.1:5020/backend/api/2/consultar`;
      const { data } = await axios.get(apiUrl, {
        params: {
          dni: dni,
          cuil: cuil,
          fecha_nacimiento: fechaNacimiento,
          tipo_documento: 'F'
        },
        timeout: 30000 // 30 segundos timeout
      });

      // Si hay foto (respuesta exitosa), consumir tokens
      if (data?.foto) {
        const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
        if (!tieneTokens) {
          await bot.deleteMessage(chatId, waitingMsg.message_id);
          return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
        }
      }

      await bot.deleteMessage(chatId, waitingMsg.message_id);

      // Enviar la foto del boleto
      if (data?.foto) {
        const imageBuffer = Buffer.from(data.foto, 'base64');
        
        return await bot.sendPhoto(chatId, imageBuffer, {
          caption: `🎫 *Boleto Estudiantil*\n\n` +
                   `👤 DNI: ${dni}\n` +
                   `📋 CUIL: ${cuil}\n` +
                   `📅 Fecha: ${fechaNacimiento}`,
          parse_mode: 'Markdown'
        });
      }

      // Si no hay foto, algo salió mal
      await bot.sendMessage(chatId, `⚠️ No se pudo obtener el boleto para el DNI *${dni}*.`);

    } catch (error) {
      console.error('Error en /boleto:', error);
      
      // Eliminar mensaje de espera si existe
      try {
        await bot.deleteMessage(chatId, waitingMsg.message_id);
      } catch (deleteError) {
        // Ignorar error al eliminar mensaje
      }

      // Manejar errores específicos
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error;
        
        if (status === 404) {
          return bot.sendMessage(chatId, 
            `❌ No se encontró boleto estudiantil para el DNI *${dni}*.\n` +
            `Verificá que los datos sean correctos.`, 
            { parse_mode: 'Markdown' }
          );
        } else if (status === 400) {
          return bot.sendMessage(chatId, 
            `⚠️ Error en los parámetros: ${errorMsg || 'Datos inválidos'}`
          );
        } else if (status === 500) {
          return bot.sendMessage(chatId, 
            '❌ Error interno del servidor. Intentá nuevamente más tarde.'
          );
        }
      }

      // Error genérico
      bot.sendMessage(chatId, '❌ Ocurrió un error al consultar el boleto. Intentá nuevamente más tarde.');
    }
  }
};
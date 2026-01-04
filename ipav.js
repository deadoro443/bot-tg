const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

function convertirFecha(inputFecha) {
  if (!inputFecha) return '000000';
  try {
    const fecha = new Date(inputFecha);
    return isNaN(fecha.getTime()) ? '000000' : fecha.toISOString().slice(2,10).replace(/-/g, '');
  } catch (error) {
    console.error('Error al convertir fecha:', error);
    return '000000';
  }
}

function checkDigit(s) {
  const m = [7, 3, 1];
  let n = 0;

  for (let i = 0; i < s.length; i++) {
    if (/\d/.test(s[i])) {
      n += parseInt(s[i]) * m[i % 3];
    } else {
      return -1;
    }
  }

  return n % 10;
}

function quitarAcentos(cadena) {
  return (cadena || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function generarIdarg(dni, apellido, nombres, fechaNacimiento, sexo, fechaVencimiento) {
  fechaNacimiento = convertirFecha(fechaNacimiento);
  fechaVencimiento = convertirFecha(fechaVencimiento);
  
  const digitoVerificador1 = checkDigit(dni.toString());
  const digitoVerificador2 = checkDigit(fechaNacimiento);
  const digitoVerificador3 = checkDigit(fechaVencimiento);
  const digitoVerificador4 = checkDigit(`${dni}0${digitoVerificador1}${fechaNacimiento}${digitoVerificador2}${fechaVencimiento}${digitoVerificador3}`);
  
  let linea1 = `IDARG${dni}<${digitoVerificador1}`;
  let linea2 = `${fechaNacimiento}${digitoVerificador2}${sexo.toUpperCase()}${fechaVencimiento}${digitoVerificador3}ARG<<<<<<<<<<<${digitoVerificador4}`;
  let linea3 = `${quitarAcentos(apellido)}<<${quitarAcentos(nombres.replace(/ /g, '<'))}`;

  linea1 = linea1.padEnd(30, '<');
  linea2 = linea2.padEnd(30, '<');
  linea3 = linea3.padEnd(30, '<');

  return `${linea1}\n${linea2}\n${linea3}`;
}

module.exports = {
  name: 'renaper2',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    const fullArgs = Array.isArray(args) ? args : (msg.text || '').split(/\s+/).slice(1);

    if (fullArgs.length < 2) {
      return bot.sendMessage(chatId, '⚠️ Uso correcto: /renaper2 <dni> <sexo>\nEjemplo: /renaper2 12345678 M');
    }

    const dni = fullArgs[0];
    const sexo = fullArgs[1].toUpperCase();

    if (!['M', 'F'].includes(sexo)) {
      return bot.sendMessage(chatId, '⚠️ El sexo debe ser M o F');
    }

    let waitingMsg;
    let processingMsg;
    try {
      waitingMsg = await bot.sendMessage(chatId, '🔍 Consultando información... Por favor espere.');

      const url = `http://localhost:3005/rn/${dni}/${sexo}`;
      console.log('🔍 Haciendo request a:', url);

      const response = await axios.get(url);
      const data = response.data;

      // Nuevo mensaje de espera después de recibir la respuesta
      processingMsg = await bot.sendMessage(chatId, '⏳ Información recibida. Procesando datos...');

      if (!data || !data.datos || Object.keys(data.datos).length === 0) {
        throw new Error('No se encontraron datos para el DNI y sexo proporcionados.');
      }

      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        throw new Error('No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      let mensaje = `📋 *Información RENAPER para el DNI ${dni} (${sexo})*\n\n`;
      const personData = data.datos;
      const datosR = personData.datosR || {};

      mensaje += `*Datos Personales:*\n`;
      mensaje += `• Nombre completo: ${personData.nombreCompleto || 'N/D'}\n`;
      mensaje += `• Apellido: ${personData.apellido || 'N/D'}\n`;
      mensaje += `• Nombre: ${personData.nombre || 'N/D'}\n`;
      mensaje += `• CUIL: ${personData.cuil || 'N/D'}\n`;
      mensaje += `• DNI: ${personData.nroDoc || 'N/D'}\n`;
      mensaje += `• Sexo: ${personData.sexo || 'N/D'}\n`;
      mensaje += `• Fecha de nacimiento: ${personData.fechaNac || personData.fechaNacTxt || 'N/D'}\n\n`;

      mensaje += `*Dirección:*\n`;
      mensaje += `• Calle: ${personData.calle || 'N/D'}\n`;
      mensaje += `• Número: ${personData.nro || 'N/D'}\n`;
      mensaje += `• Ciudad: ${personData.ciudad || 'N/D'}\n`;
      mensaje += `• Provincia: ${personData.provincia || 'N/D'}\n`;
      mensaje += `• País: ${personData.pais || 'N/D'}\n`;
      mensaje += `• Código Postal: ${datosR.cpostal || 'N/D'}\n\n`;

      if (datosR.mensaf) {
        mensaje += `*Estado:* ${datosR.mensaf}\n\n`;
      }

      mensaje += `*Datos Adicionales:*\n`;
      mensaje += `• Departamento: ${datosR.departamento || 'N/D'}\n`;
      mensaje += `• Piso: ${datosR.piso || 'N/D'}\n`;

      const idarg = generarIdarg(
        personData.nroDoc,
        personData.apellido,
        personData.nombre,
        personData.fechaNac || personData.fechaNacTxt,
        personData.sexo,
        datosR.fechaVencimiento || '2030/01/01'
      );

      mensaje += `\n*IDARG:*\n\`\`\`\n${idarg}\n\`\`\`\n`;

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('❌ Error en el comando renaper2:', error);
      let errorMessage = 'Hubo un error al procesar la información. Por favor, intente nuevamente más tarde.';
      if (error.response) {
        errorMessage = `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      bot.sendMessage(chatId, `❌ ${errorMessage}`);
    } finally {
      // Eliminar los mensajes de espera
      if (waitingMsg) {
        try {
          await bot.deleteMessage(chatId, waitingMsg.message_id);
        } catch (deleteError) {
          console.error('Error al eliminar mensaje de espera inicial:', deleteError);
        }
      }
      if (processingMsg) {
        try {
          await bot.deleteMessage(chatId, processingMsg.message_id);
        } catch (deleteError) {
          console.error('Error al eliminar mensaje de procesamiento:', deleteError);
        }
      }
    }
  }
};
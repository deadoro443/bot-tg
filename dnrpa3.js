const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'patente',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    console.log('Argumentos recibidos en /patente:', args);

    let dominio;
    if (typeof args === 'string') {
      dominio = args.toUpperCase().trim();
    } else if (Array.isArray(args)) {
      dominio = args.join('').toUpperCase().trim();
    } else {
      return bot.sendMessage(chatId, '❌ Formato de dominio inválido. Ejemplo: /patente UWU666');
    }

    if (!dominio) {
      return bot.sendMessage(chatId, '❌ Debes ingresar un dominio. Ejemplo: /patente UWU666');
    }

    console.log('Dominio para consulta:', dominio);

    const base_url = 'https://gap.seguridadciudad.gob.ar';
    const username = '22493542';
    const password = 'Matanza1337';

    const url = `http://localhost:7003/consultar_dominio?base_url=${encodeURIComponent(base_url)}&username=${username}&password=${password}&dominio=${dominio}`;

    try {
      await bot.sendMessage(chatId, '🔍 Consultando información solicitada...');

      const response = await axios.get(url);
      const data = response.data;

      console.log('Respuesta completa de la API:', JSON.stringify(data, null, 2));

      const datosVehiculo = data?.Respuesta?.InformacionRegistral?.Dominio?.DatosVehiculo;
      const titular = data?.Respuesta?.InformacionRegistral?.Dominio?.Titulares?.Titular;

      if (!datosVehiculo || !datosVehiculo.c_dominio) {
        return bot.sendMessage(chatId, '⚠️ No se encontraron datos registrales para este dominio.');
      }

      // Verificar y consumir tokens antes de enviar la información
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 2);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      let mensaje = `🚗 *Datos Registrales del Dominio ${datosVehiculo.c_dominio}*\n`;
      mensaje += `Marca: ${datosVehiculo.mca_autom || 'No disponible'}\n`;
      mensaje += `Modelo: ${datosVehiculo.x_modelo || 'No disponible'}\n`;
      mensaje += `Chasis: ${datosVehiculo.n_chasis || 'No disponible'}\n`;
      mensaje += `Motor: ${datosVehiculo.n_motor || 'No disponible'}\n`;
      mensaje += `Estado: ${data.Respuesta.InformacionRegistral.Dominio.Estados?.Estado?.x_estado || 'No disponible'}\n`;

      if (titular) {
        mensaje += `\n👤 Titular:\n`;
        mensaje += `Nombre: ${titular.x_nombre || 'No disponible'}\n`;
        mensaje += `Documento: ${titular.n_documento || 'No disponible'}\n`;
        mensaje += `Domicilio: ${titular.x_calle || 'No disponible'}, N° ${titular.numero || ''}\n`;
        mensaje += `Localidad: ${titular.x_localidad || 'No disponible'}\n`;
        mensaje += `Provincia: ${titular.x_pcia || 'No disponible'}\n`;
        mensaje += `Código Postal: ${titular.c_postal || 'No disponible'}\n`;
      }

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('❌ Error en /dnrpa3:', error.message);
      bot.sendMessage(chatId, '❌ Ocurrió un error al consultar el dominio.');
    }
  }
};
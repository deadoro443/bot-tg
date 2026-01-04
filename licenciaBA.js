const axios = require('axios');
const { checkAndConsumeToken } = require('../utils/tokenManager');

function escapeMarkdownV2(text) {
  return (text || '').toString().replace(/([_\*\[\]\(\)~`>#+\-=|{}.!\\])/g, '\\$1');
}

module.exports = {
  name: 'firmad',
  async execute(bot, msg, dni, sexo) {
    const chatId = msg.chat.id;

    if (!dni || !sexo) {
      return bot.sendMessage(chatId, '⚠️ Uso correcto: /firmad <dni> <sexo>\nEjemplo: /firmad 12345678 M');
    }

    sexo = sexo.toUpperCase();
    if (!['M', 'F'].includes(sexo)) {
      return bot.sendMessage(chatId, '⚠️ El sexo debe ser M o F');
    }

    let waitingMsg = null;
    let processingMsg = null;

    try {
      waitingMsg = await bot.sendMessage(chatId, '🔍 Consultando información... Por favor espere.');

      const url = `http://localhost:5008/dni/${dni}/${sexo}`;
      console.log('🔍 Haciendo request a:', url);

      const response = await axios.get(url);
      const data = response.data;

      processingMsg = await bot.sendMessage(chatId, '⏳ Información recibida. Procesando datos...');

      if (!data || !data.licencia || data.licencia.Status !== 1 || !data.licencia.Data) {
        throw new Error('No se encontró información de licencia.');
      }

      const info = data.licencia.Data;
      const persona = info.Persona || {};
      const licencia = info.InfoLicenia || {};
      const ente = info.EnteAutorizante || {};
      const biometricos = info.Biometricos || {};

      // Escapamos para MarkdownV2
      const pNombres = escapeMarkdownV2(persona.Nombres);
      const pApellidos = escapeMarkdownV2(persona.Apellidos);
      const pDNI = escapeMarkdownV2(persona.DNI);
      const pSexo = escapeMarkdownV2(persona.Sexo);
      const pGrupo = escapeMarkdownV2(persona.Grupo);
      const pFactor = escapeMarkdownV2(persona.Factor);
      const pNacionalidad = escapeMarkdownV2(persona.Nacionalidad);
      const pDonante = persona.SiDonante ? 'Sí' : 'No';

      const lNumero = escapeMarkdownV2(licencia.Numero);
      const lDesde = escapeMarkdownV2(licencia.FechaDesde);
      const lVence = escapeMarkdownV2(licencia.FechaVencimiento);
      const lClases = escapeMarkdownV2(licencia.CodigosClases);
      const lDescripcion = escapeMarkdownV2(licencia.DescripcionClases);
      const lRestricciones = escapeMarkdownV2(licencia.Restricciones || 'Ninguna');
      const lObservaciones = escapeMarkdownV2(licencia.Observaciones || 'Ninguna');
      const lDomicilio = escapeMarkdownV2(licencia.Direccion);

      const eNombre = escapeMarkdownV2(ente.NombreFuncionario);
      const eApellido = escapeMarkdownV2(ente.ApellidoFuncionario);
      const eMunicipio = escapeMarkdownV2(ente.MunicipioFuncionario);
      const eProvincia = escapeMarkdownV2(ente.Provincia);

      // Construir mensaje con quote
      const mensaje = 
`> » *Nombre:* ${pNombres} ${pApellidos}
> » *DNI:* ${pDNI}
> » *Sexo:* ${pSexo}
> » *Grupo y Factor:* ${pGrupo} ${pFactor}
> » *Nacionalidad:* ${pNacionalidad}
> » *Donante:* ${pDonante}

> » *Número de Licencia:* ${lNumero}
> » *Desde:* ${lDesde}
> » *Vence:* ${lVence}
> » *Clases:* ${lClases}
> » *Descripción:* ${lDescripcion}

> » *Restricciones:* ${lRestricciones}
> » *Observaciones:* ${lObservaciones}
> » *Domicilio:* ${lDomicilio}

> » *Emitida por:* ${eNombre} ${eApellido}
> » *Municipio:* ${eMunicipio}
> » *Provincia:* ${eProvincia}`;

      // Consumir tokens solo si mensaje incluye "Nacionalidad:"
      if (mensaje.includes('Nacionalidad:')) {
        const tieneTokens = await checkAndConsumeToken(chatId.toString(), 5);
        if (!tieneTokens) {
          throw new Error('No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
        }
      } else {
        throw new Error('No se encontró información válida en la respuesta.');
      }

      if (waitingMsg) {
        try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
        waitingMsg = null;
      }
      if (processingMsg) {
        try { await bot.deleteMessage(chatId, processingMsg.message_id); } catch {}
        processingMsg = null;
      }

      await bot.sendMessage(chatId, mensaje, { parse_mode: 'MarkdownV2' });

      // Enviar imagenes si existen
      if (biometricos.Foto) {
        const fotoBuffer = Buffer.from(biometricos.Foto, 'base64');
        await bot.sendPhoto(chatId, fotoBuffer, { caption: '» Foto' });
      }

      if (biometricos.Firma) {
        const firmaBuffer = Buffer.from(biometricos.Firma, 'base64');
        await bot.sendPhoto(chatId, firmaBuffer, { caption: '» Firma' });
      }

    } catch (error) {
      console.error('❌ Error en el comando /firmad:', error);
      let errorMsg = 'Hubo un error al procesar la información. Intenta nuevamente más tarde.';
      if (error.message) errorMsg = error.message;
      bot.sendMessage(chatId, `❌ ${errorMsg}`);

      if (waitingMsg) {
        try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
      }
      if (processingMsg) {
        try { await bot.deleteMessage(chatId, processingMsg.message_id); } catch {}
      }
    }
  }
};

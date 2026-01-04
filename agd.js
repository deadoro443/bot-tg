const axios = require('axios');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { createPDF } = require('../utils/generatePDF');
const config = require('../config.json');
const { checkAndConsumeToken } = require('../utils/tokenManager');

module.exports = {
  name: 'agd',
  async execute(bot, msg, cuil) {
    const chatId = msg.chat.id;

    if (!cuil || cuil.length !== 11) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un CUIL válido de un mayor de edad Ejemplo: 24444444440');
    }

    try {
      const url = `http://127.0.0.1:7055/agd/${cuil}`;
      console.log('🔍 Haciendo request a:', url);

      const res = await axios.get(url);
      const rawData = res.data;

      console.log('✅ Respuesta de la API:', rawData);

      const data = rawData?.data?.datosParticulares;
      if (!data || !data.apellidoNombre) {
        return bot.sendMessage(chatId, '❌ No se encontraron resultados válidos para el CUIL proporcionado.');
      }

      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 4);
      if (!tieneTokens) {
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      const formatFecha = (fecha) => {
        if (!fecha) return '';
        const d = new Date(fecha);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      let mensaje = `» Información personal:
 - Nombre completo: ${data.apellidoNombre}
 - CUIL: ${data.cuil}
 - DNI: ${data.dni}
 - Fecha de nacimiento: ${formatFecha(data.fechaNacimiento)}
 - Nacionalidad: ${data.nacionalidad}
 - Edad: ${data.edad}
 - Sexo: ${data.sexo}`;

      // Domicilios
      const doms = [data.domicilio, ...(rawData.data.datosParticulares.domAlternativos?.datos || []).map(d => d.domicilio)];
      if (doms.length) {
        mensaje += `\n\n» Domicilios:\n${doms.map(d => ` - ${d}, ${data.localidad}, ${data.provincia}, C.P.: ${data.cp}`).join('\n')}`;
      }

      // Vínculos
      const vinculos = rawData.data.vinculos?.vinculos?.datos || [];
      if (vinculos.length) {
        mensaje += `\n\n» Vínculos:\n${vinculos.map(v => ` - ${v.relacion}: ${v.nombre} [${v.cuilVinculo}]`).join('\n')}`;
      }

      // Teléfonos
      const telefonos = [];
      const telFijos = rawData.data.telefonos?.datos || [];
      const telCels = rawData.data.telefonosCelulares?.datos || [];
      const telAdics = rawData.data.telefonosAdicionales?.datos || [];

      telFijos.forEach(t => telefonos.push(`${t.tel} (Fijo)`));
      telCels.forEach(t => telefonos.push(`${t.tel} (Celular)`));
      telAdics.forEach(t => telefonos.push(`${t.tel} (Celular)`));

      if (telefonos.length) {
        mensaje += `\n\n» Teléfonos:\n${telefonos.map(t => ` - ${t}`).join('\n')}`;
      }

      // Autos
      const autosHist = rawData.data.bienesPersonales?.automotores_historial?.datos || [];
      if (autosHist.length) {
        mensaje += `\n\n» Autos:\n${autosHist.map(a => {
          return ` - ${a.marca} ${a.modelo}, comprado el ${formatFecha(a.compra)} de patente ${a.dominio}`;
        }).join('\n')}`;
      }

      // Emails
      const emails = rawData.data.datosParticulares?.mails?.datos?.map(m => m.email) || [];
      if (emails.length) {
        mensaje += `\n\n» Emails:\n${emails.map(e => ` - ${e}`).join('\n')}`;
      }

      // Morosidad
      const morosidad = [];
      const bcra = rawData.data.morosidad?.informacionBcra?.datos || [];
      const cheques = rawData.data.morosidad?.chequesRechazados?.datos || [];
      const deudores = rawData.data.morosidad?.deudoresBancoCentral?.datos || [];

      bcra.forEach(d => morosidad.push(d.entidad));
      cheques.forEach(d => morosidad.push(d.entidad));
      deudores.forEach(d => morosidad.push(d.entidad));

      if (morosidad.length) {
        const unicos = [...new Set(morosidad)];
        mensaje += `\n\n» Morosidad:\n${unicos.map(m => ` - ${m}`).join('\n')}`;
      }

      // Crear PDF
      const filename = `consulta_cuil_${cuil}_${Date.now()}.pdf`;
      const tempDir = path.join(__dirname, '..', 'temp');
      const filePath = path.join(tempDir, filename);

      if (!fs.existsSync(tempDir)) {
        await fsPromises.mkdir(tempDir);
      }

      await createPDF(mensaje, filePath);

      // Enviar mensaje y documento
      await bot.sendMessage(chatId, mensaje);
      await bot.sendDocument(chatId, filePath);

      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error en el comando CUIL:', error.message || error);
      bot.sendMessage(chatId, '❌ Hubo un error al realizar la búsqueda.');
    }
  }
};

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { checkAndConsumeToken } = require('../utils/tokenManager');
const fsPromises = require('fs/promises');

module.exports = {
  name: 'sifcop',
  async execute(bot, msg, dni) {
    const chatId = msg.chat.id;

    if (!dni) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un DNI. Ejemplo: /sifcop 12345678');
    }

    let waitingMsg = null;
    
    try {
      // Mensaje de espera
      waitingMsg = await bot.sendMessage(chatId, '🔍 Buscando información en SIFCOP... Por favor espere.');

      // URL de la API
      const url = `http://localhost:8044/buscar?dni=${dni}`;
      console.log('🔍 Haciendo request a:', url);

      // Realizar la solicitud a la API
      const response = await axios.get(url);
      const responseData = response.data;

      console.log('✅ Respuesta de la API:', JSON.stringify(responseData, null, 2));

      // Verificar si hay datos válidos
      if (!responseData.exito || !responseData.datos || !responseData.datos.datos) {
        if (waitingMsg) {
          try {
            await bot.deleteMessage(chatId, waitingMsg.message_id);
          } catch (deleteError) {
            console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
          }
        }
        return bot.sendMessage(chatId, '❌ No se encontró información para este DNI en SIFCOP.');
      }

      // Consumir tokens solo si hay datos válidos
      const tieneTokens = await checkAndConsumeToken(chatId.toString(), 4);
      if (!tieneTokens) {
        if (waitingMsg) {
          try {
            await bot.deleteMessage(chatId, waitingMsg.message_id);
          } catch (deleteError) {
            console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
          }
        }
        return bot.sendMessage(chatId, '❌ No tenés suficientes tokens disponibles. Comprá más para seguir usando el bot.');
      }

      // Extraer los datos de la estructura anidada
      const personData = responseData.datos.datos;
      
      // Formatear fecha de nacimiento de YYYY-MM-DD a DD/MM/YYYY
      let fechaFormateada = 'No disponible';
      if (personData.fechaNacimiento) {
        const fechaParts = personData.fechaNacimiento.split('-');
        if (fechaParts.length === 3) {
          fechaFormateada = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
        } else {
          fechaFormateada = personData.fechaNacimiento;
        }
      }

      // Extraer componentes del domicilio
      let domicilioInfo = {
        calle: 'No disponible',
        numero: '',
        piso: '',
        departamento: '',
        monoblock: '',
        ciudad: '',
        municipio: '',
        provincia: '',
        codigoPostal: ''
      };

      if (personData.domicilio) {
        const domicilio = personData.domicilio.trim();
        
        // Intentar extraer componentes del domicilio
        // Formato típico: "CALLE 123 - PISO - DEPTO - MONOBLOCK - CIUDAD - PROVINCIA - CP1234"
        const partes = domicilio.split(' - ');
        
        // Extraer calle y número
        if (partes.length > 0) {
          const calleNumero = partes[0].trim().split(' ');
          if (calleNumero.length > 1) {
            // El último elemento podría ser el número
            domicilioInfo.numero = calleNumero.pop();
            domicilioInfo.calle = calleNumero.join(' ');
          } else {
            domicilioInfo.calle = partes[0];
          }
        }
        
        // Extraer otros componentes
        if (partes.length > 1) domicilioInfo.piso = partes[1].trim();
        if (partes.length > 2) domicilioInfo.departamento = partes[2].trim();
        if (partes.length > 3) domicilioInfo.monoblock = partes[3].trim();
        if (partes.length > 4) domicilioInfo.ciudad = partes[4].trim();
        if (partes.length > 5) domicilioInfo.provincia = partes[5].trim();
        
        // Extraer código postal
        if (partes.length > 6) {
          const cpPart = partes[6].trim();
          if (cpPart.startsWith('CP')) {
            domicilioInfo.codigoPostal = cpPart.substring(2);
          } else {
            domicilioInfo.codigoPostal = cpPart;
          }
        }
      }

      // Preparar el mensaje con el nuevo formato
      let mensaje = `📋 *SIFCOP - DNI ${dni}*\n\n`;
      
      // Sección de información personal
      mensaje += `» *Información personal:*\n`;
      mensaje += `  ◦ *Nombre:* ${personData.nombreCompleto || 'No disponible'}\n\n`;
      mensaje += `  ◦ *Nacimiento:* ${fechaFormateada}\n`;
      mensaje += `  ◦ *Nacionalidad:* ${personData.nacionalidad || 'No disponible'}\n\n`;
      
      // Sección de domicilio
      mensaje += `» *Domicilio:*\n`;
      
      // Solo incluir campos que tengan información útil
      if (domicilioInfo.calle && domicilioInfo.calle !== 'No disponible') 
        mensaje += `  ◦ *Calle:* ${domicilioInfo.calle}\n`;
      
      if (domicilioInfo.numero && domicilioInfo.numero !== '0') 
        mensaje += `  ◦ *Número:* ${domicilioInfo.numero}\n`;
      
      if (domicilioInfo.piso && domicilioInfo.piso !== 'Piso') 
        mensaje += `  ◦ *Piso:* ${domicilioInfo.piso}\n`;
      
      if (domicilioInfo.departamento && domicilioInfo.departamento !== 'Depto') 
        mensaje += `  ◦ *Departamento:* ${domicilioInfo.departamento}\n`;
      
      if (domicilioInfo.codigoPostal && domicilioInfo.codigoPostal !== '') 
        mensaje += `  ◦ *C.P.:* ${domicilioInfo.codigoPostal}\n`;
      
      if (domicilioInfo.monoblock && domicilioInfo.monoblock !== 'Monoblock') 
        mensaje += `  ◦ *Monoblock:* ${domicilioInfo.monoblock}\n`;
      
      if (domicilioInfo.ciudad && domicilioInfo.ciudad !== '') 
        mensaje += `  ◦ *Ciudad:* ${domicilioInfo.ciudad}\n`;
      
      if (domicilioInfo.municipio && domicilioInfo.municipio !== '') 
        mensaje += `  ◦ *Municipio:* ${domicilioInfo.municipio}\n`;
      
      if (domicilioInfo.provincia && domicilioInfo.provincia !== '') 
        mensaje += `  ◦ *Provincia:* ${domicilioInfo.provincia}\n`;
      
      // Agregar observaciones si existen
      if (personData.observaciones) {
        mensaje += `\n» *Observaciones:*\n  ◦ ${personData.observaciones}\n`;
      }
      
      // Procesar la foto si está disponible
      const hasImage = responseData.datos.imagenUrl && responseData.datos.imagenUrl.length > 100; // Asegurarse de que sea un base64 válido
      
      if (hasImage) {
        try {
          // Crear directorio temporal si no existe
          const tempDir = path.join(__dirname, '..', 'temp');
          if (!fs.existsSync(tempDir)) {
            await fsPromises.mkdir(tempDir, { recursive: true });
          }

          // Determinar si la cadena base64 incluye el prefijo de datos
          let base64Data = responseData.datos.imagenUrl;
          if (!base64Data.startsWith('data:image')) {
            // Si no tiene prefijo, asumimos que es una imagen JPEG
            base64Data = `data:image/jpeg;base64,${base64Data}`;
          }
          
          // Extraer solo la parte base64 si tiene prefijo
          const base64Image = base64Data.split(';base64,').pop();
          
          // Guardar la imagen temporalmente
          const tempFilePath = path.join(tempDir, `sifcop_${dni}.jpg`);
          await fsPromises.writeFile(tempFilePath, Buffer.from(base64Image, 'base64'));

          // Verificar que el archivo se haya creado correctamente
          const fileStats = await fsPromises.stat(tempFilePath);
          if (fileStats.size < 100) { // Si el archivo es muy pequeño, probablemente no sea una imagen válida
            throw new Error('La imagen generada es demasiado pequeña o inválida');
          }

          // Eliminar mensaje de espera
          if (waitingMsg) {
            try {
              await bot.deleteMessage(chatId, waitingMsg.message_id);
              waitingMsg = null;
            } catch (deleteError) {
              console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
            }
          }

          // Enviar la foto con el mensaje como caption
          await bot.sendPhoto(chatId, tempFilePath, { 
            caption: mensaje,
            parse_mode: 'Markdown'
          });

          // Eliminar el archivo temporal después de 30 segundos
          setTimeout(() => {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              console.log(`✅ Archivo eliminado: ${tempFilePath}`);
            }
          }, 30000);
        } catch (imgError) {
          console.error('❌ Error procesando la imagen:', imgError.message);
          // Si hay error con la imagen, enviamos solo el mensaje
          if (waitingMsg) {
            try {
              await bot.deleteMessage(chatId, waitingMsg.message_id);
              waitingMsg = null;
            } catch (deleteError) {
              console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
            }
          }
          await bot.sendMessage(chatId, mensaje + '\n\n⚠️ *Nota:* No se pudo procesar la imagen.', { 
            parse_mode: 'Markdown' 
          });
        }
      } else {
        // Si no hay foto, solo enviar el mensaje
        if (waitingMsg) {
          try {
            await bot.deleteMessage(chatId, waitingMsg.message_id);
            waitingMsg = null;
          } catch (deleteError) {
            console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
          }
        }
        await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error('❌ Error en comando /sifcop:', error.message || error);
      
      // Intentar eliminar el mensaje de espera si existe
      if (waitingMsg) {
        try {
          await bot.deleteMessage(chatId, waitingMsg.message_id);
        } catch (deleteError) {
          console.log('No se pudo eliminar el mensaje de espera:', deleteError.message);
        }
      }
      
      bot.sendMessage(chatId, '❌ Ocurrió un error al obtener la información de SIFCOP. Intente nuevamente más tarde.');
    }
  }
};
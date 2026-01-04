const axios = require('axios');  // Asegúrate de importar axios

module.exports = {
  name: 'nombre',
  async execute(bot, msg, args) {
    const chatId = msg.chat.id;

    // Imprimir los argumentos recibidos para depuración
    console.log('Argumentos recibidos:', args);


    // Verifica si args tiene al menos dos elementos
    if (args.length < 2) {
      return bot.sendMessage(chatId, '⚠️ Debes proporcionar un nombre completo y un apellido. Ejemplo: BIANCIOTTO ALDO RUBEN');
    }

    // Unir los argumentos en un solo string con el separador '+'
    const nombreConsultado = args.join('+');
    console.log(`Nombre consultado: ${nombreConsultado}`);  // Mostrar el nombre consultado

    // Lógica para hacer la consulta
    try {
      const url = 'https://informes.nosis.com/Home/Buscar';
      const payload = {
        'Texto': nombreConsultado,
        'Tipo': '-1',
        'EdadDesde': '-1',
        'EdadHasta': '-1',
        'IdProvincia': '-1',
        'Localidad': '',
        'recaptcha_response_field': 'enganio al captcha',
        'recaptcha_challenge_field': 'enganio al captcha',
        'encodedResponse': ''
      };

      const response = await axios.post(url, payload);

      if (response.status === 200) {
        const data = response.data;

        // Verifica si hay errores en la respuesta de la API
        if (data.HayError) {
          return bot.sendMessage(chatId, '❌ CAPTCHA ERROR');
        }

        const resultados = data.EntidadesEncontradas || [];

        // Si hay resultados, los mostramos
        if (resultados.length > 0) {
          let mensaje = '';
          resultados.forEach((resultado, index) => {
            mensaje += `\n\`INDIVIDUO: ${index + 1}\`\n`;
            mensaje += `DOCUMENTO: ${resultado.Documento || 'No disponible'}\n`;
            mensaje += `NOMBRE: ${resultado.RazonSocial || 'No disponible'}\n`;
            mensaje += `ACTIVIDAD: ${resultado.Actividad || 'No disponible'}\n`;
          });
          bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
        } else {
          bot.sendMessage(chatId, '❌ No se encontraron resultados.');
        }
      } else {
        bot.sendMessage(chatId, '❌ Error en la API.');
      }
    } catch (error) {
      console.error('Error al consultar nombre:', error);
      bot.sendMessage(chatId, '❌ Ocurrió un error al hacer la consulta.');
    }
  }
};

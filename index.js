const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const listaCommand = require('./commands/lista');

// Token del bot
const token = '7604838810:AAGa2Ggc1mF22b5G4rBlV5J4ZR__cL1sz2c';

// Inicializar bot
const bot = new TelegramBot(token, { polling: true });

// Ruta a los comandos
const comandosPath = path.join(__dirname, 'commands');
const comandos = new Map();

// Cargar todos los comandos desde la carpeta
fs.readdirSync(comandosPath).forEach(file => {
  const ruta = path.join(comandosPath, file);
  const comando = require(ruta);

  if (comando.name && typeof comando.execute === 'function') {
    comandos.set(comando.name, comando);
    console.log(`✅ Comando cargado: ${comando.name}`);
  } else {
    console.log(`⚠️ Comando ignorado: ${file}`);
  }
});

// Comando /nombre directamente aquí para control completo
bot.onText(/^\/nombre(?:\s+(.*))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const entrada = match[1]?.trim();

  // Validar que se haya pasado nombre y apellido
  if (!entrada) {
    return bot.sendMessage(chatId, '⚠️ Debes proporcionar un nombre y un apellido. Ejemplo: /nombre Juan Pérez');
  }

  const args = entrada.split(/\s+/);
  if (args.length < 2) {
    return bot.sendMessage(chatId, '⚠️ Debes proporcionar al menos nombre y apellido. Ejemplo: /nombre Juan Pérez');
  }

  const nombre = args[0];
  const apellido = args[1];
  const nombreConsultado = `${nombre}+${apellido}`;

  console.log(`Nombre: ${nombre}, Apellido: ${apellido}`);

  try {
    const url = 'https://informes.nosis.com/Home/Buscar';
    const payload = {
      Texto: nombreConsultado,
      Tipo: '-1',
      EdadDesde: '-1',
      EdadHasta: '-1',
      IdProvincia: '-1',
      Localidad: '',
      recaptcha_response_field: 'enganio al captcha',
      recaptcha_challenge_field: 'enganio al captcha',
      encodedResponse: ''
    };

    const response = await axios.post(url, payload);
    const data = response.data;

    if (data.HayError) {
      return bot.sendMessage(chatId, '❌ CAPTCHA ERROR');
    }

    const resultados = data.EntidadesEncontradas || [];
    if (resultados.length === 0) {
      return bot.sendMessage(chatId, '❌ No se encontraron resultados.');
    }

    let mensaje = '';
    resultados.forEach((resultado, index) => {
      mensaje += `
\`INDIVIDUO: ${index + 1}\`
DOCUMENTO: ${resultado.Documento || 'No disponible'}
NOMBRE: ${resultado.RazonSocial || 'No disponible'}
ACTIVIDAD: ${resultado.Actividad || 'No disponible'}
`;
    });

    bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('❌ Error al consultar nombre:', error.message);
    bot.sendMessage(chatId, '❌ Ocurrió un error al hacer la consulta.');
  }
});

bot.on('message', (msg) => {
  const texto = msg.text || '';
  if (!texto.startsWith('/')) return;

  const partes = texto.trim().split(/\s+/);
  const nombreComando = partes[0].slice(1).toLowerCase();
  const argumentos = partes.slice(1);

  // Evitar que el comando /nombre lo vuelva a procesar acá
  if (nombreComando === 'nombre') return;

  if (comandos.has(nombreComando)) {
    const comando = comandos.get(nombreComando);
    try {
      comando.execute(bot, msg, ...argumentos);
    } catch (err) {
      console.error(`❌ Error ejecutando /${nombreComando}:`, err);
      bot.sendMessage(msg.chat.id, '❌ Ocurrió un error al ejecutar el comando.');
    }
  } else {
    bot.sendMessage(msg.chat.id, `❓ El comando /${nombreComando} no existe.`);
  }
});
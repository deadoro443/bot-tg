const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "pdf417",
    description: "Genera una imagen del código PDF417 a partir de un DNI y sexo",
    async execute(bot, msg, args) {
        if (!args || args.length < 2) {
            return bot.sendMessage(msg.chat.id, "⚠️ Este comando debe ejecutarse con texto.\nUso correcto: /pdf417 <dni> <sexo>");
        }

        const dni = args[0];
        const sexo = args[1];
        const url = `http://127.0.0.1:7051/buscar?dni=${dni}&sexo=${sexo}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            // Verificamos que la respuesta tenga los datos necesarios
            if (!data || !data.pdf417_guardado) {
                return bot.sendMessage(msg.chat.id, "❌ No se encontraron datos o no se generó el código PDF417.");
            }

            const mensaje = `🧾 Datos encontrados:

Nombre: ${data.nombre || "No disponible"} ${data.apellido || ""}
DNI: ${data.dni || "No disponible"}
CUIL: ${data.cuil || "No disponible"}
Sexo: ${data.sexo || "No disponible"}
Domicilio: ${data.domicilio || "No disponible"}
Fallecido: ${data.fallecido || "No disponible"}

Código PDF417:`.trim();

            await bot.sendMessage(msg.chat.id, mensaje);

            // Generamos la ruta completa para la imagen PDF417
            const imagenPath = `${dni}.png`; // Ahora tomamos el DNI para generar la ruta
            const folderPath = path.join(__dirname, "../../PDF417/pdf417");

            console.log("Buscando archivo en:", path.join(folderPath, imagenPath));

            // Verificamos si el archivo existe
            const filePath = path.join(folderPath, imagenPath);
            if (fs.existsSync(filePath)) {
                // Enviar la imagen al chat
                bot.sendPhoto(msg.chat.id, fs.createReadStream(filePath));
            } else {
                // Si el archivo no existe, intentamos volver a generar el PDF417
                return bot.sendMessage(msg.chat.id, "❌ El archivo PDF417 aún no está disponible. Intenta nuevamente en unos momentos.");
            }

        } catch (error) {
            console.error("Error al consultar la API PDF417:", error.message);
            await bot.sendMessage(msg.chat.id, "❌ Error al generar el código PDF417. Verificá los datos e intentá de nuevo.");
        }
    }
};
    
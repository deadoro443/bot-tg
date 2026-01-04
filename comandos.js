module.exports = {
  name: 'comandos',
  async execute(bot, msg) {
    const chatId = msg.chat.id;

    const mensaje = `
<blockquote>
🥷 𝗜𝗡𝗙𝗢𝗔𝗥𝗚 | 𝗕𝗢𝗧 -

📌 COMANDOS BÁSICOS:

• /comandos → Ver comandos disponibles
• /me → Ver tokens disponibles e ID

──────────────────────────────
🔍 BÚSQUEDAS PERSONALES:

• /nombre &lt;nombre completo&gt; → Genera DNI (0T)
• /sifcop &lt;dni&gt; → Información RENAPER Foto dni (4T) 
• /renaper &lt;dni&gt; &lt;sexo&gt; → Info + Foto dni y PDF417 (5T) 🛠️
• /renaper2 &lt;dni&gt; &lt;sexo&gt; → Consulta RENAPER + IDARG (2T)
• /familiares &lt;dni&gt; → Familiares, teléfonos, etc (2T)
• /colordb &lt;dni&gt; → Genera Foto dni a color de una base de datos (San Juan) (4T)

──────────────────────────────
📑 REPORTES / PDF:

• /puco &lt;dni&gt; → Da información de obra social en PDF (1T)
• /sisa &lt;dni&gt; → Informe SISA en PDF (1T)
• /nosis &lt;CUIL&gt; → Informe Nosis en PDF (2T)
• /norisk &lt;CUIL&gt; → Informe Comercial de Norisk en PDF (3T)
• /work &lt;dni&gt; → Genera PDF de work (2T)
• /agd &lt;CUIL&gt; → AgilData en texto (4T) 🛠️

──────────────────────────────
📱 TELÉFONOS:

• /tel &lt;número&gt; → Titular del número (2T) 🛠️
• /tel2 &lt;número&gt; → Da información a través de Work (3T)

──────────────────────────────
🚘 VEHÍCULOS:

• /rodados &lt;dni&gt; → Vehículos asociados a un dni (2T) 🛠️
• /dnrpa &lt;patente&gt; → Titular patente (2T) 🛠️
• /dnrpa2 &lt;patente&gt; → Información DNRPA a través de Work (3T)
• /patente &lt;patente&gt; → Informacion DNRPA a traves de GAP (2T) 🛟️
• /licencia &lt;dni&gt; &lt;sexo&gt; → Licencia de conducir (1T)
• /fotomulta &lt;dni&gt; &lt;sexo&gt; → Genera PDF de multas, da foto del vehículo + información de la infracción (2T) 🛠️
• /fotomulta2 &lt;dominio&gt; → Genera PDF de multas, da foto del vehículo + información de la infracción (2T) 🛠️

──────────────────────────────
🌐 CONSULTAS TÉCNICAS:

• /bin &lt;BIN&gt; → Info tarjeta (0T)
• /ip &lt;IP&gt; → Info IP (0T)
• /check &lt;card&gt; &lt;mm&gt; &lt;yy&gt; &lt;cvv&gt; &lt;dni&gt; → Checkea CCS (1T) 🛠️

──────────────────────────────
🌎 EXTRAS:

• /uruguay &lt;nombre&gt; → Cédula uruguaya (1T)

──────────────────────────────

Para más información acerca de un comando, ejecútalo sin ningún argumento.
</blockquote>
`;

    bot.sendMessage(chatId, mensaje, { parse_mode: 'HTML' });
  }
};
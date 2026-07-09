const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

app.use(express.json());

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot is running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

// FUNÇÃO ATUALIZADA: USA BYPASS DE URL TAMBÉM
async function enviarTextoGrande(destino, texto) {
    const LIMITE = 1500;
    const numero = typeof destino === 'string' ? destino.replace('@c.us','') : destino.from.replace('@c.us','');

    if (texto.length <= LIMITE) {
        return enviarViaURL(numero, texto); // usa bypass
    }

    const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
    for (let i = 0; i < partes.length; i++) {
        await enviarViaURL(numero, `[${i + 1}/${partes.length}]\n${partes[i]}`);
        await new Promise(r => setTimeout(r, 2000)); // 2s pra não tomar block
    }
}

// NOVA FUNÇÃO: ENVIA PELA URL PRA BYPASSAR O BUG
async function enviarViaURL(numero, mensagem) {
    const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    console.log("BYPASS: Abrindo URL para", numero);
    await client.pupPage.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    await client.pupPage.waitForSelector('span[data-icon="send"]', {timeout: 20000});
    await client.pupPage.click('span[data-icon="send"]');
    await new Promise(r => setTimeout(r, 1000)); // espera enviar
    console.log("BYPASS: Enviado para", numero);
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot-v6", dataPath: "./.wwebjs_auth_v6" }), // muda pra limpar cache
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp Conectado!'));

// ROTA PRA API CHAMAR - 100% BYPASS
app.post('/send', async (req, res) => {
    console.log("ROTA /send V6 BYPASS");
    const { to, message } = req.body;
    if(!to ||!message) return res.status(400).json({error: "Falta 'to' ou 'message'"});

    const numero = String(to).replace(/\D/g, '');
    console.log("Tentando enviar para:", numero);

    try {
        await enviarViaURL(numero, message);
        console.log("OK: Enviado para", numero);
        res.status(200).json({status: "ok", method: "url_bypass"});
    } catch (e) {
        console.error("ERRO BYPASS:", e.stack);
        res.status(500).json({error: e.message});
    }
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    if (texto === '!oi') {
        return msg.reply('StockBot AO online! ✅\nComandos:\n!preco CODIGO\n!lista');
    }

    if (texto.startsWith('!preco')) {
        const codigo = texto.split(' ')[1];
        if(!codigo) return msg.reply('Manda assim:!preco CODIGO');
        try {
            msg.reply(`Buscando produto ${codigo}...`);
            const res = await axios.get(`${API_URL}/produtos/${codigo}`);
            const produto = res.data;
            const reply = `*${produto.nome}*\n💰 Preço: Kz ${produto.preco}\n📦 Estoque: ${produto.estoque}`;
            await enviarTextoGrande(msg.from, reply); // passa o numero
        } catch (error) {
            msg.reply(`Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

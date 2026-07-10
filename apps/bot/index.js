const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

app.use(express.json());

let clientReady = false; // FLAG NOVA

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot is running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

async function enviarViaURL(numero, mensagem) {
    if(!clientReady) throw new Error("WhatsApp ainda não conectou");
    const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    console.log("BYPASS: Abrindo URL para", numero);
    await client.pupPage.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    await client.pupPage.waitForSelector('span[data-icon="send"]', {timeout: 20000});
    await client.pupPage.click('span[data-icon="send"]');
    await new Promise(r => setTimeout(r, 1000));
    console.log("BYPASS: Enviado para", numero);
}

async function enviarTextoGrande(numero, texto) {
    const LIMITE = 1500;
    if (texto.length <= LIMITE) return enviarViaURL(numero, texto);
    const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
    for (let i = 0; i < partes.length; i++) {
        await enviarViaURL(numero, `[${i + 1}/${partes.length}]\n${partes[i]}`);
        await new Promise(r => setTimeout(r, 2000));
    }
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot-v7", dataPath: "./.wwebjs_auth_v7" }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    clientReady = true; // LIGA A FLAG
    console.log('✅ WhatsApp Conectado!')
});

// ROTA PRA API CHAMAR - COM PROTEÇÃO
app.post('/send', async (req, res) => {
    console.log("ROTA /send V7");
    if(!clientReady) return res.status(503).json({error: "Bot ainda conectando. Tenta em 10s"});

    const { to, message } = req.body;
    if(!to ||!message) return res.status(400).json({error: "Falta 'to' ou 'message'"});

    const numero = String(to).replace(/\D/g, '');
    try {
        await enviarViaURL(numero, message);
        res.status(200).json({status: "ok", method: "url_bypass"});
    } catch (e) {
        console.error("ERRO BYPASS:", e.stack);
        res.status(500).json({error: e.message});
    }
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();
    if (texto === '!oi') return msg.reply('StockBot AO online! ✅\n!preco CODIGO\n!lista');

    if (texto.startsWith('!preco')) {
        const codigo = texto.split(' ')[1];
        if(!codigo) return msg.reply('Manda assim:!preco CODIGO');
        try {
            msg.reply(`Buscando produto ${codigo}...`);
            const res = await axios.get(`${API_URL}/produtos/${codigo}`);
            const produto = res.data;
            const reply = `*${produto.nome}*\n💰 Preço: Kz ${produto.preco}\n📦 Estoque: ${produto.estoque}`;
            const numero = msg.from.replace('@c.us','');
            await enviarTextoGrande(numero, reply);
        } catch (error) {
            msg.reply(`Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

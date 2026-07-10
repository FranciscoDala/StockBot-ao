const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

app.use(express.json());

let clientReady = false;

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot is running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

async function enviarViaURL(numero, mensagem) {
    if(!clientReady) throw new Error("WhatsApp ainda não conectou");
    const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    console.log("BYPASS: Abrindo URL para", numero);
    await client.pupPage.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    await client.pupPage.waitForSelector('span[data-icon="send"]', {timeout: 20000});
    await client.pupPage.click('span[data-icon="send"]');
    await new Promise(r => setTimeout(r, 1500)); // 1.5s pra garantir
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

// FORÇA LIMPAR SESSÃO ANTIGA CORROMPIDA
const sessionPath = './.wwebjs_auth_v8';
if (fs.existsSync(sessionPath)) {
    console.log("LIMPANDO SESSÃO ANTIGA...");
    fs.rmSync(sessionPath, { recursive: true, force: true });
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot-v8", dataPath: sessionPath }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu' // ESSENCIAL PRA RAILWAY
        ]
    }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    clientReady = true;
    console.log('✅ WhatsApp Conectado!')
});

client.on('disconnected', (reason) => {
    clientReady = false;
    console.log('❌ Desconectado:', reason);
});

// ROTA PRA API CHAMAR
app.post('/send', async (req, res) => {
    console.log("ROTA /send V8");
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
    const numero = msg.from.replace('@c.us','');
    const texto = msg.body.toLowerCase();

    if (texto === '!oi') {
        return enviarViaURL(numero, 'StockBot AO online! ✅\n!preco CODIGO\n!lista');
    }

    if (texto.startsWith('!preco')) {
        const codigo = texto.split(' ')[1];
        if(!codigo) return enviarViaURL(numero, 'Manda assim: !preco CODIGO');
        try {
            await enviarViaURL(numero, `Buscando produto ${codigo}...`);
            const res = await axios.get(`${API_URL}/produtos/${codigo}`);
            const produto = res.data;
            const reply = `*${produto.nome}*\n💰 Preço: Kz ${produto.preco}\n📦 Estoque: ${produto.estoque}`;
            await enviarTextoGrande(numero, reply);
        } catch (error) {
            await enviarViaURL(numero, `Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

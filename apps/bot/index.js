const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const FORCE_RESET = process.env.FORCE_RESET_SESSION === 'true';

app.use(express.json());
let clientReady = false;

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot V10 running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

async function enviarComRetry(numero, mensagem, tentativas = 3) {
    for(let i = 0; i < tentativas; i++) {
        try {
            const chat = await client.getChatById(numero + '@c.us');
            await chat.sendMessage(mensagem);
            console.log("ENVIADO pra", numero);
            return;
        } catch(e) {
            console.log(`Tentativa ${i+1} falhou:`, e.message);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    throw new Error("Falhou após 3 tentativas");
}

async function enviarTextoGrande(numero, texto) {
    const LIMITE = 1500;
    if (texto.length <= LIMITE) return enviarComRetry(numero, texto);
    const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
    for (let i = 0; i < partes.length; i++) {
        await enviarComRetry(numero, `[${i + 1}/${partes.length}]\n${partes[i]}`);
        await new Promise(r => setTimeout(r, 2000));
    }
}

// DELETA SESSÃO SE A VARIAVEL ESTIVER ATIVA
const sessionPath = './.wwebjs_auth_v10';
if (FORCE_RESET && fs.existsSync(sessionPath)) {
    console.log("🔥 FORÇANDO LIMPEZA TOTAL DA SESSÃO...");
    fs.rmSync(sessionPath, { recursive: true, force: true });
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot-v10", dataPath: sessionPath }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // ESSENCIAL
            '--disable-gpu'
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

client.on('authenticated', () => console.log('✅ Autenticado'));

app.post('/send', async (req, res) => {
    if(!clientReady) return res.status(503).json({error: "Bot ainda conectando. Tenta em 10s"});
    const { to, message } = req.body;
    const numero = String(to).replace(/\D/g, '');
    try {
        await enviarComRetry(numero, message);
        res.status(200).json({status: "ok", method: "sendMessage"});
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

client.on('message', async msg => {
    const numero = msg.from.replace('@c.us','');
    const texto = msg.body.toLowerCase();

    if (texto === '!oi') {
        return enviarComRetry(numero, 'StockBot AO online! ✅\n!preco CODIGO\n!lista');
    }

    if (texto.startsWith('!preco')) {
        const codigo = texto.split(' ')[1];
        if(!codigo) return enviarComRetry(numero, 'Manda assim:!preco CODIGO');
        try {
            await enviarComRetry(numero, `Buscando produto ${codigo}...`);
            const res = await axios.get(`${API_URL}/produtos/${codigo}`);
            const produto = res.data;
            const reply = `*${produto.nome}*\n💰 Preço: Kz ${produto.preco}\n📦 Estoque: ${produto.estoque}`;
            await enviarTextoGrande(numero, reply);
        } catch (error) {
            await enviarComRetry(numero, `Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

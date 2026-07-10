const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const SESSION_PATH = './baileys_auth_v11';

app.use(express.json());
let sock;
let clientReady = false;

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot V11 Baileys running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

async function enviarTexto(numero, mensagem) {
    if(!clientReady) throw new Error("WhatsApp ainda não conectou");
    const jid = numero + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: mensagem });
    console.log("ENVIADO pra", numero);
}

async function enviarTextoGrande(numero, texto) {
    const LIMITE = 1500;
    if (texto.length <= LIMITE) return enviarTexto(numero, texto);
    const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
    for (let i = 0; i < partes.length; i++) {
        await enviarTexto(numero, `[${i + 1}/${partes.length}]\n${partes[i]}`);
        await new Promise(r => setTimeout(r, 1500));
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'warn' }),
        browser: ['StockBot AO', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log('================ ESCANEIA ESSE QR ==================');
            qrcode.generate(qr, { small: true });
        }
        if(connection === 'open') {
            clientReady = true;
            console.log('✅ WhatsApp Conectado!');
        }
        if(connection === 'close') {
            clientReady = false;
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Desconectado. Reconectando...', shouldReconnect);
            if(shouldReconnect) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const numero = msg.key.remoteJid.split('@')[0];
        const texto = msg.message.conversation?.toLowerCase() || msg.message.extendedTextMessage?.text?.toLowerCase();

        if (texto === '!oi') {
            return enviarTexto(numero, 'StockBot AO online! ✅\n!preco CODIGO\n!lista');
        }

        if (texto.startsWith('!preco')) {
            const codigo = texto.split(' ')[1];
            if(!codigo) return enviarTexto(numero, 'Manda assim:!preco CODIGO');
            try {
                await enviarTexto(numero, `Buscando produto ${codigo}...`);
                const res = await axios.get(`${API_URL}/produtos/${codigo}`);
                const produto = res.data;
                const reply = `*${produto.nome}*\n💰 Preço: Kz ${produto.preco}\n📦 Estoque: ${produto.estoque}`;
                await enviarTextoGrande(numero, reply);
            } catch (error) {
                await enviarTexto(numero, `Produto ${codigo} não encontrado 😢`);
            }
        }
    });
}

// ROTA PRA API CHAMAR
app.post('/send', async (req, res) => {
    console.log("ROTA /send V11");
    if(!clientReady) return res.status(503).json({error: "Bot ainda conectando. Tenta em 10s"});
    const { to, message } = req.body;
    if(!to ||!message) return res.status(400).json({error: "Falta 'to' ou 'message'"});
    const numero = String(to).replace(/\D/g, '');
    try {
        await enviarTexto(numero, message);
        res.status(200).json({status: "ok", method: "baileys"});
    } catch (e) {
        console.error("ERRO:", e);
        res.status(500).json({error: e.message});
    }
});

startBot();

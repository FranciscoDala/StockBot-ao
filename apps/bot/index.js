const express = require('express');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const pino = require('pino');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;
const SESSION_PATH = './baileys_auth_v13';
const FORCE_RESET = process.env.FORCE_RESET_BAILEYS === 'true';

app.use(express.json());
let sock;
let clientReady = false;

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot V13 running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

async function enviarTexto(numero, mensagem) {
    if(!clientReady) throw new Error("WhatsApp ainda não conectou");
    const jid = numero + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: mensagem });
    console.log("ENVIADO pra", numero);
}

// DELETA SESSÃO SE A VARIAVEL ESTIVER ATIVA
if (FORCE_RESET && fs.existsSync(SESSION_PATH)) {
    console.log("🔥 FORÇANDO LIMPEZA TOTAL DA SESSÃO BAILEYS...");
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
}

async function startBot() {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');

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
}

// ROTA PRA API CHAMAR
app.post('/send', async (req, res) => {
    console.log("ROTA /send V13");
    if(!clientReady) return res.status(503).json({error: "Bot ainda conectando. Tenta em 10s"});
    const { to, message } = req.body;
    const numero = String(to).replace(/\D/g, '');
    try {
        await enviarTexto(numero, message);
        res.status(200).json({status: "ok", method: "baileys-v13"});
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

startBot();

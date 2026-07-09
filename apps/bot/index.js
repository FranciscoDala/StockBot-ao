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

async function enviarTextoGrande(destino, texto) {
    const LIMITE = 1500;
    if (typeof destino === 'string') { // se for chatId
        if (texto.length <= LIMITE) return client.sendMessage(destino, texto);
        const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
        for (let i = 0; i < partes.length; i++) {
            await client.sendMessage(destino, `[${i + 1}/${partes.length}]\n${partes[i]}`);
            await new Promise(r => setTimeout(r, 1000));
        }
    } else { // se for objeto msg
        if (texto.length <= LIMITE) return destino.reply(texto);
        const partes = texto.match(new RegExp(`.{1,${LIMITE}}`, 'g'));
        for (let i = 0; i < partes.length; i++) {
            await destino.reply(`[${i + 1}/${partes.length}]\n${partes[i]}`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot", dataPath: "./.wwebjs_auth" }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp Conectado!'));

// ROTA PRA API CHAMAR
app.post('/send', async (req, res) => {
    console.log("=====================================");
    console.log("ROTA /send CHAMADA - V4 DEBUG");
    console.log("Body recebido:", JSON.stringify(req.body));
    console.log("=====================================");

    const { to, message } = req.body;

    if(!to || !message) {
        console.log("ERRO: Faltando 'to' ou 'message'");
        return res.status(400).json({error: "Falta 'to' ou 'message'"});
    }

    const numero = String(to).replace(/\D/g, '');
    const chatId = numero + "@c.us";
    console.log("Numero limpo:", numero);
    console.log("ChatId montado:", chatId);
    console.log("Client status:", client ? "OK" : "UNDEFINED");
    console.log("Client.sendMessage existe:", typeof client.sendMessage);

    try {
        console.log("Tentando enviar mensagem...");
        // FORÇAR ERRO AQUI SE TIVER getChatById
        const result = await client.sendMessage(chatId, message);
        console.log("SUCESSO: Mensagem enviada. ID:", result.id._serialized);
        return res.status(200).json({status: "ok", id: result.id._serialized});

    } catch (e) {
        console.log("=====================================");
        console.log("ERRO PEGO NO CATCH:");
        console.log("Mensagem:", e.message);
        console.log("Stack:", e.stack);
        console.log("=====================================");
        return res.status(500).json({error: e.message, stack: e.stack});
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
            await enviarTextoGrande(msg, reply);
        } catch (error) {
            msg.reply(`Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

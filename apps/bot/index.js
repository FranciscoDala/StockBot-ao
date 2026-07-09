const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL; // URL do teu backend: https://gentle-playfulness-production-d333.up.railway.app/api/v1

app.use(express.json()); // 1. Pra receber POST do backend

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot is running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

// 2. Função pra quebrar texto grande
async function enviarTextoGrande(chat, texto) {
    const LIMITE = 1500;
    if (texto.length <= LIMITE) {
        return chat.sendMessage(texto);
    }

    const partes = [];
    for (let i = 0; i < texto.length; i += LIMITE) {
        partes.push(texto.slice(i, i + LIMITE));
    }

    for (let i = 0; i < partes.length; i++) {
        await chat.sendMessage(`[${i + 1}/${partes.length}]\n${partes[i]}`);
        await new Promise(r => setTimeout(r, 1000)); // delay 1s pra não cair em spam
    }
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot", dataPath: "./.wwebjs_auth" }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp Conectado!'));

// 3. Rota pra API chamar e mandar mensagem pro cliente
app.post('/send', async (req, res) => {
    const { to, message } = req.body; // to = "2449XXXXXXXXX"
    if(!to ||!message) return res.status(400).send({error: "Falta 'to' ou 'message'"});

    const chatId = to.replace("+", "").replace(" ", "") + "@c.us";

    try {
        await enviarTextoGrande(await client.getChatById(chatId), message);
        res.status(200).send({status: "ok"});
    } catch (e) {
        console.error("Erro ao enviar:", e);
        res.status(500).send({error: e.message});
    }
});

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    if (texto === '!oi') {
        return msg.reply('StockBot AO online! ✅\nComandos:!preco CODIGO |!lista |!estoque CODIGO');
    }

    // Busca preço real no backend
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

    // Exemplo de comando com texto grande
    if (texto === '!lista') {
        try {
            // Pega loja_id do dono pela primeira msg. Ajusta depois
            msg.reply('Buscando lista completa...');
            const res = await axios.get(`${API_URL}/produtos`);
            let lista = "*LISTA DE PRODUTOS:*\n\n";
            res.data.forEach(p => {
                lista += `*${p.nome}* - Kz ${p.preco} - Estoque: ${p.estoque}\n`;
            });
            await enviarTextoGrande(msg, lista);
        } catch (error) {
            msg.reply("Erro ao buscar lista");
        }
    }
});

client.initialize();

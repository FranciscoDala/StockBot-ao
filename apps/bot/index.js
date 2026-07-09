const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios'); // 1. Adicionamos axios pra falar com API

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL; // 2. Pega a URL do Railway

app.get('/', (req, res) => res.status(200).send('StockBot AO Bot is running'));
app.listen(PORT, () => console.log(`HTTP server running on ${PORT}`));

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot", dataPath: "./.wwebjs_auth" }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp Conectado!'));

client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    if (texto === '!oi') {
        msg.reply('StockBot AO online! ✅ Manda!preco CODIGO');
    }

    // 3. Agora ele busca de verdade no backend
    if (texto.startsWith('!preco')) {
        const codigo = texto.split(' ')[1];
        if(!codigo) return msg.reply('Manda assim: !preco CODIGO');

        try {
            msg.reply(`Buscando produto ${codigo}...`);
            const res = await axios.get(`${API_URL}/produtos/${codigo}`); // Chama tua API
            const produto = res.data;
            msg.reply(`*${produto.nome}*\nPreço: Kz ${produto.preco}\nEstoque: ${produto.estoque}`);
        } catch (error) {
            msg.reply(`Produto ${codigo} não encontrado 😢`);
        }
    }
});

client.initialize();

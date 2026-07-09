const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot" }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('================ ESCANEIA ESSE QR ==================');
    qrcode.generate(qr, { small: true });
    console.log('====================================================');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Conectado!');
});

client.on('message', async msg => {
    if (msg.body.toLowerCase().startsWith('!preco')) {
        const codigo = msg.body.split(' ')[1];
        msg.reply(`Buscando preço do produto: ${codigo}`);
    }
    if (msg.body.toLowerCase() === '!oi') {
        msg.reply('StockBot AO online! Manda!preco CODIGO');
    }
});

client.initialize();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "stockbot" }),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('ESCANEIA ESSE QR CODE:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp Conectado!'));

client.on('message', async msg => {
    if (msg.body.toLowerCase().startsWith('!preco')) {
        const codigo = msg.body.split(' ')[1];
        msg.reply(`Buscando preço do produto: ${codigo}`);
    }
});

client.initialize();

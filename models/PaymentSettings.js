const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
    // Crypto Wallets
    wallets: {
        BTC: { type: String, default: 'abcdefgh1' },
        'BTC(r)': { type: String, default: 'abcdefgh2' },
        USDT: { type: String, default: 'abcdefgh3' },
        ETH: { type: String, default: 'abcdefgh4' }
    },
    
    // Bank Details (NEXIUM)
    bank: {
        companyName: { type: String, default: 'NEXIUM SISTEMAS LTDA' },
        bankName: { type: String, default: 'Banco AVIV' },
        cnpj: { type: String, default: '69496128000194' },
        evpKey: { type: String, default: '69496128000194' },
        randomKey: { type: String, default: '2ae3b0bf-6ab6-4ae9-8cb3-e271afcc663d' }
    },
    
    // 👈 NAYA: Telegram Support Username
    telegramSupport: { type: String, default: 'vickypp' },
    
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
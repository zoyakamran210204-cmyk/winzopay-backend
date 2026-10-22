const axios = require('axios');

// Yeh function Brazil (BRL) ke hisaab se rates layega
const getCryptoRates = async () => {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl'
        );
        
        const data = response.data;
        
        // BTC(r) ka matlab Brazil Real mein BTC hai
        return {
            BTC: data.bitcoin.brl,
            'BTC(r)': data.bitcoin.brl, // Brazil region specific
            USDT: data.tether.brl,
            ETH: data.ethereum.brl,
            currency: 'BRL',
            updatedAt: new Date()
        };
    } catch (error) {
        console.error('Crypto API Error:', error.message);
        return null;
    }
};

module.exports = { getCryptoRates };
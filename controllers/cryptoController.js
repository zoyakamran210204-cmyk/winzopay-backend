const axios = require('axios');
const NodeCache = require('node-cache');

// Cache setup: 5 minute (300 second) ke liye data save karega
const cache = new NodeCache({ stdTTL: 300 });

// Yeh function Brazil (BRL) ke hisaab se rates layega
const getCryptoRates = async () => {
    try {
        // Pehle check karein ke cache mein data mojood hai ya nahi
        const cachedRates = cache.get('crypto_rates');
        if (cachedRates) {
            console.log('✅ Returning cached crypto rates');
            return cachedRates;
        }

        // Agar cache khali hai, to CoinGecko se data layein
        console.log('🔄 Fetching new crypto rates from CoinGecko...');
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=brl'
        );
        
        const data = response.data;
        
        const rates = {
            BTC: data.bitcoin.brl,
            'BTC(r)': data.bitcoin.brl,
            USDT: data.tether.brl,
            ETH: data.ethereum.brl,
            currency: 'BRL',
            updatedAt: new Date()
        };

        // Data ko cache mein save karein
        cache.set('crypto_rates', rates);
        
        return rates;
    } catch (error) {
        console.error('Crypto API Error:', error.message);
        
        // Agar error aaye (jaise 429), to purana cached data return karein (agar mojood ho)
        const staleData = cache.get('crypto_rates');
        if (staleData) {
            console.log('⚠️ Returning stale cached data due to API error');
            return staleData;
        }
        
        return null;
    }
};

module.exports = { getCryptoRates };
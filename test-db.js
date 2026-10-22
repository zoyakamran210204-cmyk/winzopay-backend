const mongoose = require('mongoose');
require('dotenv').config();

console.log('=== MongoDB Connection Test ===\n');
console.log('Full URI (password hidden):');
console.log(process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@'));
console.log('\nConnecting...\n');

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ SUCCESS! MongoDB Connected.');
        console.log('Database Name:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        process.exit(0);
    })
    .catch(err => {
        console.log('❌ FAILED!\n');
        console.log('Error Name:', err.name);
        console.log('Error Code:', err.code);
        console.log('Error Message:', err.message);
        console.log('\n--- DIAGNOSIS ---');
        
        if (err.message.includes('bad auth')) {
            console.log('➡️  Username ya Password GALAT hai.');
            console.log('➡️  Atlas mein password reset karein.');
            console.log('➡️  Username case-sensitive hai — check karein.');
        } else if (err.message.includes('IP')) {
            console.log('➡️  Aapka IP whitelist nahi hai.');
            console.log('➡️  Network Access mein 0.0.0.0/0 add karein.');
        } else if (err.message.includes('ENOTFOUND')) {
            console.log('➡️  Cluster address galat hai.');
        } else {
            console.log('➡️  Unknown error. Poora error message bhejein.');
        }
        
        process.exit(1);
    });
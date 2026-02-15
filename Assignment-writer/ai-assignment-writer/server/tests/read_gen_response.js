const https = require('https');

const run = () => {
    https.get('https://gen.pollinations.ai/image/test', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log(data));
    });
};

run();

const https = require('https');

const testUrl = (url, headers) => {
    return new Promise((resolve) => {
        const options = {
            headers: headers
        };
        https.get(url, options, (res) => {
            console.log(`Status: ${res.statusCode}, Size: ${res.headers['content-length']}`);
            let data = [];
            res.on('data', c => data.push(c));
            res.on('end', () => {
                if (res.headers['content-type'] === 'image/jpeg' && Buffer.concat(data).length > 100000) {
                     console.log('Likely placeholder (large jpeg)');
                } else {
                     console.log('Maybe success?');
                }
                resolve();
            });
        });
    });
};

const run = async () => {
    const prompt = "test_" + Date.now();
    const url = `https://image.pollinations.ai/prompt/${prompt}`;
    
    console.log("Testing with Referer...");
    await testUrl(url, { 'Referer': 'https://pollinations.ai/' });
    
    console.log("Testing with User-Agent...");
    await testUrl(url, { 'User-Agent': 'Mozilla/5.0' });
};

run();

const https = require('https');

const testUrl = (url, name) => {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            console.log(`${name}: Status ${res.statusCode}, Content-Type: ${res.headers['content-type']}`);
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                console.log(`${name}: Downloaded ${Buffer.concat(data).length} bytes.`);
                resolve();
            });
        });
        req.on('error', (e) => {
            console.log(`${name}: Error ${e.message}`);
            resolve();
        });
    });
};

const run = async () => {
    const prompt = "test_image_" + Date.now();
    
    // 5. Gen subdomain
    await testUrl(`https://gen.pollinations.ai/image/${prompt}`, "Gen /image/");
    
    // 6. Pollinations root with /image/
    await testUrl(`https://pollinations.ai/image/${prompt}`, "Root /image/");
    
    // 7. Try ?nologo=true on old one (sometimes bypasses checks?)
    await testUrl(`https://image.pollinations.ai/prompt/${prompt}?nologo=true`, "Old + nologo");
    
    // 8. Try with model=turbo
    await testUrl(`https://image.pollinations.ai/prompt/${prompt}?model=turbo`, "Old + turbo");
};

run();

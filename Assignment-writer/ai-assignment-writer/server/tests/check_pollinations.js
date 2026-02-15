const https = require('https');
const fs = require('fs');

const testUrl = (url, name) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                console.log(`${name}: Redirect to ${res.headers.location}`);
                testUrl(res.headers.location, name + " (Redirect)").then(resolve);
                return;
            }
            console.log(`${name}: Status ${res.statusCode}, Content-Type: ${res.headers['content-type']}, Size: ${res.headers['content-length']}`);
            
            // Download first 1kb to check if it's the placeholder (optional, but status might be enough if it's 404 or something)
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                console.log(`${name}: Downloaded ${buffer.length} bytes.`);
                resolve();
            });
        }).on('error', (e) => {
            console.log(`${name}: Error ${e.message}`);
            resolve();
        });
    });
};

const run = async () => {
    const prompt = "test_image_generation_" + Date.now();
    
    // 1. Old format (likely broken)
    await testUrl(`https://image.pollinations.ai/prompt/${prompt}`, "Old Format");
    
    // 2. Format with model
    await testUrl(`https://image.pollinations.ai/prompt/${prompt}?model=flux`, "With Model");
    
    // 3. Permalinks
    await testUrl(`https://pollinations.ai/p/${prompt}`, "Permalink /p/");
    
    // 4. Just prompt path on root
    await testUrl(`https://pollinations.ai/prompt/${prompt}`, "Root /prompt/");
};

run();

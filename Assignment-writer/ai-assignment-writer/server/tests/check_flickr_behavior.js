const https = require('https');

const checkUrl = (url, name) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                console.log(`${name}: Redirect -> ${res.headers.location}`);
                resolve(res.headers.location);
                return;
            }
            console.log(`${name}: Status ${res.statusCode}`);
            resolve(null);
        });
    });
};

const run = async () => {
    // 1. Empty keywords
    await checkUrl('https://loremflickr.com/800/400/?lock=1000', 'Empty Keywords');
    
    // 2. Abstract keywords that might fail
    await checkUrl('https://loremflickr.com/800/400/artificial-intelligence?lock=1000', 'Hyphenated');
    await checkUrl('https://loremflickr.com/800/400/Artificial Intelligence?lock=1000', 'Space');
    
    // 3. Comma separated
    await checkUrl('https://loremflickr.com/800/400/computer,code?lock=1000', 'Valid CSV');
    
    // 4. Broken format
    await checkUrl('https://loremflickr.com/800/400/,,?lock=1000', 'Commas only');
};

run();

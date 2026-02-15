const https = require('https');

const checkUrl = (url, name) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400) {
                console.log(`${name}: Redirect -> ${res.headers.location}`);
                // Follow redirect once to see if it's an image
                // Fix: LoremFlickr returns relative path sometimes? Or check if it's absolute.
                let nextUrl = res.headers.location;
                if (nextUrl && !nextUrl.startsWith('http')) {
                     // Assume it's relative to loremflickr? Actually it redirects to other domains often.
                     // But the error log showed '/cache/...' which implies it's on the same host if relative.
                     nextUrl = 'https://loremflickr.com' + nextUrl;
                }
                checkUrl(nextUrl, name + " (Follow)").then(resolve);
                return;
            }
            console.log(`${name}: Status ${res.statusCode}, Type: ${res.headers['content-type']}, Length: ${res.headers['content-length']}`);
            resolve();
        }).on('error', e => {
            console.log(`${name}: Error ${e.message}`);
            resolve();
        });
    });
};

const run = async () => {
    // Test LoremFlickr with keywords
    await checkUrl('https://loremflickr.com/800/400/computer,ai', 'LoremFlickr (AI)');
    await checkUrl('https://loremflickr.com/800/400/biology,plant', 'LoremFlickr (Bio)');
    
    // Test Unsplash Source (often deprecated but worth checking equivalents)
    // https://source.unsplash.com/800x400/?computer is deprecated.
    
    // Test Pollinations again with nologo just in case
    // await checkUrl('https://image.pollinations.ai/prompt/computer%20science?nologo=true', 'Pollinations');
};

run();

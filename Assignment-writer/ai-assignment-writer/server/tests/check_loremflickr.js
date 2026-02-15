const https = require('https');

const run = () => {
    const url = "https://loremflickr.com/800/600/computer,science?lock=12345";
    
    const req = https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
            console.log(`Redirect to: ${res.headers.location}`);
        } else {
            console.log(`Status: ${res.statusCode}`);
        }
    });
    
    req.on('error', (e) => {
        console.error(`Error: ${e.message}`);
    });
};

run();

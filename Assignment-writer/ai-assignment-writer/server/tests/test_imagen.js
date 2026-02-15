const https = require('https');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;
// Note: Generative Language API uses specific endpoints. 
// For Imagen, it might be /v1beta/models/imagen-3.0-generate-001:predict
// But documentation varies. Let's try the standard generateContent first, maybe it supports image generation response?
// No, usually it's a different method.

const testImagen = () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    const body = JSON.stringify({
        instances: [
            { prompt: "A drawing of a cat" }
        ],
        parameters: {
            sampleCount: 1
        }
    });

    const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => console.log(data));
    });
    
    req.write(body);
    req.end();
};

testImagen();


const { generateImageDataUri } = require('./server/imagen');

const apiKey = 'YOUR_HUGGING_FACE_API_KEY';
const prompt = 'A cute robot learning to code, high quality, digital art';

async function test() {
    console.log('Testing Hugging Face image generation...');
    const result = await generateImageDataUri({
        apiKey,
        prompt,
        provider: 'auto'
    });

    if (result.ok) {
        console.log('Success! Image data URI generated.');
        console.log('Mime type:', result.value.substring(0, 30) + '...');
    } else {
        console.error('Failed:', result.reason);
    }
}

test();

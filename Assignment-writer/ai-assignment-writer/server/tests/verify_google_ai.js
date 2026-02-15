require('dotenv').config();
const { generateContent } = require('../generator');

const run = async () => {
    console.log('Testing generation with Google AI...');
    const payload = {
        topic: 'Photosynthesis',
        subject: 'Biology',
        level: 'School',
        length: 'Short',
        style: 'Simple',
        includeImages: true,
        imageCount: 2,
        pages: 1,
        references: false,
        citationStyle: 'APA',
        language: 'English',
        urgency: 'Normal',
        instructions: 'Explain clearly for kids.'
    };

    try {
        const content = await generateContent(payload);
        console.log('--- Generated Content Start ---');
        console.log(content.slice(0, 500) + '...');
        console.log('--- Generated Content End ---');

        if (content.includes('[IMAGE:')) {
            console.log('PASS: Image markers found.');
            const markers = content.match(/\[IMAGE:.*?\]/g);
            console.log('Markers:', markers);
        } else {
            console.error('FAIL: No image markers found.');
        }

        // Check for specific tone indicators if possible, or just manual review of output
        if (content.toLowerCase().includes('photosynthesis')) {
            console.log('PASS: Content seems relevant.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
};

run();

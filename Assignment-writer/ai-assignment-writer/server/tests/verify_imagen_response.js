const assert = require('node:assert/strict');

const run = async () => {
    const payload = {
        topic: 'What is AI?',
        subject: 'Computer Science',
        level: 'University',
        length: 'Short',
        pages: 1,
        style: 'Academic',
        includeImages: true,
        imageCount: 2,
        references: false,
        citationStyle: 'APA',
        language: 'English',
        urgency: 'Normal',
        instructions: '',
        images: []
    };

    const res = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    assert.equal(json.success, true);

    const generated = json?.data?.generatedImages || [];
    console.log('generatedImages:', generated.length);
    if (generated.length > 0) {
        console.log('firstPrefix:', String(generated[0]).slice(0, 30));
        assert.ok(String(generated[0]).startsWith('data:image'));
    }

    if (generated.length >= 2) {
        assert.notEqual(generated[0], generated[1]);
    }
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});


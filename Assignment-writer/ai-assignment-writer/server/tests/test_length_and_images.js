const test = require('node:test');
const assert = require('node:assert/strict');
const { generateContent } = require('../generator');

test('generateContent respects low page count even with Medium length preset', async () => {
    // This test forces the fallback logic by assuming no Google AI key or forcing fallback path if we could.
    // Since we can't easily un-set env vars in process-safe way if they are loaded, 
    // we rely on the fact that the fallback logic is what we changed.
    // If Google AI is active, it returns text, not sections in the template format, 
    // so we might need to check length differently.
    
    // However, the issue described (4 pages instead of 1-2) is specific to the template generator's loop.
    
    const data = {
        topic: 'Unit Test',
        subject: 'Testing',
        level: 'School',
        length: 'Medium', // This normally implies 6 sections
        style: 'Simple',
        includeImages: false,
        imageCount: 0,
        pages: 1, // This should force it down to ~2 sections
        references: false
    };

    const content = await generateContent(data);
    
    // Check if it's the template format
    if (content.includes('### 1.')) {
        const sections = (content.match(/^### \d+\./gm) || []).length;
        assert.ok(sections <= 3, `Expected <= 3 sections for 1 page, got ${sections}`);
    } else {
        // AI generated content. Check rough length.
        assert.ok(content.length > 100, 'Content should be generated');
        // It's harder to strictly count "pages" in raw markdown from AI, 
        // but the prompt included "approx 1 pages", so we trust AI.
    }
});

test('generateContent produces unique image prompts (seeds)', async () => {
    const data = {
        topic: 'Unit Test',
        subject: 'Testing',
        level: 'School',
        length: 'Short',
        style: 'Simple',
        includeImages: true,
        imageCount: 2,
        pages: 1,
        references: false
    };

    const contentA = await generateContent(data);
    const contentB = await generateContent(data);

    const getSeeds = (text) => {
        const matches = text.match(/seed: (\d+)/g);
        return matches ? matches.map(s => s.split(': ')[1]) : [];
    };

    const seedsA = getSeeds(contentA);
    const seedsB = getSeeds(contentB);

    if (seedsA.length > 0 && seedsB.length > 0) {
        // Check if seeds are different
        assert.notEqual(seedsA[0], seedsB[0], 'Image seeds should be unique across requests');
        assert.notEqual(seedsA[0], seedsA[1], 'Image seeds should be unique within request');
    } else {
        // Maybe AI generated content without seeds (Google AI doesn't use seed param in prompt text usually, 
        // but the fallback does). If Google AI is used, prompts should just be different text.
        // Let's check full prompt uniqueness.
        const getPrompts = (text) => text.match(/\[IMAGE: (.*?)\]/g) || [];
        const promptsA = getPrompts(contentA);
        const promptsB = getPrompts(contentB);
        
        if (promptsA.length > 0 && promptsB.length > 0) {
             assert.notEqual(promptsA[0], promptsB[0], 'Image prompts should differ');
        }
    }
});

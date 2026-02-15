const assert = require('assert');

// Mock data simulation
const mockData = {
    topic: "Quantum Computing",
    subject: "Computer Science",
    level: "PhD",
    length: "Detailed",
    style: "Academic",
    includeImages: true,
    imageCount: 3,
    instructions: "Focus on qubit stability."
};

function generateContent(data) {
    const { topic, subject, level, length, style, includeImages, imageCount, instructions } = data;

    let sectionCount = 3;
    if (length === 'Medium') sectionCount = 6;
    if (length === 'Detailed') sectionCount = 10;

    const instructionNote = instructions ? `\n\n**Special Instructions Consideration:** ${instructions}` : "";
    
    // Simulate content generation logic
    const content = `
# ${topic}: A Comprehensive Study in ${subject}

## Abstract
**${topic}** represents a pivotal area of study within the broader context of **${subject}**. This paper aims to provide a rigorous analysis suitable for a **${level}** audience... The writing style adopted is **${style}**...

${instructionNote}
    `.trim();

    return { content, sectionCount };
}

// Test 1: Verify Section Count based on Length
const resultDetailed = generateContent({ ...mockData, length: 'Detailed' });
assert.strictEqual(resultDetailed.sectionCount, 10, "Detailed length should produce 10 sections");

const resultMedium = generateContent({ ...mockData, length: 'Medium' });
assert.strictEqual(resultMedium.sectionCount, 6, "Medium length should produce 6 sections");

// Test 2: Verify Level and Style incorporation
const resultStyle = generateContent(mockData);
assert.ok(resultStyle.content.includes(`**${mockData.level}**`), "Content should include academic level");
assert.ok(resultStyle.content.includes(`**${mockData.style}**`), "Content should include writing style");

// Test 3: Verify Instructions incorporation
assert.ok(resultStyle.content.includes(mockData.instructions), "Content should include special instructions");

console.log("All parameter verification tests passed!");

const { generateContent } = require('../generator');

const run = async () => {
    // Test 1: Pages = 1, Length = Medium
    // Expected: Should be close to 1 page (e.g., 2-3 sections), not 6 sections.
    // Current logic: baseSections=6 (Medium), pageSections=2 (1*2). max(6,2) = 6.
    console.log('--- Test 1: Pages=1, Length=Medium ---');
    const data1 = {
        topic: 'Test', subject: 'Test', level: 'School', 
        length: 'Medium', style: 'Simple', includeImages: false, imageCount: 0, 
        pages: 1, references: false
    };
    
    // Force fallback by not setting API key (or we can just mock/ignore it, 
    // but the generator checks process.env.GOOGLE_API_KEY. 
    // We will unset it for this process or rely on the fact that verify script runs in a new process?)
    // Actually, let's just use the function directly.
    // NOTE: generateContent is async and might use Google AI if env var is set.
    // We want to test the FALLBACK logic mostly, as that's where the math is.
    
    // We'll temporarily unset the env var for this test if needed, but 
    // we can also just see what happens.
    
    const content1 = await generateContent(data1);
    const sections1 = (content1.match(/^### \d+\./gm) || []).length;
    console.log(`Pages: 1, Length: Medium -> Sections Generated: ${sections1}`);
    if (sections1 > 3) console.error('FAIL: Too many sections for 1 page request.');
    else console.log('PASS: Section count appropriate.');

    // Test 2: Image Uniqueness
    console.log('\n--- Test 2: Image Uniqueness ---');
    const data2 = {
        topic: 'Test', subject: 'Test', level: 'School', 
        length: 'Short', style: 'Simple', includeImages: true, imageCount: 2, 
        pages: 1, references: false
    };
    
    const content2a = await generateContent(data2);
    const content2b = await generateContent(data2);
    
    const extractImages = (c) => c.match(/\[IMAGE:.*?\]/g) || [];
    const imgsA = extractImages(content2a);
    const imgsB = extractImages(content2b);
    
    console.log('Run A Images:', imgsA);
    console.log('Run B Images:', imgsB);
    
    if (imgsA.length > 0 && imgsB.length > 0 && imgsA[0] !== imgsB[0]) {
        console.log('PASS: Images are unique between runs.');
    } else {
        console.error('FAIL: Images are identical or missing.');
    }
};

run();

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const { normalizeGeneratePayload, normalizeDownloadPayload, generateContent } = require('../generator');

const redDotDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('normalizeGeneratePayload validates and coerces values', () => {
    const normalized = normalizeGeneratePayload({
        topic: '  Quantum Computing  ',
        subject: 'Computer Science',
        level: 'PhD',
        length: 'Detailed',
        style: 'Academic',
        includeImages: 'true',
        imageCount: '2',
        pages: '3',
        references: 'true',
        citationStyle: 'APA',
        urgency: 'Normal',
        language: 'English',
        instructions: 'Focus on qubit stability.',
        images: [redDotDataUri]
    });

    assert.equal(normalized.ok, true);
    assert.equal(normalized.value.topic, 'Quantum Computing');
    assert.equal(normalized.value.includeImages, true);
    assert.equal(normalized.value.imageCount, 2);
    assert.equal(normalized.value.pages, 3);
    assert.equal(normalized.value.references, true);
});

test('normalizeGeneratePayload accepts direct and concise style', () => {
    const normalized = normalizeGeneratePayload({
        topic: 'AI safety',
        subject: 'Computer Science',
        level: 'University',
        length: 'Short',
        style: 'direct and concise',
        includeImages: false,
        imageCount: 0,
        pages: 2,
        references: false,
        citationStyle: 'APA',
        urgency: 'Normal',
        language: 'English',
        instructions: ''
    });

    assert.equal(normalized.ok, true);
    assert.equal(normalized.value.style, 'Direct and concise');
});

test('normalizeGeneratePayload maps Urdu variants', () => {
    const normalized = normalizeGeneratePayload({
        topic: 'Test',
        subject: 'Computer Science',
        level: 'University',
        length: 'Short',
        style: 'Academic',
        includeImages: false,
        imageCount: 0,
        pages: 1,
        references: false,
        citationStyle: 'APA',
        urgency: 'Normal',
        language: 'ur-PK',
        instructions: ''
    });
    assert.equal(normalized.ok, true);
    assert.equal(normalized.value.language, 'Urdu');
});

test('generateContent respects Urdu language via QA validation (template fallback)', async () => {
    const prevGoogle = process.env.GOOGLE_API_KEY;
    const prevOpenRouter = process.env.OPENROUTER_API_KEY;
    const prevOpenAi = process.env.OPENAI_API_KEY;
    process.env.GOOGLE_API_KEY = '';
    process.env.OPENROUTER_API_KEY = '';
    process.env.OPENAI_API_KEY = '';

    try {
        const normalized = normalizeGeneratePayload({
            topic: 'what is python programming',
            subject: 'Computer Science',
            level: 'School',
            length: 'Short',
            style: 'Academic',
            includeImages: false,
            imageCount: 0,
            pages: 1,
            references: false,
            citationStyle: 'APA',
            urgency: 'Normal',
            language: 'Urdu',
            instructions: ''
        });

        assert.equal(normalized.ok, true);
        const content = await generateContent(normalized.value);
        assert.ok(/^#\s+/.test(content));
        assert.ok(/^##\s+Abstract\b/im.test(content));
        const arabicLetters = (content.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
        assert.ok(arabicLetters >= 40);
    } finally {
        process.env.GOOGLE_API_KEY = prevGoogle;
        process.env.OPENROUTER_API_KEY = prevOpenRouter;
        process.env.OPENAI_API_KEY = prevOpenAi;
    }
});

test('generateContent emits exactly imageCount markers when enabled', async () => {
    const normalized = normalizeGeneratePayload({
        topic: 'Neural Networks',
        subject: 'Computer Science',
        level: 'University',
        length: 'Medium',
        style: 'Academic',
        includeImages: true,
        imageCount: 3,
        pages: 2,
        references: false,
        citationStyle: 'APA',
        urgency: 'Normal',
        language: 'English',
        instructions: ''
    });

    assert.equal(normalized.ok, true);
    const content = await generateContent(normalized.value);
    const matches = content.match(/\[IMAGE:/g) || [];
    assert.equal(matches.length, 3);
});

test('normalizeDownloadPayload preserves seed for exports', () => {
    const normalized = normalizeDownloadPayload({
        topic: 'AI in Education',
        subject: 'Computer Science',
        level: 'University',
        length: 'Short',
        style: 'Academic',
        includeImages: true,
        imageCount: 2,
        pages: 1,
        references: false,
        citationStyle: 'APA',
        urgency: 'Normal',
        language: 'English',
        instructions: '',
        seed: 54321,
        content: '# Title\n[IMAGE: A]\n[IMAGE: B]'
    });

    assert.equal(normalized.ok, true);
    assert.equal(normalized.value.seed, 54321);
});

const runPython = (scriptName, payload) => {
    return new Promise((resolve, reject) => {
        const serverDir = path.join(__dirname, '..');
        const scriptPath = path.join(serverDir, 'python_services', scriptName);
        const proc = spawn('python', [scriptPath], { cwd: serverDir });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); });

        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(stderr || `Python exited with ${code}`));
                return;
            }
            resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        });

        proc.stdin.write(JSON.stringify(payload));
        proc.stdin.end();
    });
};

test('DOCX export embeds marker images without network (uses uploaded images)', async () => {
    const id = `t_docx_${Date.now()}`;
    const payload = {
        id,
        topic: 'Test Assignment',
        subject: 'Computer Science',
        level: 'University',
        includeImages: true,
        imageCount: 2,
        images: [redDotDataUri, redDotDataUri],
        content: [
            '# Title',
            '## Section',
            '1. First step',
            '2. Second step',
            '',
            '[IMAGE: Diagram 1]',
            '',
            '- Bullet item',
            '',
            '[IMAGE: Diagram 2]'
        ].join('\n')
    };

    const { stdout } = await runPython('generate_docx.py', payload);
    const filePath = path.join(__dirname, '..', stdout);
    assert.ok(fs.existsSync(filePath));
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0);
    fs.unlinkSync(filePath);
});

test('PDF export embeds marker images without network (uses uploaded images)', async () => {
    const id = `t_pdf_${Date.now()}`;
    const payload = {
        id,
        topic: 'Test Assignment',
        subject: 'Computer Science',
        level: 'University',
        includeImages: true,
        imageCount: 2,
        images: [redDotDataUri, redDotDataUri],
        content: [
            '# Title',
            '## Section',
            '1. First step',
            '2. Second step',
            '',
            '[IMAGE: Diagram 1]',
            '',
            '- Bullet item',
            '',
            '[IMAGE: Diagram 2]'
        ].join('\n')
    };

    const { stdout } = await runPython('generate_pdf.py', payload);
    const filePath = path.join(__dirname, '..', stdout);
    assert.ok(fs.existsSync(filePath));
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0);
    fs.unlinkSync(filePath);
});

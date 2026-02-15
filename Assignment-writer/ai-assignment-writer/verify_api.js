const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testGenerate() {
    console.log('Testing /api/generate...');
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'The Future of Renewable Energy',
                subject: 'Engineering',
                level: 'Masters',
                length: 'Detailed',
                style: 'Academic',
                includeImages: true,
                imageCount: 3
            })
        });
        const data = await response.json();
        if (data.success && data.data.content) {
            console.log('✅ /api/generate Passed');
            return data.data;
        } else {
            console.error('❌ /api/generate Failed', data);
        }
    } catch (e) {
        console.error('❌ /api/generate Error:', e.message);
    }
}

async function testDownload(data, type) {
    console.log(`Testing /api/download/${type}...`);
    try {
        const response = await fetch(`${API_URL}/download/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength > 0) {
                console.log(`✅ /api/download/${type} Passed (Size: ${buffer.byteLength} bytes)`);
            } else {
                console.error(`❌ /api/download/${type} Failed: Empty file`);
            }
        } else {
            console.error(`❌ /api/download/${type} Failed: ${response.statusText}`);
        }
    } catch (e) {
        console.error(`❌ /api/download/${type} Error:`, e.message);
    }
}

async function run() {
    const data = await testGenerate();
    if (data) {
        await testDownload(data, 'docx');
        await testDownload(data, 'pdf');
    }
}

run();

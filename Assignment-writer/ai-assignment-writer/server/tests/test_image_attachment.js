const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const redDot = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const payload = {
    topic: "Test Assignment",
    subject: "Computer Science",
    level: "University",
    length: "Short",
    style: "Academic",
    includeImages: true,
    imageCount: 1,
    content: "This is a test assignment.\n\n### Section 1\nHere is some content.\n\nThis should have an image below it.",
    id: "test_" + Date.now(),
    images: [redDot]
};

function runTest(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`Running ${scriptName}...`);
        // The scripts are in ../python_services relative to this test file
        const scriptPath = path.join(__dirname, '..', 'python_services', scriptName);
        // Set CWD to server directory (..) so that output files are saved there or we can control it
        const serverDir = path.join(__dirname, '..');
        
        const pythonProcess = spawn('python', [scriptPath], { cwd: serverDir });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdin.write(JSON.stringify(payload));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (chunk) => {
            outputData += chunk.toString();
        });

        pythonProcess.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`${scriptName} failed: ${errorData}`);
                reject(errorData);
            } else {
                console.log(`${scriptName} success. Output: ${outputData.trim()}`);
                resolve(outputData.trim());
            }
        });
    });
}

async function main() {
    try {
        const docxFile = await runTest('generate_docx.py');
        const docxPath = path.join(__dirname, '..', docxFile);
        if (fs.existsSync(docxPath)) {
            console.log(`Verified DOCX created: ${docxPath}`);
            // Cleanup
            fs.unlinkSync(docxPath);
            console.log("DOCX cleaned up.");
        } else {
            console.error("DOCX file was not created");
        }

        const pdfFile = await runTest('generate_pdf.py');
        const pdfPath = path.join(__dirname, '..', pdfFile);
        if (fs.existsSync(pdfPath)) {
            console.log(`Verified PDF created: ${pdfPath}`);
            // Cleanup
            fs.unlinkSync(pdfPath);
            console.log("PDF cleaned up.");
        } else {
            console.error("PDF file was not created");
        }
        
    } catch (e) {
        console.error("Test failed", e);
        process.exit(1);
    }
}

main();

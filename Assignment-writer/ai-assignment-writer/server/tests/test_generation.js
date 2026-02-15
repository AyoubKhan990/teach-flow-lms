const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const payload = {
    topic: "Space Exploration",
    subject: "Physics",
    level: "University",
    length: "Medium",
    style: "Academic",
    includeImages: true,
    imageCount: 2,
    content: "Space exploration is fascinating.\n\n[IMAGE: A rocket launching into space]\n\nIt requires advanced propulsion systems.\n\n[IMAGE: An astronaut floating in zero gravity]\n\nSafety is paramount.",
    id: "test_gen_" + Date.now(),
    images: [] // Empty to force generation
};

function runTest(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`Running ${scriptName}...`);
        const scriptPath = path.join(__dirname, '..', 'python_services', scriptName);
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
                if (errorData) console.log(`${scriptName} stderr: ${errorData}`);
                console.log(`${scriptName} success. Output: ${outputData.trim()}`);
                resolve(outputData.trim());
            }
        });
    });
}

async function main() {
    try {
        console.log("Testing Dynamic Image Generation (requires internet for Pollinations AI)...");
        
        const docxFile = await runTest('generate_docx.py');
        const docxPath = path.join(__dirname, '..', docxFile);
        if (fs.existsSync(docxPath)) {
            console.log(`Verified DOCX created: ${docxPath}`);
            // fs.unlinkSync(docxPath);
        }

        const pdfFile = await runTest('generate_pdf.py');
        const pdfPath = path.join(__dirname, '..', pdfFile);
        if (fs.existsSync(pdfPath)) {
            console.log(`Verified PDF created: ${pdfPath}`);
            // fs.unlinkSync(pdfPath);
        }
        
    } catch (e) {
        console.error("Test failed", e);
        process.exit(1);
    }
}

main();

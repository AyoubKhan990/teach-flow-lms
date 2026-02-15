require('dotenv').config();
const { generateAssignmentContent } = require('../googleAi');

const run = async () => {
    console.log("Testing Google AI with specific topic...");
    const result = await generateAssignmentContent({
        apiKey: process.env.GOOGLE_API_KEY,
        topic: "The exact tools i use to build, optimize and rank client's website",
        subject: "Computer Science",
        level: "University",
        length: "Medium",
        style: "Academic",
        includeImages: true,
        imageCount: 2,
        pages: 2,
        language: "French"
    });

    if (result.ok) {
        console.log("Success!");
        console.log("Snippet:", result.value.slice(0, 200));
    } else {
        console.error("Failed:", result.reason);
    }
};

run();

const GEMINI_API_KEY = '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function getApiKey() {
    const userKey = document.getElementById('gemini-api-key')?.value;
    return userKey || GEMINI_API_KEY;
}

async function callGeminiAPI(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('No Gemini API key provided');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Unexpected API response format');
}

async function generateProfessionalSummary(jobTitle, experience = '', skills = '') {
    const prompt = `Write a compelling professional summary for a CV/resume. 
    
Job Title: ${jobTitle || 'Professional'}
${experience ? `Experience includes: ${experience}` : ''}
${skills ? `Key skills: ${skills}` : ''}

Requirements:
- Write in first person implied (no "I" statements)
- Keep it to 3-4 sentences (50-80 words)
- Highlight key strengths and value proposition
- Make it professional and impactful
- Focus on achievements and expertise

Return ONLY the summary text, no quotes or extra formatting.`;

    return await callGeminiAPI(prompt);
}

async function generateJobDescription(jobTitle, company, industry = '') {
    const prompt = `Generate 4-5 professional bullet points for a CV job description.

Job Title: ${jobTitle}
Company: ${company}
${industry ? `Industry: ${industry}` : ''}

Requirements:
- Start each point with a strong action verb
- Include quantifiable achievements where possible
- Focus on results and impact
- Keep each bullet point to 1-2 lines
- Make them specific and professional

Format: Return each bullet point on a new line, starting with "• "`;

    return await callGeminiAPI(prompt);
}

async function generateSkillsSuggestions(jobTitle, existingSkills = '') {
    const prompt = `Suggest relevant professional skills for a CV.

Job Title: ${jobTitle}
${existingSkills ? `Currently listed skills: ${existingSkills}` : ''}

Provide two categories:
1. Technical Skills (6-8 skills)
2. Soft Skills (5-6 skills)

Format your response exactly like this:
TECHNICAL: skill1, skill2, skill3, skill4, skill5, skill6
SOFT: skill1, skill2, skill3, skill4, skill5

Only provide skills relevant to the job title. Be specific and professional.`;

    return await callGeminiAPI(prompt);
}

async function improveText(text, context = 'professional summary') {
    const prompt = `Improve the following ${context} for a CV/resume. Make it more professional, impactful, and well-written while maintaining the same meaning.

Original text:
${text}

Requirements:
- Improve grammar and clarity
- Use stronger action words
- Keep the same approximate length
- Maintain professional tone

Return ONLY the improved text, no explanations.`;

    return await callGeminiAPI(prompt);
}

document.addEventListener('DOMContentLoaded', () => {
    initAIFeatures();
});

function initAIFeatures() {
    const aiSummaryBtn = document.getElementById('ai-generate-bio');
    if (aiSummaryBtn) {
        aiSummaryBtn.addEventListener('click', handleGenerateSummary);
    }

    const expList = document.getElementById('experience-list');
    if (expList) {
        expList.addEventListener('click', (e) => {
            if (e.target.closest('.ai-generate-exp')) {
                handleGenerateExperience(e.target.closest('.ai-generate-exp'));
            }
        });
    }
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || '<i class="fas fa-wand-magic-sparkles"></i> AI Generate';
        button.disabled = false;
    }
}

async function handleGenerateExperience(btn) {
    const parent = btn.closest('.dynamic-item');
    if (!parent) return;

    const jobTitleField = parent.querySelector('.inp-job');
    const companyField = parent.querySelector('.inp-company');
    const descField = parent.querySelector('.inp-desc');

    if (!descField) return;

    const jobTitle = jobTitleField?.value || 'Professional';
    const company = companyField?.value || 'Company';

    setButtonLoading(btn, true);

    try {
        const description = await generateJobDescription(jobTitle, company);
        descField.value = description.trim();
        descField.dispatchEvent(new Event('input', { bubbles: true }));
        showAINotification('Job description generated successfully!', 'success');
    } catch (error) {
        const fallbackDesc = generateFallbackExperience(jobTitle, company);
        descField.value = fallbackDesc;
        descField.dispatchEvent(new Event('input', { bubbles: true }));

        const message = String(error?.message || '').includes('No Gemini API key')
            ? 'Add a Gemini API key to enable AI. Using template instead.'
            : 'Used template description. Check console for details.';
        showAINotification(message, 'warning');
        console.error('Experience generation error:', error);
    } finally {
        setButtonLoading(btn, false);
    }
}

function generateFallbackExperience(jobTitle, company) {
    const templates = [
        `• Managed and optimized key projects for ${company} as a ${jobTitle}.\n• Collaborated with cross-functional teams to achieve organizational goals.\n• Implemented new processes that increased efficiency and productivity.\n• Delivered high-quality results within strict deadlines and budgets.`,
        `• Led a team of professionals at ${company} to deliver exceptional ${jobTitle} services.\n• Developed and executed strategic plans to drive business growth.\n• Mentored team members and fostered a culture of continuous improvement.\n• Analyzed complex data to make informed business decisions.`,
        `• Streamlined operations for ${company} in the role of ${jobTitle}.\n• Identified and resolved critical issues to ensure seamless workflow.\n• Enhanced customer satisfaction through effective communication and support.\n• Consistently exceeded performance targets and expectations.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

async function handleGenerateSummary() {
    const btn = document.getElementById('ai-generate-bio');
    const summaryField = document.querySelector('textarea[name="summary"]');
    const jobTitleField = document.querySelector('input[name="jobTitle"]');
    const skillsField = document.querySelector('input[name="skills"]');

    if (!summaryField) return;

    const jobTitle = jobTitleField?.value || 'Professional';
    const skills = skillsField?.value || '';

    setButtonLoading(btn, true);

    try {
        const summary = await generateProfessionalSummary(jobTitle, '', skills);
        summaryField.value = summary.trim();
        summaryField.dispatchEvent(new Event('input', { bubbles: true }));
        showAINotification('Professional summary generated successfully!', 'success');
    } catch (error) {
        const fallbackSummary = generateFallbackSummary(jobTitle, skills);
        summaryField.value = fallbackSummary;
        summaryField.dispatchEvent(new Event('input', { bubbles: true }));

        const message = String(error?.message || '').includes('No Gemini API key')
            ? 'Add a Gemini API key to enable AI. Using template instead.'
            : 'Used template summary. Check console for details.';
        showAINotification(message, 'warning');
        console.error('Summary generation error:', error);
    } finally {
        setButtonLoading(btn, false);
    }
}

function generateFallbackSummary(jobTitle, skills) {
    const skillsList = skills ? skills.split(',').slice(0, 3).map(s => s.trim()).join(', ') : 'problem-solving, leadership, and communication';

    const templates = [
        `Results-driven ${jobTitle} with a proven track record of delivering exceptional outcomes. Skilled in ${skillsList}, with a passion for driving innovation and achieving organizational goals. Committed to continuous improvement and excellence in all professional endeavors.`,
        `Dynamic and accomplished ${jobTitle} bringing extensive experience and expertise to drive success. Proficient in ${skillsList}, with a strong ability to lead teams and manage complex projects. Dedicated to delivering high-quality results and fostering collaborative work environments.`,
        `Highly motivated ${jobTitle} with comprehensive knowledge and hands-on experience in the field. Expert in ${skillsList}, with excellent analytical and strategic thinking abilities. Proven ability to adapt to new challenges and deliver innovative solutions.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

function showAINotification(message, type = 'info') {
    const existing = document.querySelector('.ai-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

window.generateProfessionalSummary = generateProfessionalSummary;
window.generateJobDescription = generateJobDescription;
window.generateSkillsSuggestions = generateSkillsSuggestions;
window.improveText = improveText;
window.showAINotification = showAINotification;


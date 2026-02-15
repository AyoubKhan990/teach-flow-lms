const https = require('node:https');
const { getTargetWordRange } = require('./contentQuality');

const postJson = (url, body, { timeoutMs, headers }) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(headers || {})
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(raw);
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timeout')));
    req.write(body);
    req.end();
  });
};

const extractChatText = (json) => {
  const text = json?.choices?.[0]?.message?.content;
  return typeof text === 'string' ? text.trim() : '';
};

const buildPrompt = ({ topic, subject, level, length, style, pages, includeImages, imageCount, instructions, language, englishVariant, seed, references, citationStyle }) => {
  const range = getTargetWordRange({ pages, level, style });
  const styleLower = String(style || '').toLowerCase();
  const concise = styleLower === 'direct and concise' || styleLower === 'direct_and_concise' || styleLower === 'concise';

  const imageInstruction = includeImages
    ? `You MUST include exactly ${imageCount} image markers. Place them after relevant section headings.
Format exactly: [IMAGE: SECTION_TITLE="<Exact Section Title>" || KEYWORDS="<3 simple visual nouns, comma-separated>" || DESCRIPTION="<Short description>"]`
    : 'Do NOT include any image markers.';

  const languageInstruction = language && language !== 'English' && language !== 'EnglishUK'
    ? `Write all explanatory text in ${language}. Keep Markdown headings (H1/H2/H3) and any image markers exactly in English. Do NOT write English sentences in the body paragraphs.`
    : (englishVariant === 'UK'
      ? 'Write in English using British spelling and punctuation.'
      : 'Write in English.');

  const styleRules = concise
    ? [
      'Use short sentences and short paragraphs (2–4 lines).',
      'Avoid fluff, clichés, and generic filler.',
      'Prefer concrete claims and clear structure over rhetorical phrasing.',
      'Use bullet points where helpful; keep headings informative.',
      'Avoid repeating the same phrases (e.g., "In conclusion" in multiple places).',
      'No long quotes, no invented interviews, no fake statistics.'
    ].join('\n')
    : [
      'Maintain an academically rigorous tone matching the selected style.',
      'Do not invent named sources, DOIs, or page numbers.',
      'Avoid generic filler and repetition; keep arguments grounded and specific.'
    ].join('\n');

  const structureRules = [
    'Follow standard assignment structure:',
    '- Include H2 headings: "Abstract", "Introduction", "Main Body", and "Conclusion".',
    '- Abstract: 4–6 sentences summarizing purpose + key points + conclusion (no quotes).',
    '- Introduction: background + why it matters + clear outline of what follows.',
    '- Main Body: 3–6 sections or paragraphs, one main idea per paragraph.',
    '- Conclusion: summarize findings only; do not add new information.',
    '- Suggested balance: Introduction ~10–15%, Main Body ~70–80%, Conclusion ~10–15% of total words.',
    '- Paragraphing: keep paragraphs short (2–5 sentences). Split large paragraphs into smaller ones.',
    '- Readability: include at least 2 bullet lists in the Main Body (e.g., steps, pros/cons, key points).',
    '- Emphasis: include 1 short blockquote (>) labeled "Key takeaway" somewhere in the Main Body.',
    '',
    'Write body paragraphs using a PEEL-style flow (do NOT label PEEL):',
    '- Point (topic sentence), Evidence (example or credible source claim), Explanation (why it supports the point), Link (transition to next idea).',
    'Use connecting words (e.g., however, therefore, consequently, in contrast) to keep a smooth flow.',
    'Avoid repetition: do not reuse the same key-terms list or the same example across sections.',
    '',
    'If references are requested, include a final H2 "References" section formatted in the requested citation style and use only well-known, verifiable sources (e.g., official documentation, standard textbooks).'
  ].join('\n');

  const referenceInstruction = references
    ? `REFERENCES: Include a final H2 section "References" in ${citationStyle || 'APA'} style. Use 3–6 real, widely known sources. Do not invent DOIs or page numbers.`
    : 'REFERENCES: Do NOT include a References section unless explicitly requested.';

  return [
    'ROLE: Expert academic writer.',
    `TASK: Write a ${length} assignment on "${topic}" for the subject "${subject}".`,
    `AUDIENCE: ${level}.`,
    `STYLE: ${style}.`,
    `LENGTH CONTROL: Target ${range.target} words; must be between ${range.min} and ${range.max} words.`,
    `PAGES: Exactly ${pages} page(s) in typical academic formatting; do not exceed/underflow the word range.`,
    `IMAGES: ${imageInstruction}`,
    `LANGUAGE: ${languageInstruction}`,
    referenceInstruction,
    instructions ? `USER INSTRUCTIONS: ${instructions}` : '',
    `VARIATION SEED: ${seed || 0}`,
    '',
    'FORMAT REQUIREMENTS:',
    '- Output in Markdown.',
    '- Start with a single H1 title (# ...).',
    '- Use H2 for major sections and H3 for subsections.',
    '- Use Markdown lists when presenting multiple items (bullets or numbered lists).',
    '- Use Markdown blockquotes (>) sparingly for brief emphasis (e.g., Key takeaway).',
    '- No preamble and no meta commentary about tone/structure.',
    '',
    'STRUCTURE & WRITING GUIDELINES:',
    structureRules,
    '',
    'QUALITY BAR:',
    '- Must be specific to the topic and subject area.',
    '- Include clear definitions, mechanisms, and at least one applied example.',
    '- Ensure internal consistency and avoid placeholders.',
    '',
    'STYLE RULES:',
    styleRules
  ].filter(Boolean).join('\n');
};

const generateAssignmentContentOpenAI = async ({ apiKey, model, ...payload }) => {
  if (!apiKey) return { ok: false, value: null, reason: 'missing_key' };
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = buildPrompt(payload);
  const body = JSON.stringify({
    model: model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o',
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You write high-quality academic assignments following strict constraints.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 7000
  });

  try {
    const raw = await postJson(url, body, { timeoutMs: 70000, headers: { Authorization: `Bearer ${apiKey}` } });
    const text = extractChatText(JSON.parse(raw));
    if (!text) return { ok: false, value: null, reason: 'empty' };
    return { ok: true, value: text };
  } catch (e) {
    return { ok: false, value: null, reason: e?.message || 'error' };
  }
};

module.exports = {
  buildPrompt,
  generateAssignmentContentOpenAI
};

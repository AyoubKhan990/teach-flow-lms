const https = require('node:https');
const { buildPrompt } = require('./openAiText');

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

const generateAssignmentContentOpenRouter = async ({ apiKey, model, ...payload }) => {
  if (!apiKey) return { ok: false, value: null, reason: 'missing_key' };

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const prompt = buildPrompt(payload);
  const body = JSON.stringify({
    model: model || process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4.5',
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You write high-quality academic assignments following strict constraints.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 7000
  });

  try {
    const raw = await postJson(url, body, {
      timeoutMs: 70000,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    const text = extractChatText(JSON.parse(raw));
    if (!text) return { ok: false, value: null, reason: 'empty' };
    return { ok: true, value: text };
  } catch (e) {
    return { ok: false, value: null, reason: e?.message || 'error' };
  }
};

module.exports = {
  generateAssignmentContentOpenRouter
};

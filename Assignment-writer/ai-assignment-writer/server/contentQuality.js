const crypto = require('node:crypto');

const countWords = (text) => {
  if (typeof text !== 'string') return 0;
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[IMAGE:[^\]]*\]/g, ' ')
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').filter(Boolean).length;
};

const countImageMarkers = (text) => {
  if (typeof text !== 'string') return 0;
  const matches = text.match(/\[IMAGE:/g);
  return matches ? matches.length : 0;
};

const stripCodeFences = (content) => {
  if (typeof content !== 'string') return content;
  return content
    .replace(/```[a-zA-Z0-9_-]*\n/g, '')
    .replace(/```/g, '')
    .trim();
};

const dedupeExactParagraphs = (content) => {
  if (typeof content !== 'string') return content;
  const text = content.trim();
  if (!text) return text;

  const paras = text.split(/\n\n+/);
  const seen = new Set();
  const out = [];

  for (const p of paras) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const isHeading = /^#{1,6}\s+/.test(trimmed);
    const key = trimmed.replace(/\s+/g, ' ').toLowerCase();
    if (!isHeading && trimmed.length >= 120) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(trimmed);
  }
  return out.join('\n\n').trim();
};

const splitIntoSentences = (text) => {
  const t = String(text || '').trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+(?=[A-Z0-9("“'])/g).map((x) => x.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [t];
};

const splitLongSentence = ({ sentence, targetWords }) => {
  const s = String(sentence || '').trim();
  if (!s) return [];
  if (countWords(s) <= targetWords) return [s];

  const separators = ['; ', ', '];
  for (const sep of separators) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep).map((p) => p.trim()).filter(Boolean);
    const out = [];
    let buf = '';
    for (const part of parts) {
      const candidate = buf ? `${buf}${sep}${part}` : part;
      if (countWords(candidate) <= targetWords || !buf) {
        buf = candidate;
      } else {
        out.push(buf);
        buf = part;
      }
    }
    if (buf) out.push(buf);
    if (out.length > 1) return out;
  }
  return [s];
};

const breakLongParagraphs = ({ content, maxWords = 90, targetWords = 55 }) => {
  if (typeof content !== 'string') return content;
  const text = content.trim();
  if (!text) return text;

  const paras = text.split(/\n\n+/);
  const out = [];

  for (const p of paras) {
    let para = p.trim();
    if (!para) continue;

    const hasStructuredLine = para
      .split('\n')
      .some((line) => {
        const t = line.trim();
        return (
          /^#{1,6}\s+/.test(t) ||
          /^\[IMAGE:/.test(t) ||
          /^[-*+]\s+/.test(t) ||
          /^\d+\.\s+/.test(t) ||
          /^>\s*/.test(t) ||
          /^\|/.test(t)
        );
      });

    if (!hasStructuredLine && para.includes('\n')) {
      para = para.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const isStructured =
      /^#{1,6}\s+/.test(para) ||
      /^\[IMAGE:/.test(para) ||
      /^[-*+]\s+/.test(para) ||
      /^\d+\.\s+/.test(para) ||
      /^>\s*/.test(para) ||
      /^\|/.test(para) ||
      /\n\s*[-*+]\s+/.test(para) ||
      /\n\s*\d+\.\s+/.test(para) ||
      /\n\s*>\s*/.test(para) ||
      /\n\s*\|/.test(para);

    if (isStructured || countWords(para) <= maxWords) {
      out.push(para);
      continue;
    }

    const sentences = splitIntoSentences(para).flatMap((s) => splitLongSentence({ sentence: s, targetWords }));
    if (sentences.length <= 1) {
      out.push(para);
      continue;
    }

    let buf = '';
    for (const s of sentences) {
      const candidate = buf ? `${buf} ${s}` : s;
      if (!buf || countWords(candidate) <= targetWords) {
        buf = candidate;
      } else {
        out.push(buf.trim());
        buf = s;
      }
    }
    if (buf) out.push(buf.trim());
  }

  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
};

const normalizeHeadingSpacing = (content) => {
  if (typeof content !== 'string') return content;
  const lines = content.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);
    const trimmed = line.trim();
    const next = i + 1 < lines.length ? lines[i + 1] : undefined;
    if (/^#{1,6}\s+/.test(trimmed) && next !== undefined && next.trim().length > 0) {
      out.push('');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const removeEchoedInstructions = ({ payload, content }) => {
  if (typeof content !== 'string') return content;
  const instructions = String(payload?.instructions || '').trim();
  if (!instructions) return content;

  const lines = content.split('\n');
  const out = [];
  const needle = instructions.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (i < 140) {
      if (t.toLowerCase() === needle) continue;
      if (/^user instructions\s*:/i.test(t)) continue;
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const countListLines = (content) => {
  const text = typeof content === 'string' ? content : '';
  const matches = text.match(/^\s*([-*+]\s+|\d+\.\s+)/gm) || [];
  return matches.length;
};

const countBlockquoteLines = (content) => {
  const text = typeof content === 'string' ? content : '';
  const matches = text.match(/^\s*>/gm) || [];
  return matches.length;
};

const ensureReadabilityElements = ({ payload, content, availableWords }) => {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) return text;

  const listLines = countListLines(text);
  const quoteLines = countBlockquoteLines(text);
  const needLists = listLines < 2;
  const needQuote = quoteLines < 1;
  if (!needLists && !needQuote) return text;

  const topic = String(payload?.topic || 'the topic').trim();
  const subject = String(payload?.subject || 'the subject').trim();
  const language = String(payload?.language || 'English');

  const compact = typeof availableWords === 'number' && availableWords < 90;
  const blockLines = [''];

  if (needLists) {
    blockLines.push('### Key Points');
    if (language === 'Urdu') {
      blockLines.push(`- **${topic}** کی تعریف **${subject}** کے تناظر میں کریں۔`);
      blockLines.push('- بنیادی طریقۂ کار اور خطرات کے مقامات واضح کریں۔');
      blockLines.push('- کم از کم ایک ٹھوس مثال شامل کریں۔');
      blockLines.push('- عملی حل اور ان کے فوائد/نقصانات بیان کریں۔');
    } else {
      blockLines.push(`- Define **${topic}** in the context of **${subject}**.`);
      blockLines.push('- Explain key mechanisms and where risks arise.');
      blockLines.push('- Give at least one concrete example.');
      blockLines.push('- Summarize practical mitigations and trade-offs.');
    }
    blockLines.push('');

    if (!compact) {
      blockLines.push('### Practical Checklist');
      if (language === 'Urdu') {
        blockLines.push('- تعریفیں واضح رکھیں اور اصطلاحات ایک ہی معنی میں استعمال کریں۔');
        blockLines.push('- دعووں کی حمایت کے لیے مثال یا قابلِ بھروسہ دلیل دیں۔');
        blockLines.push('- ہر پیراگراف کو ربطی الفاظ کے ذریعے اگلے خیال سے جوڑیں۔');
        blockLines.push('- نتیجے میں نئی بات شامل نہ کریں؛ صرف خلاصہ دیں۔');
      } else {
        blockLines.push('- Use clear definitions and keep terms consistent.');
        blockLines.push('- Support claims with a concrete example or credible source claim.');
        blockLines.push('- Connect each paragraph to the argument using transitions.');
        blockLines.push('- Summarize only what was argued; do not introduce new ideas in the conclusion.');
      }
      blockLines.push('');
    }
  }

  if (needQuote) {
    if (language === 'Urdu') {
      blockLines.push(`> Key takeaway: **${topic}** پر مضبوط تحریر مخصوص، دلیل/مثال پر مبنی، اور سمجھنے میں آسان ہوتی ہے۔`);
    } else {
      blockLines.push(`> Key takeaway: Strong work on **${topic}** stays specific, uses evidence or examples, and keeps the reasoning easy to follow.`);
    }
    blockLines.push('');
  }

  const insertBlock = blockLines.join('\n');

  const lines = text.split('\n');
  const mainIndex = lines.findIndex((l) => /^##\s+main body\b/i.test(l.trim()));
  if (mainIndex < 0) return text;

  const before = lines.slice(0, mainIndex + 1).join('\n');
  const after = lines.slice(mainIndex + 1).join('\n').trimStart();

  return `${before}${insertBlock}\n${after}`.replace(/\n{3,}/g, '\n\n').trim();
};

const hashText = (text) => {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
};

const getLanguageMetrics = ({ payload, content }) => {
  const language = String(payload?.language || 'English');
  const text = typeof content === 'string' ? content : '';
  if (!text) return { language, totalLetters: 0, latinLetters: 0, arabicLetters: 0, arabicRatio: 0, latinRatio: 0 };

  const withoutReferences = text.replace(/\n##\s+References\b[\s\S]*$/im, '').trim();
  const withoutMarkers = withoutReferences
    .replace(/\[IMAGE:[^\]]*\]/g, ' ')
    .split('\n')
    .filter((l) => !/^#{1,6}\s+/.test(l.trim()))
    .join('\n');

  const cleaned = withoutMarkers
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const allLetters = cleaned.match(/\p{L}/gu) || [];
  const latinLetters = cleaned.match(/[A-Za-z]/g) || [];
  const arabicLetters = cleaned.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || [];

  const totalLetters = allLetters.length;
  const latin = latinLetters.length;
  const arabic = arabicLetters.length;
  return {
    language,
    totalLetters,
    latinLetters: latin,
    arabicLetters: arabic,
    arabicRatio: totalLetters ? arabic / totalLetters : 0,
    latinRatio: totalLetters ? latin / totalLetters : 0
  };
};

const validateLanguageAgainstParams = ({ payload, content }) => {
  const language = String(payload?.language || 'English');
  const metrics = getLanguageMetrics({ payload, content });
  if (!metrics.totalLetters) return { ok: false, language, metrics, message: 'Content has no letters.' };

  if (language === 'Urdu') {
    const ok = metrics.arabicLetters >= 40 && metrics.arabicRatio >= 0.35;
    return { ok, language, metrics, message: ok ? 'ok' : 'Urdu selected but content is not predominantly Urdu script.' };
  }

  if (language === 'English' || language === 'EnglishUK') {
    const ok = metrics.latinRatio >= 0.5 && metrics.arabicRatio <= 0.2;
    return { ok, language, metrics, message: ok ? 'ok' : 'English selected but content appears to be another script.' };
  }

  return { ok: true, language, metrics, message: 'ok' };
};

const isLikelyGeneric = (content) => {
  const text = typeof content === 'string' ? content : '';
  if (!text) return true;
  const hay = text.toLowerCase();
  const flags = [
    '2x faster',
    'dropped by **30%**',
    'dr. emily chen',
    'global research institute',
    'annual report on',
    'the implications of these findings are profound'
  ];
  if (flags.some((f) => hay.includes(f))) return true;
  const repeated = hay.match(/\b(\w{4,})\b(?:\s+\1\b){3,}/);
  if (repeated) return true;
  const wordCount = countWords(text);
  const uniqueWords = new Set(hay.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean));
  if (wordCount > 200 && uniqueWords.size / Math.max(1, wordCount) < 0.28) return true;
  return false;
};

const wordsPerPageFor = ({ level, style }) => {
  const baseByLevel = {
    School: 220,
    College: 250,
    University: 280,
    Masters: 300,
    PhD: 320
  };
  const base = baseByLevel[level] || 280;
  const normalizedStyle = String(style || '').toLowerCase();
  if (normalizedStyle === 'direct and concise' || normalizedStyle === 'direct_and_concise' || normalizedStyle === 'concise') {
    return Math.max(180, Math.round(base * 0.78));
  }
  if (normalizedStyle === 'simple') {
    return Math.max(200, Math.round(base * 0.9));
  }
  if (normalizedStyle === 'creative') {
    return Math.round(base * 1.05);
  }
  return base;
};

const getTargetWordRange = ({ pages, level, style }) => {
  const p = Math.max(1, Math.min(20, Number(pages) || 1));
  const wpp = wordsPerPageFor({ level, style });
  const target = Math.round(p * wpp);
  const min = Math.max(150, Math.round(target * 0.95));
  const max = Math.round(target * 1.05);
  return { target, min, max, wordsPerPage: wpp };
};

const ensureH1Title = ({ content, topic, subject }) => {
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) return '';
  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length === 0) continue;
    if (lines[i].startsWith('# ')) return trimmed;
    const title = String(topic || 'Assignment').trim();
    const suffix = subject ? ` — ${String(subject).trim()}` : '';
    return [`# ${title}${suffix}`, '', ...lines].join('\n').trim();
  }
  return trimmed;
};

const validateContentAgainstParams = ({ payload, content }) => {
  const issues = [];
  const wordCount = countWords(content);
  const markerCount = countImageMarkers(content);
  const range = getTargetWordRange({ pages: payload.pages, level: payload.level, style: payload.style });

  if (payload.includeImages) {
    if (markerCount !== payload.imageCount) {
      issues.push({ code: 'IMAGE_MARKERS', message: `Expected exactly ${payload.imageCount} image markers but found ${markerCount}.` });
    }
  } else {
    if (markerCount !== 0) {
      issues.push({ code: 'IMAGE_MARKERS', message: 'No image markers are allowed when images are disabled.' });
    }
  }

  if (wordCount < range.min) {
    issues.push({ code: 'LENGTH_UNDER', message: `Content is too short for ${payload.pages} page(s).` });
  }
  if (wordCount > range.max) {
    issues.push({ code: 'LENGTH_OVER', message: `Content is too long for ${payload.pages} page(s).` });
  }

  const trimmed = String(content || '').trim();
  if (!trimmed.startsWith('# ')) {
    issues.push({ code: 'STRUCTURE', message: 'Content must start with an H1 title.' });
  }

  const required = ['Abstract', 'Introduction', 'Conclusion'];
  for (const name of required) {
    const re = new RegExp(`^##\\s+${name}\\b`, 'im');
    if (!re.test(trimmed)) {
      issues.push({ code: 'STRUCTURE', message: `Content must include a "## ${name}" section.` });
    }
  }

  const languageCheck = validateLanguageAgainstParams({ payload, content });
  if (!languageCheck.ok) {
    issues.push({ code: 'LANGUAGE_MISMATCH', message: languageCheck.message, meta: languageCheck.metrics });
  }

  const style = String(payload.style || '').toLowerCase();
  if (style === 'formal') {
    const contraction = /\b\w+'\w+\b/;
    if (contraction.test(content)) {
      issues.push({ code: 'STYLE', message: 'Formal style must avoid contractions.' });
    }
  }
  if (style === 'direct and concise' || style === 'direct_and_concise') {
    if (wordCount > range.target) {
      issues.push({ code: 'STYLE', message: 'Direct and concise style must stay below the target length.' });
    }
  }

  return { ok: issues.length === 0, issues, stats: { wordCount, markerCount, range } };
};

const trimToWordCount = ({ content, maxWords }) => {
  if (typeof content !== 'string' || content.length === 0) return content;
  const text = content.trim();
  if (countWords(text) <= maxWords) return text;

  const preserveHeadings = ['## Conclusion', '## References'];
  const preserveIndex = preserveHeadings
    .map((h) => text.toLowerCase().indexOf(h.toLowerCase()))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];

  if (preserveIndex === undefined) {
    const paragraphs = text.split(/\n\n+/);
    let current = text;
    while (countWords(current) > maxWords && paragraphs.length > 1) {
      paragraphs.pop();
      current = paragraphs.join('\n\n');
    }
    return current.trim();
  }

  const head = text.slice(0, preserveIndex).trim();
  const tail = text.slice(preserveIndex).trim();
  const headParas = head.split(/\n\n+/).filter(Boolean);
  let currentHead = head;
  let combined = `${currentHead}\n\n${tail}`.trim();

  while (countWords(combined) > maxWords && headParas.length > 1) {
    headParas.pop();
    currentHead = headParas.join('\n\n').trim();
    combined = `${currentHead}\n\n${tail}`.trim();
  }

  if (countWords(combined) <= maxWords) return combined;

  const tailParas = tail.split(/\n\n+/).filter(Boolean);
  let currentTail = tail;
  while (countWords(`${currentHead}\n\n${currentTail}`.trim()) > maxWords && tailParas.length > 2) {
    tailParas.pop();
    currentTail = tailParas.join('\n\n').trim();
  }
  return `${currentHead}\n\n${currentTail}`.trim();
};

const classifyTopic = ({ topic }) => {
  const t = String(topic || '').toLowerCase();
  if (t.includes('python')) return 'python';
  if (t.includes('machine learning') || t.includes('deep learning') || t.includes('neural network') || t.includes('artificial neural')) return 'machine_learning';
  return 'generic';
};

const padToWordCount = ({ content, minWords, topic, subject, language }) => {
  if (typeof content !== 'string') return content;
  let out = content.trim();
  if (!out) return out;
  if (countWords(out) >= minWords) return out;

  const lang = String(language || 'English');

  const topicType = classifyTopic({ topic });

  const examplesByType = {
    python: [
      { title: 'Quick Example', a: 'Printing a message (Hello, World)', b: 'calling a function like print() and understanding strings' },
      { title: 'Quick Example', a: 'Looping over a list of numbers', b: 'using a for-loop and variables to repeat actions' },
      { title: 'Quick Example', a: 'Writing a small function', b: 'defining a function with parameters and a return value' },
      { title: 'Quick Example', a: 'Reading a text file', b: 'using open() safely and processing lines of input' }
    ],
    machine_learning: [
      { title: 'Quick Example', a: 'Spam vs not-spam email classification', b: 'labels (spam / not spam) and patterns in words and links' },
      { title: 'Quick Example', a: 'Image recognition (cat vs dog)', b: 'many labeled images and visual patterns like edges and shapes' },
      { title: 'Quick Example', a: 'Recommendations (suggesting videos)', b: 'watch history and similarity between users and items' },
      { title: 'Quick Example', a: 'Predicting house prices', b: 'past sales data and features like size, location, and rooms' }
    ],
    generic: [
      { title: 'Quick Example', a: `A simple scenario related to ${topic}`, b: `breaking the problem into steps and applying key ideas from ${subject}` },
      { title: 'Quick Example', a: `A second scenario where ${topic} is useful`, b: `choosing appropriate methods and checking results` },
      { title: 'Quick Example', a: `A real-world application of ${topic}`, b: `balancing accuracy, cost, and constraints` }
    ]
  };

  const termSetsByType = {
    python: [
      [
        ['Interpreter', 'a program that runs Python code line by line'],
        ['Indentation', 'spaces at the start of a line that define a code block'],
        ['Variable', 'a name that refers to a value (like a number or string)']
      ],
      [
        ['Function', 'a reusable block of code that can take inputs and return outputs'],
        ['Module', 'a Python file that contains code you can import and reuse'],
        ['Library', 'a collection of modules that solves a set of problems']
      ],
      [
        ['pip', 'the common tool used to install Python packages'],
        ['Virtual environment', 'an isolated set of packages for a specific project'],
        ['Exception', 'an error that can be caught and handled to avoid a crash']
      ]
    ],
    machine_learning: [
      [
        ['Dataset', 'a collection of examples used to train or test a model'],
        ['Model', 'a system that maps inputs to outputs'],
        ['Training', 'improving the model using data']
      ],
      [
        ['Feature', 'an input signal the model uses (for example, size or color)'],
        ['Label', 'the correct answer in supervised learning'],
        ['Prediction', 'the model’s output for a new input']
      ],
      [
        ['Overfitting', 'when a model memorizes training data and performs poorly on new data'],
        ['Generalization', 'how well a model works on unseen data'],
        ['Evaluation', 'testing a model with a fair, separate dataset']
      ]
    ],
    generic: [
      [
        ['Definition', 'a clear meaning of a term so it is not confused with similar ideas'],
        ['Example', 'a concrete case used to explain an abstract idea'],
        ['Constraint', 'a limit (time, cost, rules) that affects a solution']
      ],
      [
        ['Assumption', 'a condition you accept as true for analysis'],
        ['Trade-off', 'a choice where improving one aspect worsens another'],
        ['Evaluation', 'checking whether the approach meets goals using evidence']
      ]
    ]
  };

  const mistakeSetsByType = {
    python: [
      [
        'Indentation mistakes (mixing tabs/spaces) can cause errors or change program logic.',
        'Forgetting colons after if/for/while/def is a common beginner mistake.',
        'Not handling exceptions can crash a program when inputs are unexpected.'
      ],
      [
        'Using mutable default arguments in functions can create surprising bugs.',
        'Installing packages globally can break projects; use a virtual environment.',
        'Ignoring readability makes code harder to maintain and debug.'
      ]
    ],
    machine_learning: [
      [
        'Using biased data can produce unfair or inaccurate results.',
        'Measuring performance on the same data used for training can be misleading.',
        'Ignoring edge cases can cause failures in real-world use.'
      ],
      [
        'Adding more complexity does not always improve accuracy.',
        'A high score can hide poor performance on minority groups.',
        'A model can become outdated when patterns in the world change.'
      ]
    ],
    generic: [
      [
        `Using ${topic} without a clear goal can lead to vague or incorrect conclusions.`,
        `Relying on a single example may hide limitations or exceptions.`,
        `Ignoring constraints (time, cost, rules) can make solutions unrealistic.`
      ]
    ]
  };

  const examples = examplesByType[topicType] || examplesByType.generic;
  const termSets = termSetsByType[topicType] || termSetsByType.generic;
  const mistakeSets = mistakeSetsByType[topicType] || mistakeSetsByType.generic;

  let i = 0;
  let exampleIndex = 0;
  let termIndex = 0;
  let pitfallIndex = 0;
  while (countWords(out) < minWords && i < 24) {
    const type = i % 3;
    if (type === 0) {
      const ex = examples[exampleIndex % examples.length];
      const n = Math.floor(i / 3) + 1;
      const block = lang === 'Urdu'
        ? [
          `### Example ${n}`,
          `**${topic}** کو سمجھنے کا ایک عملی طریقہ یہ ہے کہ ہم ایک واضح مثال دیکھیں: ${ex.a}.`,
          `مثال کے طور پر، اس میں یہ شامل ہو سکتا ہے: ${ex.b}.`,
          `لہٰذا، بنیادی نتیجہ یہ ہے کہ ${topicType === 'python' ? 'واضح ہدایات اور چھوٹے، قابلِ جانچ مراحل' : topicType === 'machine_learning' ? 'معیاری ڈیٹا اور محتاط جائزہ' : 'واضح تعریفیں اور حقیقت پسندانہ حدود'} بہتر نتائج تک لے جاتے ہیں۔`,
          `نتیجتاً، اگلا حصہ اس مثال سے بنیادی تصور کی طرف منتقل ہو سکتا ہے۔`
        ].join('\n\n')
        : [
          `### Example ${n}`,
          `A practical way to understand **${topic}** is to look at a concrete task: ${ex.a}.`,
          `For instance, this involves ${ex.b}.`,
          `Therefore, the key takeaway is that ${topicType === 'python' ? 'clear instructions and small, testable steps' : topicType === 'machine_learning' ? 'good data and careful evaluation' : 'clear definitions and realistic constraints'} lead to stronger outcomes.`,
          `Consequently, the next section can build on this by moving from the example to the underlying concept.`
        ].join('\n\n');
      out += `\n\n${block}`;
      exampleIndex += 1;
    }

    if (type === 1) {
      const terms = termSets[termIndex % termSets.length];
      const n = Math.floor(i / 3) + 1;
      const block = lang === 'Urdu'
        ? [
          `### Key Terms ${n}`,
          ...terms.map(([k, v]) => `- **${k}**: ${v} (مختصر وضاحت).`),
          `تاہم، صرف تعریفیں کافی نہیں ہوتیں؛ اصل فائدہ انہیں درست سیاق و سباق میں استعمال کرنے سے ہوتا ہے۔`
        ].join('\n')
        : [
          `### Key Terms ${n}`,
          ...terms.map(([k, v]) => `- **${k}**: ${v}.`),
          `However, definitions alone are not enough; the value comes from applying them correctly in context.`
        ].join('\n');
      out += `\n\n${block}`;
      termIndex += 1;
    }

    if (type === 2) {
      const mistakes = mistakeSets[pitfallIndex % mistakeSets.length];
      const tieBack = topicType === 'python'
        ? `Tie-back to **${topic}**: better results come from practice, debugging, and writing readable code.`
        : topicType === 'machine_learning'
          ? `Tie-back to **${topic}**: good results come from good data, careful testing, and clear goals.`
          : `Tie-back to **${topic}**: strong answers use clear definitions, examples, and evidence.`;
      const n = Math.floor(i / 3) + 1;
      const block = lang === 'Urdu'
        ? [
          `### Common Pitfalls ${n}`,
          ...mistakes.map((m) => `- ${m}`),
          topicType === 'python'
            ? `**${topic}** سے ربط: بہتر نتائج مشق، ڈی بگنگ، اور قابلِ فہم کوڈ لکھنے سے حاصل ہوتے ہیں۔`
            : topicType === 'machine_learning'
              ? `**${topic}** سے ربط: بہتر نتائج معیاری ڈیٹا، محتاط ٹیسٹنگ، اور واضح اہداف سے آتے ہیں۔`
              : `**${topic}** سے ربط: مضبوط جواب میں واضح تعریفیں، مثالیں، اور شواہد شامل ہوتے ہیں۔`,
          `ان غلطیوں کے برعکس، مضبوط تحریر تقاضوں پر مرکوز رہتی ہے اور دعووں کی حمایت کے لیے مثال یا ثبوت پیش کرتی ہے۔`
        ].join('\n')
        : [
          `### Common Pitfalls ${n}`,
          ...mistakes.map((m) => `- ${m}`),
          tieBack,
          `In contrast to these pitfalls, strong work stays focused on the task requirements and uses evidence or examples to justify claims.`
        ].join('\n');
      out += `\n\n${block}`;
      pitfallIndex += 1;
    }

    i += 1;
  }

  return out.trim();
};

const removeMetaStatements = (content) => {
  if (typeof content !== 'string') return content;
  const lines = content.split('\n');
  const out = [];
  let removedAny = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isMeta =
      lower.includes('the tone is') ||
      lower.includes('writing style adopted') ||
      lower.includes('the writing style adopted') ||
      lower.includes('this paper aims') ||
      lower.includes('depth mode:') ||
      lower.includes('urgency mode:') ||
      lower.includes('language notice') ||
      lower.includes('backup template') ||
      lower.includes('special instructions') ||
      lower.includes('audience is') ||
      lower.includes('suitable for a') && lower.includes('audience');

    if (isMeta && i < 80) {
      removedAny = true;
      continue;
    }
    out.push(line);
  }

  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return removedAny ? joined : content;
};

const enforceLengthDeterministically = ({ payload, content }) => {
  const range = getTargetWordRange({ pages: payload.pages, level: payload.level, style: payload.style });
  let out = String(content || '').trim();
  out = stripCodeFences(out);
  out = removeMetaStatements(out);
  out = ensureH1Title({ content: out, topic: payload.topic, subject: payload.subject });
  out = removeEchoedInstructions({ payload, content: out });
  out = normalizeHeadingSpacing(out);
  out = dedupeExactParagraphs(out);
  out = breakLongParagraphs({ content: out });

  if (countWords(out) > range.max) {
    out = trimToWordCount({ content: out, maxWords: range.max });
  }
  if (countWords(out) < range.min) {
    out = padToWordCount({ content: out, minWords: range.min, topic: payload.topic, subject: payload.subject, language: payload.language });
  }

  const availableWords = range.max - countWords(out);
  out = ensureReadabilityElements({ payload, content: out, availableWords });

  out = normalizeHeadingSpacing(out);

  if (countWords(out) > range.max) {
    out = trimToWordCount({ content: out, maxWords: range.max });
  }

  return out;
};

module.exports = {
  countWords,
  countImageMarkers,
  hashText,
  isLikelyGeneric,
  getTargetWordRange,
  ensureH1Title,
  validateContentAgainstParams,
  enforceLengthDeterministically
};

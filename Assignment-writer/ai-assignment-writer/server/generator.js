const allowedLengths = new Set(['Short', 'Medium', 'Detailed']);
const allowedStyles = new Set(['Formal', 'Academic', 'Simple', 'Creative', 'Direct and concise']);
const allowedLevels = new Set(['School', 'College', 'University', 'Masters', 'PhD']);
const allowedCitationStyles = new Set(['APA', 'MLA', 'Chicago', 'Harvard']);
const allowedUrgency = new Set(['Normal', 'Urgent']);
const allowedLanguages = new Set(['English', 'EnglishUK', 'Urdu', 'Spanish', 'French']);

const clampInt = (value, min, max, fallback) => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
};

const normalizeGeneratePayload = (body) => {
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const level = typeof body.level === 'string' ? body.level.trim() : '';
    const length = typeof body.length === 'string' ? body.length.trim() : '';
    let style = typeof body.style === 'string' ? body.style.trim() : '';
    const includeImages = toBoolean(body.includeImages);
    const imageCount = includeImages ? clampInt(body.imageCount, 0, 5, 1) : 0;
    const pages = clampInt(body.pages, 1, 20, 1);
    const references = toBoolean(body.references);
    const citationStyle = typeof body.citationStyle === 'string' ? body.citationStyle.trim() : 'APA';
    let languageRaw = typeof body.language === 'string' ? body.language.trim() : 'English';
    if (!languageRaw) languageRaw = 'English';
    const languageLower = languageRaw.toLowerCase();
    if (languageLower === 'english (uk)' || languageLower === 'english_uk' || languageLower === 'en-gb' || languageLower === 'en_gb') languageRaw = 'EnglishUK';
    if (languageLower === 'english (us)' || languageLower === 'english_us' || languageLower === 'en-us' || languageLower === 'en_us') languageRaw = 'English';
    if (languageLower === 'urdu' || languageLower === 'اردو' || languageLower === 'ur' || languageLower === 'ur-pk' || languageLower === 'ur_pk') languageRaw = 'Urdu';
    if (languageLower === 'spanish' || languageLower === 'es' || languageLower === 'es-es' || languageLower === 'es_es') languageRaw = 'Spanish';
    if (languageLower === 'french' || languageLower === 'fr' || languageLower === 'fr-fr' || languageLower === 'fr_fr') languageRaw = 'French';

    const language = languageRaw;
    const englishVariant = language === 'EnglishUK' ? 'UK' : 'US';
    const urgency = typeof body.urgency === 'string' ? body.urgency.trim() : 'Normal';
    const instructions = typeof body.instructions === 'string' ? body.instructions.trim() : '';
    const images = Array.isArray(body.images) ? body.images.filter((x) => typeof x === 'string' && x.length > 0).slice(0, 5) : [];
    const seed =
        body.seed === undefined || body.seed === null || body.seed === ''
            ? undefined
            : clampInt(body.seed, 1, 1000000000, 1000);

    if (style.toLowerCase() === 'direct and concise' || style.toLowerCase() === 'direct_and_concise' || style.toLowerCase() === 'concise') {
        style = 'Direct and concise';
    }

    const errors = [];
    if (!topic) errors.push('Topic is required.');
    if (!subject) errors.push('Subject is required.');
    if (!allowedLevels.has(level)) errors.push('Invalid academic level.');
    if (!allowedLengths.has(length)) errors.push('Invalid assignment length.');
    if (!allowedStyles.has(style)) errors.push('Invalid writing style.');
    if (!allowedUrgency.has(urgency)) errors.push('Invalid urgency.');
    if (references && !allowedCitationStyles.has(citationStyle)) errors.push('Invalid citation style.');
    if (includeImages && imageCount <= 0) errors.push('Image count must be at least 1 when images are enabled.');
    if (!includeImages && imageCount !== 0) errors.push('Image count must be 0 when images are disabled.');
    if (!allowedLanguages.has(language)) errors.push('Invalid language.');

    if (topic.length > 180) errors.push('Topic is too long (max 180 characters).');
    if (subject.length > 80) errors.push('Subject is too long (max 80 characters).');
    if (instructions.length > 4000) errors.push('Instructions are too long (max 4000 characters).');

    if (errors.length > 0) return { ok: false, errors };

    return {
        ok: true,
        value: {
            topic,
            subject,
            level,
            length,
            style,
            includeImages,
            imageCount,
            pages,
            references,
            citationStyle,
            language,
            englishVariant,
            urgency,
            instructions,
            images,
            seed
        }
    };
};

const normalizeDownloadPayload = (body) => {
    const base = normalizeGeneratePayload(body);
    if (!base.ok) return base;
    const content = typeof body.content === 'string' ? body.content : '';
    if (!content) return { ok: false, errors: ['Content is required for download.'] };
    return { ok: true, value: { ...base.value, content } };
};

const { generateAssignmentContent } = require('./googleAi');
const { generateAssignmentContentOpenAI } = require('./openAiText');
const { generateAssignmentContentOpenRouter } = require('./openRouterText');
const { enforceLengthDeterministically, validateContentAgainstParams, isLikelyGeneric, hashText } = require('./contentQuality');
const { UniquenessStore } = require('./uniquenessStore');

const uniquenessStore = new UniquenessStore();

const classifyTopic = ({ topic }) => {
    const t = String(topic || '').toLowerCase();
    if (t.includes('python')) return 'python';
    if (t.includes('machine learning') || t.includes('deep learning') || t.includes('neural network') || t.includes('artificial neural')) return 'machine_learning';
    return 'generic';
};

const referenceSuggestionsByType = {
    python: [
        'Python Software Foundation. (n.d.). *Python documentation*. https://docs.python.org/3/',
        'van Rossum, G., Warsaw, B., & Coghlan, N. (2001). *PEP 8 – Style Guide for Python Code*. https://peps.python.org/pep-0008/',
        'Sweigart, A. (2019). *Automate the Boring Stuff with Python* (2nd ed.). No Starch Press.',
        'Matthes, E. (2019). *Python Crash Course* (2nd ed.). No Starch Press.'
    ],
    machine_learning: [
        'Bishop, C. M. (2006). *Pattern Recognition and Machine Learning*. Springer.',
        'Goodfellow, I., Bengio, Y., & Courville, A. (2016). *Deep Learning*. MIT Press.',
        'Murphy, K. P. (2012). *Machine Learning: A Probabilistic Perspective*. MIT Press.'
    ],
    generic: [
        'Add your course-approved sources here (textbook, lecture notes, and peer-reviewed articles).'
    ]
};

const buildTemplateText = (payload) => {
    const { topic, subject, level, style, includeImages, imageCount, pages, references, citationStyle, instructions } = payload;
    const topicType = classifyTopic({ topic });
    const language = payload?.language || 'English';
    const styleLower = String(style || '').toLowerCase();
    const concise = styleLower === 'direct and concise' || styleLower === 'direct_and_concise' || styleLower === 'concise' || styleLower === 'simple';

    const abstractByTypeEnglish = {
        python: `${topic} explains Python as a high-level programming language used widely in ${subject}. It outlines why Python is popular, what core concepts beginners must learn, and how those concepts appear in simple programs. It also highlights common pitfalls and practical best practices. Overall, the goal is to give a clear roadmap for starting Python programming confidently.`,
        machine_learning: `${topic} explains how computers can learn patterns from data to make predictions or decisions. It summarizes the core idea, how training and evaluation work, and where different learning types are used. It also highlights limitations such as bias and overfitting. Overall, it emphasizes careful goals, data quality, and testing.`,
        generic: `${topic} is an important concept in ${subject}. This abstract summarizes the main idea, core concepts, practical applications, and key limitations. It also explains why the topic matters and how it is evaluated in practice. Overall, it provides a clear structure for the discussion that follows.`
    };

    const abstractByTypeUrdu = {
        python: `${topic} میں پائتھن کو ایک اعلیٰ سطحی پروگرامنگ زبان کے طور پر بیان کیا گیا ہے جو ${subject} میں وسیع پیمانے پر استعمال ہوتی ہے۔ اس حصے میں بنیادی تصورات (جیسے نحو، ڈیٹا ٹائپس، کنٹرول فلو، اور فنکشنز) کا خلاصہ دیا گیا ہے اور یہ واضح کیا گیا ہے کہ یہ تصورات سادہ پروگراموں میں کیسے نظر آتے ہیں۔`,
        machine_learning: `${topic} میں یہ بتایا گیا ہے کہ کمپیوٹر ڈیٹا سے پیٹرنز سیکھ کر پیش گوئی یا فیصلے کیسے کرتے ہیں۔ اس میں تربیت اور جائزے کے عمل، سیکھنے کی اقسام، اور عملی استعمالات کے ساتھ تعصب اور اوورفٹنگ جیسی حدود کا ذکر بھی شامل ہے۔`,
        generic: `${topic} ${subject} میں ایک اہم تصور ہے۔ اس خلاصے میں بنیادی خیال، کلیدی تصورات، عملی استعمالات، اور اہم حدود بیان کی گئی ہیں، اور یہ بھی واضح کیا گیا ہے کہ یہ موضوع کیوں اہم ہے۔`
    };

    const introByTypeEnglish = {
        python: `Python is widely taught because it is readable, versatile, and supported by a large ecosystem of libraries. Learning Python is a practical entry point into problem solving, automation, and software development. This assignment defines Python, explains key language building blocks, and shows how beginners can apply them in small programs.`,
        machine_learning: `Machine learning is important in modern ${subject} because many problems benefit from learning from examples rather than hand-coded rules. Understanding the basics helps students judge where it works well and where it fails. This assignment defines machine learning, explains the training-and-evaluation workflow, and reviews applications and limitations.`,
        generic: `Understanding ${topic} helps build stronger foundations in ${subject}. It connects theory to real-world practice and supports clearer decision-making in technical work. This assignment defines the topic, explains key concepts, and evaluates applications and limitations.`
    };

    const introByTypeUrdu = {
        python: `پائتھن اس لیے پڑھائی جاتی ہے کہ یہ قابلِ فہم، لچک دار، اور لائبریریوں کے بڑے ذخیرے کے ساتھ دستیاب ہے۔ پائتھن سیکھنا مسئلہ حل کرنے، آٹومیشن، اور سافٹ ویئر ڈویلپمنٹ کے لیے ایک عملی آغاز ہے۔ یہ اسائنمنٹ پائتھن کی تعریف کرتی ہے، بنیادی حصے واضح کرتی ہے، اور دکھاتی ہے کہ ابتدائی سیکھنے والے انہیں چھوٹے پروگراموں میں کیسے استعمال کرتے ہیں۔`,
        machine_learning: `مشین لرننگ جدید ${subject} میں اہم ہے کیونکہ کئی مسائل میں ہاتھ سے قواعد لکھنے کے بجائے مثالوں سے سیکھنا زیادہ مؤثر ہوتا ہے۔ بنیادی سمجھ بوجھ طلبہ کو یہ جانچنے میں مدد دیتی ہے کہ یہ کہاں بہتر کام کرتی ہے اور کہاں ناکام ہو سکتی ہے۔ یہ اسائنمنٹ تعریف، تربیت و جائزہ، استعمالات، اور حدود بیان کرتی ہے۔`,
        generic: `${topic} کو سمجھنا ${subject} میں مضبوط بنیاد بنانے میں مدد دیتا ہے۔ یہ تحریر موضوع کی تعریف اور بنیادی تصورات سے آغاز کرتی ہے، پھر عملی استعمالات اور حدود کا جائزہ لیتی ہے۔`
    };

    const sectionsByType = {
        python: [
            'Definition and Purpose',
            'Why Python Is Popular',
            'Core Building Blocks (Syntax)',
            'Data Types and Data Structures',
            'Control Flow and Functions',
            'Libraries, Use Cases, and Best Practices'
        ],
        machine_learning: [
            'Definition and Goal',
            'How Learning from Data Works',
            'Types of Machine Learning',
            'Applications',
            'Limitations and Risks'
        ],
        generic: [
            'Definition',
            'Background',
            'Core Concepts',
            'Applications',
            'Challenges and Limitations'
        ]
    };

    const sectionSentences = (sectionTitle) => {
        if (language === 'Urdu') {
            const genericUrdu = {
                Definition: [
                    `${topic} کی تعریف ${subject} کے تناظر میں واضح کرنا ضروری ہے۔`,
                    `واضح تعریف موضوع کو ملتے جلتے تصورات سے الگ کرتی ہے اور غلط فہمی کم کرتی ہے۔`,
                    `عملی مثال سے یہ سمجھنا آسان ہوتا ہے کہ یہ تصور حقیقی حالات میں کیسے کام کرتا ہے۔`,
                    `اسی بنیاد پر اگلے حصوں میں تفصیلی بحث کی جا سکتی ہے۔`
                ],
                Background: [
                    `پس منظر یہ بتاتا ہے کہ ${topic} کہاں سے آیا اور وقت کے ساتھ کیوں اہم بنا۔`,
                    `یہ ${subject} کی بنیادیات کو موجودہ مسائل سے جوڑتا ہے۔`,
                    `سیاق و سباق سمجھنے سے درست اطلاق اور حدود واضح ہوتی ہیں۔`,
                    `اس کے بعد بنیادی تصورات کو ترتیب سے بیان کیا جا سکتا ہے۔`
                ],
                'Core Concepts': [
                    `بنیادی تصورات میں اہم اصطلاحات، مفروضات، اور اجزاء کے باہمی تعلقات شامل ہوتے ہیں۔`,
                    `یہ تصورات اس بات کی رہنمائی کرتے ہیں کہ ${topic} کو کیسے استعمال اور پرکھا جائے۔`,
                    `واضح اصطلاحات استدلال مضبوط کرتی ہیں اور ابہام کم کرتی ہیں۔`,
                    `اگلا حصہ انہی تصورات کو عملی اطلاق کے ساتھ جوڑتا ہے۔`
                ],
                Applications: [
                    `${topic} کو ${subject} میں حقیقی مسائل حل کرنے کے لیے استعمال کیا جاتا ہے۔`,
                    `مثالیں یہ دکھاتی ہیں کہ یہ تصور حقیقت پسندانہ حدود میں کیسے کام کرتا ہے۔`,
                    `عملی اطلاق سے فوائد اور نقصانات دونوں نمایاں ہوتے ہیں۔`,
                    `اسی سے مناسب حکمتِ عملی منتخب کرنے میں مدد ملتی ہے۔`
                ],
                'Challenges and Limitations': [
                    `ہر طریقے کی کچھ حدود ہوتی ہیں اور ${topic} بھی اس سے مستثنیٰ نہیں۔`,
                    `عام مسائل میں غلط استعمال، غلط تشریح، یا غلط سیاق میں اطلاق شامل ہے۔`,
                    `ایک مضبوط جواب ان حدود کی نشاندہی کرتا ہے اور خطرات کم کرنے کے طریقے بتاتا ہے۔`,
                    `آخر میں خلاصہ انہی نکات کو سمیٹتا ہے۔`
                ]
            };
            if (genericUrdu[sectionTitle]) return genericUrdu[sectionTitle];
            return [
                `یہ حصہ ${topic} کے حوالے سے "${sectionTitle}" کی وضاحت کرتا ہے۔`,
                `یہ تحریر ${subject} میں ${level} سطح کے قاری کے لیے لکھی گئی ہے۔`,
                `جہاں مناسب ہو وہاں مثالیں شامل کی گئی ہیں تاکہ تصور واضح ہو۔`,
                `اگلا حصہ اسی تسلسل میں بحث کو آگے بڑھاتا ہے۔`
            ];
        }
        if (topicType === 'python') {
            if (sectionTitle === 'Definition and Purpose') return [
                `Python is a programming language used to write instructions that a computer can execute.`,
                `It is interpreted, meaning code runs through an interpreter rather than being compiled ahead of time.`,
                `Python is used by beginners and professionals because it balances simplicity with real-world capability.`,
                `Key terms: **interpreter**, **script**, **syntax**.`
            ];
            if (sectionTitle === 'Why Python Is Popular') return [
                `Python emphasizes readability through clean syntax and indentation, which reduces complexity for learners.`,
                `It has a large standard library and an ecosystem of third‑party packages for many tasks.`,
                `Python works across operating systems and has strong community support and documentation.`,
                `Key terms: **readability**, **standard library**, **package**.`
            ];
            if (sectionTitle === 'Core Building Blocks (Syntax)') return [
                `A Python program is written as statements like assignments, function calls, and expressions.`,
                `Indentation defines blocks of code, such as the body of a loop or an if-statement.`,
                `For example, calling \`print('Hello')\` outputs text, and assigning \`name = 'Amina'\` stores a string value in a variable.`,
                `Readable naming and consistent formatting improve debugging and collaboration.`
            ];
            if (sectionTitle === 'Data Types and Data Structures') return [
                `Python includes data types like integers, floats, strings, and booleans for common values.`,
                `Core data structures include lists, tuples, dictionaries, and sets.`,
                `Choosing the right structure improves clarity and performance (for example, dictionaries for fast lookups).`,
                `Key terms: **list**, **dictionary**, **set**.`
            ];
            if (sectionTitle === 'Control Flow and Functions') return [
                `Control flow uses if/elif/else for decisions and for/while loops for repetition.`,
                `Functions organize logic into reusable units with parameters and return values.`,
                `For example, a function like \`is_even(n)\` can return True when \`n % 2 == 0\`, which keeps logic reusable and easier to test.`,
                `Modules and imports allow splitting a program into files and reusing code across projects.`
            ];
            if (sectionTitle === 'Libraries, Use Cases, and Best Practices') return [
                `Python is used for automation, web development, data analysis, testing, and education.`,
                `Tools like pip install packages, and virtual environments help keep dependencies clean.`,
                `Best practices include handling errors, writing readable code, and testing important logic.`,
                `Key terms: **pip**, **virtual environment**, **exception**.`
            ];
        }

        if (topicType === 'machine_learning') {
            if (sectionTitle === 'Definition and Goal') return [
                `Machine learning is a method in ${subject} where systems learn patterns from data.`,
                `The goal is to make predictions or decisions that generalize to new inputs.`,
                `Instead of fixed rules, models improve by learning from many examples.`
            ];
            if (sectionTitle === 'How Learning from Data Works') return [
                `Training adjusts a model’s parameters to reduce error on examples.`,
                `Evaluation checks performance on data the model has not seen before.`,
                `Good results depend on data quality, clear targets, and careful testing.`
            ];
            if (sectionTitle === 'Types of Machine Learning') return [
                `Supervised learning uses labeled examples, like classifying emails as spam or not spam.`,
                `Unsupervised learning finds structure without labels, like clustering similar items.`,
                `Reinforcement learning learns by trial and error using rewards.`
            ];
            if (sectionTitle === 'Applications') return [
                `Machine learning is used for recommendations, speech recognition, medical support tools, and fraud detection.`,
                `It helps automate decisions when clear rules are hard to define.`,
                `In education, it can support personalized learning tools when used responsibly.`
            ];
            if (sectionTitle === 'Limitations and Risks') return [
                `Models can inherit bias from training data and produce unfair outcomes.`,
                `Overfitting can cause strong training results but poor real-world performance.`,
                `Systems must be monitored because the world changes and data patterns drift.`
            ];
        }

        if (sectionTitle === 'Definition') return [
            `${topic} refers to a key idea within ${subject} that supports understanding and problem solving.`,
            `A clear definition helps separate the concept from similar terms and common misunderstandings.`,
            `In practice, ${topic} is best understood through examples.`
        ];
        if (sectionTitle === 'Background') return [
            `The background of ${topic} explains where the concept comes from and why it matters today.`,
            `It connects earlier ideas in ${subject} to current tools and workflows.`,
            `Understanding context helps explain how and why the concept is used.`
        ];
        if (sectionTitle === 'Core Concepts') return [
            `Core concepts of ${topic} include key terms, how the parts fit together, and what assumptions are made.`,
            `These concepts guide how ${topic} is applied and evaluated.`,
            `Clear terminology reduces confusion when solving problems or writing about the topic.`
        ];
        if (sectionTitle === 'Applications') return [
            `${topic} is applied in ${subject} to solve real problems more consistently and efficiently.`,
            `Examples show how the concept works under realistic constraints.`,
            `Practical applications also reveal limits and trade-offs.`
        ];
        if (sectionTitle === 'Challenges and Limitations') return [
            `Every approach has limitations, and ${topic} is no exception.`,
            `Common issues include misuse, misunderstanding, or applying the idea in the wrong context.`,
            `A strong assignment explains these limits and ways to reduce risk.`
        ];
        return [
            `This section explains ${sectionTitle.toLowerCase()} for ${topic}.`,
            `It is written for a ${level} audience in ${subject}.`,
            `Examples are used where helpful to make the ideas clear.`
        ];
    };

    const sectionTitles = sectionsByType[topicType] || sectionsByType.generic;
    const baseCount = Math.max(3, Math.round(pages * 2));
    const sectionCount = topicType === 'python'
        ? Math.min(sectionTitles.length, Math.max(5, baseCount + 1))
        : Math.min(sectionTitles.length, Math.max(3, baseCount));

    let body = '\n\n## Main Body';
    for (let i = 0; i < sectionCount; i++) {
        const currentSectionTitle = sectionTitles[i % sectionTitles.length];
        let imageMarker = '';

        const safeTopic = String(topic || '').replace(/[^a-zA-Z0-9]/g, '');
        const safeSubject = String(subject || '').replace(/[^a-zA-Z0-9]/g, '');
        const safeSection = String(currentSectionTitle || '').replace(/[^a-zA-Z0-9]/g, '');
        if (includeImages && imageCount > 0 && i < imageCount) {
            const imagePrompt = `SECTION_TITLE="${currentSectionTitle}" || KEYWORDS="${safeTopic}, ${safeSubject}, ${safeSection}" || DESCRIPTION="A professional educational illustration about ${topic} in ${subject}, specifically for the section '${currentSectionTitle}'. Create a clear, informative diagram or chart that visually represents key concepts from this section."`;
            imageMarker = `\n\n[IMAGE: ${imagePrompt}]`;
        }

        const picked = sectionSentences(currentSectionTitle);
        const take = concise ? 3 : 4;
        const lines = picked.slice(0, take);
        body += `\n\n### ${currentSectionTitle}\n\n${lines.join('\n\n')}${imageMarker}`;
    }

    const conclusionByTypeEnglish = {
        python: `Python is a practical starting point for programming because it is readable and widely used. Overall, strong fundamentals—data types, control flow, functions, and libraries—help students build real projects and improve through debugging and testing.`,
        machine_learning: `In conclusion, machine learning is useful when problems are data-rich and evaluation is done carefully. Strong work depends on clear goals, good data, and ongoing monitoring to manage errors and bias.`,
        generic: `In conclusion, ${topic} is an important topic in ${subject}. A strong understanding comes from clear definitions, concrete examples, and careful evaluation of trade-offs and limitations.`
    };

    const conclusionByTypeUrdu = {
        python: `آخر میں، پائتھن پروگرامنگ کے لیے ایک عملی آغاز ہے کیونکہ یہ قابلِ فہم اور وسیع پیمانے پر استعمال ہوتی ہے۔ مضبوط بنیادیات—ڈیٹا ٹائپس، کنٹرول فلو، فنکشنز، اور لائبریریاں—طلبہ کو حقیقی منصوبے بنانے اور بہتر ہونے میں مدد دیتی ہیں۔`,
        machine_learning: `آخر میں، مشین لرننگ اس وقت مفید ہے جب ڈیٹا زیادہ ہو اور جائزہ احتیاط سے کیا جائے۔ مضبوط کام کے لیے واضح اہداف، معیاری ڈیٹا، اور مسلسل نگرانی ضروری ہے تاکہ غلطیوں اور تعصب کو کم کیا جا سکے۔`,
        generic: `آخر میں، ${topic} ${subject} میں ایک اہم موضوع ہے۔ مضبوط سمجھ بوجھ واضح تعریفوں، ٹھوس مثالوں، اور فوائد و حدود کے محتاط جائزے سے حاصل ہوتی ہے۔`
    };

    const referencesBlock = references
        ? `\n\n## References (${citationStyle || 'APA'})\n${(referenceSuggestionsByType[topicType] || referenceSuggestionsByType.generic).map((r) => `- ${r}`).join('\n')}`
        : '';

    const instructionsSentence = (language === 'English' || language === 'EnglishUK') && instructions ? `\n\n${instructions}` : '';

    const abstractByType = language === 'Urdu' ? abstractByTypeUrdu : abstractByTypeEnglish;
    const introByType = language === 'Urdu' ? introByTypeUrdu : introByTypeEnglish;
    const conclusionByType = language === 'Urdu' ? conclusionByTypeUrdu : conclusionByTypeEnglish;

    return `# ${topic}\n\n## Abstract\n${abstractByType[topicType]}\n\n## Introduction\n${introByType[topicType]}${instructionsSentence}${body}\n\n## Conclusion\n${conclusionByType[topicType]}${referencesBlock}`.trim();
};

const providerState = {
    gemini: { blockedUntil: 0, lastFailureReason: null },
    openrouter: { blockedUntil: 0, lastFailureReason: null },
    openai: { blockedUntil: 0, lastFailureReason: null }
};

const classifyTextFailure = (reason) => {
    const text = typeof reason === 'string' ? reason : '';
    const lower = text.toLowerCase();
    if (!text) return { code: 'UNKNOWN', retryable: true, retryAfterSeconds: null };
    if (lower.includes('http 429') || lower.includes('too many requests') || lower.includes('rate limit')) return { code: 'RATE_LIMIT', retryable: true, retryAfterSeconds: 60 };
    if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('billing')) return { code: 'QUOTA', retryable: true, retryAfterSeconds: 300 };
    if (lower.includes('request timeout') || lower.includes('timeout')) return { code: 'TIMEOUT', retryable: true, retryAfterSeconds: 30 };
    if (lower.includes('permission_denied') || lower.includes('invalid api key') || lower.includes('unauthorized') || lower.includes('forbidden')) {
        return { code: 'AUTH', retryable: false, retryAfterSeconds: null };
    }
    return { code: 'ERROR', retryable: true, retryAfterSeconds: null };
};

const isBlocked = (key) => {
    const until = providerState[key]?.blockedUntil || 0;
    return until && Date.now() < until;
};

const blockProvider = (key, reason) => {
    const classified = classifyTextFailure(reason);
    providerState[key].lastFailureReason = classified.code;
    if (!classified.retryable) {
        providerState[key].blockedUntil = Date.now() + 10 * 60_000;
        return;
    }
    const seconds = classified.retryAfterSeconds || 60;
    providerState[key].blockedUntil = Date.now() + seconds * 1000;
};

const enforceImageMarkersExact = ({ payload, content }) => {
    const text = String(content || '').trim();
    const current = (text.match(/\[IMAGE:/g) || []).length;

    if (!payload.includeImages) {
        return text.replace(/\[IMAGE:[^\]]*\]\s*/g, '');
    }

    const wanted = Number(payload.imageCount || 0);
    if (wanted <= 0) return text.replace(/\[IMAGE:[^\]]*\]\s*/g, '');
    if (current === wanted) return text;

    if (current > wanted) {
        let remaining = wanted;
        return text.replace(/\[IMAGE:[^\]]*\]\s*/g, (m) => {
            if (remaining <= 0) return '';
            remaining -= 1;
            return m;
        }).trim();
    }

    const missing = wanted - current;
    const appendix = Array.from({ length: missing }, (_, i) => {
        const idx = current + i + 1;
        const title = `Additional Visual ${idx}`;
        const desc = `A clear educational diagram related to ${payload.topic} in ${payload.subject}.`;
        return `[IMAGE: SECTION_TITLE="${title}" || KEYWORDS="diagram, concept, process" || DESCRIPTION="${desc}"]`;
    }).join('\n');

    return `${text}\n\n${appendix}`.trim();
};

const ensureReferencesSection = ({ payload, content }) => {
    const text = String(content || '').trim();
    if (!payload?.references) return text;
    if (/^##\s+references\b/im.test(text)) return text;

    const topicType = classifyTopic({ topic: payload.topic });
    const style = payload.citationStyle || 'APA';
    const refs = referenceSuggestionsByType[topicType] || referenceSuggestionsByType.generic;
    const block = `## References (${style})\n${refs.map((r) => `- ${r}`).join('\n')}`;
    return `${text}\n\n${block}`.trim();
};

const sectionDefaultsFor = ({ payload }) => {
    const topicType = classifyTopic({ topic: payload?.topic });
    const topic = payload?.topic || 'Assignment';
    const subject = payload?.subject || 'the subject';
    const language = payload?.language || 'English';

    const abstractByTypeEnglish = {
        python: `${topic} explains Python as a high-level programming language used widely in ${subject}. It summarizes key concepts beginners learn (syntax, data types, control flow, and functions) and how those concepts appear in simple programs. It also notes common pitfalls and good practices. Overall, it provides a clear roadmap for starting Python programming confidently.`,
        machine_learning: `${topic} explains how systems learn patterns from data to make predictions or decisions. It summarizes the training-and-evaluation workflow, common learning types, and practical applications. It also highlights limitations such as bias and overfitting. Overall, it emphasizes careful goals, data quality, and testing.`,
        generic: `${topic} is an important concept in ${subject}. It summarizes the main idea, key concepts, applications, and limitations. It also explains why the topic matters and how it is evaluated in practice. Overall, it provides a structured overview for the discussion that follows.`
    };

    const abstractByTypeUrdu = {
        python: `${topic} میں پائتھن کو ایک اعلیٰ سطحی پروگرامنگ زبان کے طور پر بیان کیا گیا ہے جو ${subject} میں وسیع پیمانے پر استعمال ہوتی ہے۔ اس میں بنیادی تصورات (جیسے نحو، ڈیٹا ٹائپس، کنٹرول فلو، اور فنکشنز) کا خلاصہ دیا گیا ہے اور یہ دکھایا گیا ہے کہ یہ تصورات سادہ پروگراموں میں کیسے نظر آتے ہیں۔ آخر میں اہم احتیاطی نکات اور اچھی مشقوں کا ذکر کیا گیا ہے۔`,
        machine_learning: `${topic} میں یہ وضاحت کی گئی ہے کہ نظام ڈیٹا سے پیٹرنز سیکھ کر پیش گوئی یا فیصلے کیسے کرتے ہیں۔ اس میں تربیت اور جائزے کے عمل، سیکھنے کی عام اقسام، اور عملی استعمالات کا خلاصہ شامل ہے۔ مزید یہ کہ تعصب اور اوور فٹنگ جیسی حدود کی نشاندہی بھی کی گئی ہے۔`,
        generic: `${topic} ${subject} میں ایک اہم تصور ہے۔ اس خلاصے میں بنیادی خیال، اہم تصورات، استعمالات، اور حدود بیان کی گئی ہیں، اور یہ بھی واضح کیا گیا ہے کہ یہ موضوع کیوں اہم ہے اور عملی طور پر اس کا جائزہ کیسے لیا جاتا ہے۔`
    };

    const introByTypeEnglish = {
        python: `Python is widely taught because it is readable, versatile, and supported by a large ecosystem of libraries. It is used in ${subject} for automation, data analysis, web development, and education. The discussion begins with a clear definition, then explains key building blocks and how beginners apply them through small, testable programs.`,
        machine_learning: `Machine learning is important in modern ${subject} because many problems benefit from learning from examples rather than hand-coded rules. The discussion begins by defining machine learning, then explains how training and evaluation work, and finally reviews applications and limitations.`,
        generic: `Understanding ${topic} helps build stronger foundations in ${subject}. The discussion begins by defining the topic and outlining core concepts, then evaluates applications and limitations before summarizing key takeaways.`
    };

    const introByTypeUrdu = {
        python: `پائتھن اس لیے پڑھائی جاتی ہے کہ یہ قابلِ فہم، لچک دار، اور لائبریریوں کے بڑے ذخیرے کے ساتھ دستیاب ہے۔ ${subject} میں اسے آٹومیشن، ڈیٹا اینالیسس، ویب ڈویلپمنٹ، اور تعلیم کے لیے استعمال کیا جاتا ہے۔ یہ تحریر پہلے واضح تعریف پیش کرتی ہے، پھر بنیادی حصوں کی وضاحت کرتی ہے اور دکھاتی ہے کہ ابتدائی سیکھنے والے انہیں چھوٹے اور قابلِ جانچ پروگراموں میں کیسے استعمال کرتے ہیں۔`,
        machine_learning: `مشین لرننگ جدید ${subject} میں اہم ہے کیونکہ کئی مسائل میں ہاتھ سے قواعد لکھنے کے بجائے مثالوں سے سیکھنا زیادہ مؤثر ہوتا ہے۔ یہ تحریر پہلے مشین لرننگ کی تعریف کرتی ہے، پھر تربیت اور جائزے کے عمل کی وضاحت کرتی ہے، اور آخر میں استعمالات اور حدود بیان کرتی ہے۔`,
        generic: `${topic} کو سمجھنا ${subject} میں مضبوط بنیاد بنانے میں مدد دیتا ہے۔ یہ تحریر موضوع کی تعریف اور بنیادی تصورات سے آغاز کرتی ہے، پھر عملی استعمالات اور حدود کا جائزہ لے کر آخر میں اہم نکات کا خلاصہ پیش کرتی ہے۔`
    };

    const conclusionByTypeEnglish = {
        python: `In conclusion, Python is a practical starting point for programming because it is readable and widely used. Strong fundamentals—data types, control flow, functions, and libraries—help students build real projects and improve through debugging and testing.`,
        machine_learning: `In conclusion, machine learning is useful when problems are data-rich and evaluation is done carefully. Strong work depends on clear goals, good data, and ongoing monitoring to manage errors and bias.`,
        generic: `In conclusion, ${topic} is an important topic in ${subject}. A strong understanding comes from clear definitions, concrete examples, and careful evaluation of trade-offs and limitations.`
    };

    const conclusionByTypeUrdu = {
        python: `آخر میں، پائتھن پروگرامنگ شروع کرنے کے لیے ایک عملی زبان ہے کیونکہ یہ قابلِ فہم اور وسیع پیمانے پر استعمال ہوتی ہے۔ مضبوط بنیادیات—ڈیٹا ٹائپس، کنٹرول فلو، فنکشنز، اور لائبریریاں—طلبہ کو حقیقی منصوبے بنانے اور ڈی بگنگ و ٹیسٹنگ کے ذریعے بہتر ہونے میں مدد دیتی ہیں۔`,
        machine_learning: `آخر میں، مشین لرننگ اس وقت مفید ہے جب مسئلے میں ڈیٹا زیادہ ہو اور جائزہ احتیاط سے کیا جائے۔ مضبوط کام کے لیے واضح اہداف، معیاری ڈیٹا، اور مسلسل نگرانی ضروری ہے تاکہ غلطیوں اور تعصب کو کم کیا جا سکے۔`,
        generic: `آخر میں، ${topic} ${subject} میں ایک اہم موضوع ہے۔ مضبوط سمجھ بوجھ واضح تعریفوں، ٹھوس مثالوں، اور فوائد و حدود کے محتاط جائزے سے حاصل ہوتی ہے۔`
    };

    const byLang = language === 'Urdu'
        ? { abstract: abstractByTypeUrdu[topicType], introduction: introByTypeUrdu[topicType], conclusion: conclusionByTypeUrdu[topicType] }
        : { abstract: abstractByTypeEnglish[topicType], introduction: introByTypeEnglish[topicType], conclusion: conclusionByTypeEnglish[topicType] };

    return { topicType, ...byLang };
};

const ensureCoreSections = ({ payload, content }) => {
    const text = String(content || '').trim();
    if (!text) return text;

    const defaults = sectionDefaultsFor({ payload });
    const lines = text.split('\n');
    const firstNonEmptyIndex = lines.findIndex((l) => l.trim().length > 0);
    if (firstNonEmptyIndex < 0) return text;

    const h1Index = lines.findIndex((l, idx) => idx >= firstNonEmptyIndex && l.startsWith('# '));
    const titleLine = h1Index >= 0 ? lines[h1Index] : `# ${String(payload?.topic || 'Assignment').trim()}`;
    const afterTitle = h1Index >= 0 ? lines.slice(h1Index + 1).join('\n').trim() : lines.slice(firstNonEmptyIndex + 1).join('\n').trim();

    let out = `${titleLine}`;

    const hasAbstract = /^##\s+abstract\b/im.test(afterTitle);
    if (!hasAbstract) out += `\n\n## Abstract\n${defaults.abstract}`;

    const hasIntroduction = /^##\s+introduction\b/im.test(afterTitle);
    if (!hasIntroduction) out += `\n\n## Introduction\n${defaults.introduction}`;

    const hasMainBody = /^##\s+main body\b/im.test(afterTitle);
    const hasAnyH3 = /^###\s+/m.test(afterTitle);
    if (!hasMainBody && hasAnyH3) {
        const replaced = afterTitle.replace(/\n\n###\s+/m, '\n\n## Main Body\n\n### ');
        out += `\n\n${replaced}`;
    } else {
        out += afterTitle ? `\n\n${afterTitle}` : '';
    }

    const hasConclusion = /^##\s+conclusion\b/im.test(out);
    if (!hasConclusion) out += `\n\n## Conclusion\n${defaults.conclusion}`;

    return out.trim();
};

const generateContent = async (data) => {
    const tryFinalize = (raw) => {
        const withReferences = ensureReferencesSection({ payload: data, content: raw });
        const withCore = ensureCoreSections({ payload: data, content: withReferences });
        const enforced = enforceLengthDeterministically({ payload: data, content: withCore });
        const fixedMarkers = enforceImageMarkersExact({ payload: data, content: enforced });
        const validation = validateContentAgainstParams({ payload: data, content: fixedMarkers });
        const generic = isLikelyGeneric(fixedMarkers);
        const digest = hashText(fixedMarkers);
        const duplicate = uniquenessStore.has(fixedMarkers);
        return { content: fixedMarkers, validation, generic, duplicate, digest };
    };

    const isLikelyValidTextKey = (key, { minLen, prefix } = {}) => {
        if (!key || typeof key !== 'string') return false;
        const k = key.trim();
        if (prefix && !k.startsWith(prefix)) return false;
        if (minLen && k.length < minLen) return false;
        return true;
    };

    const order = String(process.env.TEXT_PROVIDER_ORDER || 'quality').toLowerCase();
    const providers = order === 'cost'
        ? ['gemini', 'openrouter', 'openai']
        : ['openrouter', 'gemini', 'openai'];

    const tryProvider = async (key) => {
        if (key === 'gemini') {
            const googleKey = process.env.GOOGLE_API_KEY;
            if (!googleKey || isBlocked('gemini')) return null;
            console.log('Attempting generation with Google AI...');
            const result = await generateAssignmentContent({ apiKey: googleKey, ...data });
            if (!result.ok) {
                console.error('Google AI generation failed:', result.reason);
                blockProvider('gemini', result.reason);
                return null;
            }
            const finalized = tryFinalize(result.value);
            if (finalized.validation.ok && !finalized.generic && !finalized.duplicate) {
                uniquenessStore.add(finalized.content);
                console.log('Google AI generation successful.');
                return finalized.content;
            }
            console.warn('Google AI output failed quality checks; trying fallback model.');
            return null;
        }

        if (key === 'openrouter') {
            const openRouterKey = process.env.OPENROUTER_API_KEY;
            if (!isLikelyValidTextKey(openRouterKey, { minLen: 40, prefix: 'sk-' }) || isBlocked('openrouter')) return null;
            console.log('Attempting generation with OpenRouter...');
            const result = await generateAssignmentContentOpenRouter({ apiKey: openRouterKey, ...data });
            if (!result.ok) {
                console.error('OpenRouter generation failed:', result.reason);
                blockProvider('openrouter', result.reason);
                return null;
            }
            const finalized = tryFinalize(result.value);
            if (!finalized.duplicate) uniquenessStore.add(finalized.content);
            if (finalized.validation.ok && !finalized.generic) {
                console.log('OpenRouter generation successful.');
                return finalized.content;
            }
            console.warn('OpenRouter output failed quality checks; trying next model.');
            return null;
        }

        if (key === 'openai') {
            const openAiKey = process.env.OPENAI_API_KEY || (process.env.IMAGE_API_KEY && process.env.IMAGE_API_KEY.startsWith('sk-') ? process.env.IMAGE_API_KEY : null);
            if (!isLikelyValidTextKey(openAiKey, { minLen: 40, prefix: 'sk-' }) || isBlocked('openai')) return null;
            console.log('Attempting generation with OpenAI...');
            const result = await generateAssignmentContentOpenAI({ apiKey: openAiKey, ...data });
            if (!result.ok) {
                console.error('OpenAI generation failed:', result.reason);
                blockProvider('openai', result.reason);
                return null;
            }
            const finalized = tryFinalize(result.value);
            if (!finalized.duplicate) uniquenessStore.add(finalized.content);
            if (finalized.validation.ok && !finalized.generic) {
                console.log('OpenAI generation successful.');
                return finalized.content;
            }
            console.warn('OpenAI output failed quality checks; falling back to next provider.');
            return null;
        }

        return null;
    };

    for (const p of providers) {
        const content = await tryProvider(p);
        if (content) return content;
    }

    // 2. Fallback to Template Generator
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const content = buildTemplateText(data);
                const finalized = tryFinalize(content);
                if (!finalized.duplicate) uniquenessStore.add(finalized.content);
                if (!finalized.validation.ok) {
                    reject(new Error(`Template generation failed validation: ${JSON.stringify(finalized.validation.issues || [])}`));
                    return;
                }
                resolve(finalized.content);
            } catch (e) {
                reject(e);
            }
        }, 2000);
    });
};

module.exports = {
    normalizeGeneratePayload,
    normalizeDownloadPayload,
    generateContent
};

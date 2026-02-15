const test = require('node:test');
const assert = require('node:assert/strict');

const {
  countWords,
  countImageMarkers,
  getTargetWordRange,
  validateContentAgainstParams,
  enforceLengthDeterministically,
  isLikelyGeneric
} = require('../contentQuality');

test('getTargetWordRange scales with pages', () => {
  const r1 = getTargetWordRange({ pages: 1, level: 'University', style: 'Academic' });
  const r2 = getTargetWordRange({ pages: 2, level: 'University', style: 'Academic' });
  assert.ok(r2.target > r1.target);
  assert.ok(r2.min < r2.max);
});

test('enforceLengthDeterministically pads or trims to fit range', () => {
  const payload = { pages: 2, level: 'University', style: 'Academic', topic: 'Test', subject: 'CS', includeImages: false, imageCount: 0 };
  const range = getTargetWordRange(payload);
  const short = '# Title\n\nToo short.';
  const padded = enforceLengthDeterministically({ payload, content: short });
  assert.ok(countWords(padded) >= range.min);

  const long = `# Title\n\n${'word '.repeat(range.max + 200)}`;
  const trimmed = enforceLengthDeterministically({ payload, content: long });
  assert.ok(countWords(trimmed) <= range.max);
});

test('validateContentAgainstParams enforces marker count', () => {
  const payload = { pages: 1, level: 'University', style: 'Academic', topic: 'X', subject: 'Y', includeImages: true, imageCount: 2 };
  const content = '# Title\n\n[IMAGE: A]\n\nText';
  const v = validateContentAgainstParams({ payload, content });
  assert.equal(v.ok, false);
  assert.equal(countImageMarkers(content), 1);
});

test('validateContentAgainstParams detects Urdu language mismatch', () => {
  const payload = { pages: 1, level: 'University', style: 'Academic', topic: 'X', subject: 'Y', includeImages: false, imageCount: 0, language: 'Urdu' };
  const content = '# Title\n\n## Abstract\nThis is English text.\n\n## Introduction\nMore English.\n\n## Main Body\n\n### Section\nStill English.\n\n## Conclusion\nEnglish conclusion.';
  const v = validateContentAgainstParams({ payload, content });
  assert.equal(v.ok, false);
  assert.ok(v.issues.some((i) => i.code === 'LANGUAGE_MISMATCH'));
});

test('isLikelyGeneric flags known filler patterns', () => {
  const content = '# Title\n\nThe implications of these findings are profound.';
  assert.equal(isLikelyGeneric(content), true);
});

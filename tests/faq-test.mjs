import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  FAQ_TOPICS, 
  getFaqTopicById, 
  searchFaqTopics 
} from '../src/lib/faq.ts';

test('FAQ & Guide: All required core topics are defined', () => {
  assert.ok(Array.isArray(FAQ_TOPICS));
  assert.ok(FAQ_TOPICS.length >= 6);

  const topicIds = FAQ_TOPICS.map(t => t.id);
  assert.ok(topicIds.includes('usermark-vs-blockrange'), 'Must include usermark-vs-blockrange topic');
  assert.ok(topicIds.includes('multi-block-healing'), 'Must include multi-block-healing topic');
  assert.ok(topicIds.includes('audit-telemetry'), 'Must include audit-telemetry topic');
  assert.ok(topicIds.includes('token-offsets'), 'Must include token-offsets topic');
  assert.ok(topicIds.includes('locations-and-tagmap'), 'Must include locations-and-tagmap topic');
  assert.ok(topicIds.includes('sqlite-tables-overview'), 'Must include sqlite-tables-overview topic');
});

test('FAQ & Guide: UserMark vs BlockRange explains master entity, text spans & counts', () => {
  const topic = getFaqTopicById('usermark-vs-blockrange');
  assert.ok(topic, 'Topic usermark-vs-blockrange must exist');
  assert.equal(topic.id, 'usermark-vs-blockrange');

  // Verify explanation of UserMark vs BlockRange
  const allText = JSON.stringify(topic);
  assert.ok(allText.includes('UserMark'), 'Must explain UserMark');
  assert.ok(allText.includes('BlockRange'), 'Must explain BlockRange');
  assert.ok(allText.includes('ColorIndex'), 'Must explain ColorIndex');
  assert.ok(allText.includes('UserMarkGuid'), 'Must explain UserMarkGuid');
  assert.ok(allText.includes('BlockType'), 'Must explain BlockType');
  assert.ok(allText.includes('Identifier'), 'Must explain Identifier');

  // Verify explanation of why BlockRange count exceeds UserMark count
  assert.ok(
    allText.toLowerCase().includes('higher') || allText.toLowerCase().includes('exceeds'),
    'Must explain why BlockRange count exceeds UserMark count'
  );
  assert.ok(
    allText.toLowerCase().includes('multiple') || allText.toLowerCase().includes('paragraph'),
    'Must mention multi-paragraph / cross-paragraph creation'
  );

  // Schema code snippet check
  const codeSnippet = topic.sections.find(s => s.codeSnippet)?.codeSnippet;
  assert.ok(codeSnippet);
  assert.ok(codeSnippet.includes('CREATE TABLE UserMark'));
  assert.ok(codeSnippet.includes('CREATE TABLE BlockRange'));
});

test('FAQ & Guide: Multi-Block Highlight Healing explains legacy bugs and smart repair', () => {
  const topic = getFaqTopicById('multi-block-healing');
  assert.ok(topic, 'Topic multi-block-healing must exist');

  const allText = JSON.stringify(topic);
  assert.ok(allText.toLowerCase().includes('legacy') || allText.toLowerCase().includes('truncation'), 'Must explain legacy truncation issue');
  assert.ok(allText.includes('BlockRange'), 'Must reference BlockRange');
  assert.ok(allText.includes('Smart Auto-Repair') || allText.includes('auto-repair'), 'Must explain smart auto-repair engine');
  assert.ok(allText.includes('UserMarkGuid'), 'Must explain correlation by UserMarkGuid');
  assert.ok(allText.toLowerCase().includes('duplicate'), 'Must explain span deduplication');

  // Callout check
  const hasCallout = topic.sections.some(s => s.callout);
  assert.ok(hasCallout, 'Must include callout highlighting legacy bug examples');
});

test('FAQ & Guide: Audit Log Telemetry explains "Unified X (+Y new/healed)"', () => {
  const topic = getFaqTopicById('audit-telemetry');
  assert.ok(topic, 'Topic audit-telemetry must exist');

  const allText = JSON.stringify(topic);
  assert.ok(allText.includes('Unified'), 'Must reference Unified log string');
  assert.ok(allText.includes('new/healed') || allText.includes('+Y'), 'Must explain new/healed telemetry');
  assert.ok(allText.includes('total number') || allText.includes('total count') || allText.includes('total BlockRange') || allText.includes('rows inspected'), 'Must explain X (source total)');
  assert.ok(allText.includes('newly unified') || allText.includes('inserted') || allText.includes('non-duplicate'), 'Must explain Y (new/healed count)');
});

test('FAQ & Guide: Token Offsets explains StartToken, EndToken, and Character/Word offsets', () => {
  const topic = getFaqTopicById('token-offsets');
  assert.ok(topic, 'Topic token-offsets must exist');

  const allText = JSON.stringify(topic);
  assert.ok(allText.includes('StartToken'), 'Must explain StartToken');
  assert.ok(allText.includes('EndToken'), 'Must explain EndToken');
  assert.ok(allText.includes('BlockType'), 'Must explain BlockType');
  assert.ok(allText.toLowerCase().includes('paragraph') || allText.toLowerCase().includes('token'), 'Must explain token indexing');
  assert.ok(allText.toLowerCase().includes('verse') || allText.toLowerCase().includes('scripture'), 'Must explain verse block type');
});

test('FAQ & Guide: Location & TagMap explains publication linking and study folders', () => {
  const topic = getFaqTopicById('locations-and-tagmap');
  assert.ok(topic, 'Topic locations-and-tagmap must exist');

  const allText = JSON.stringify(topic);
  assert.ok(allText.includes('Location'), 'Must explain Location table');
  assert.ok(allText.includes('TagMap'), 'Must explain TagMap table');
  assert.ok(allText.includes('Tag'), 'Must explain Tag table');
  assert.ok(allText.includes('Position'), 'Must explain Position ordering column');
  assert.ok(allText.includes('BookNumber') || allText.includes('KeySymbol'), 'Must explain publication address columns');
  assert.ok(allText.includes('Type') && allText.includes('TypeId'), 'Must explain schema 5+ Type/TypeId migration');
});

test('FAQ & Guide: getFaqTopicById lookup with IDs and aliases', () => {
  assert.equal(getFaqTopicById('usermark-vs-blockrange')?.id, 'usermark-vs-blockrange');
  assert.equal(getFaqTopicById('multi-block-healing')?.id, 'multi-block-healing');
  assert.equal(getFaqTopicById('audit-telemetry')?.id, 'audit-telemetry');
  assert.equal(getFaqTopicById('token-offsets')?.id, 'token-offsets');
  assert.equal(getFaqTopicById('locations-and-tagmap')?.id, 'locations-and-tagmap');
  assert.equal(getFaqTopicById('sqlite-tables-overview')?.id, 'sqlite-tables-overview');

  // Case-insensitivity & hyphen/underscore tolerance
  assert.equal(getFaqTopicById('USERMARK-VS-BLOCKRANGE')?.id, 'usermark-vs-blockrange');
  assert.equal(getFaqTopicById('multi_block_healing')?.id, 'multi-block-healing');
  assert.equal(getFaqTopicById('audit_telemetry')?.id, 'audit-telemetry');

  // Aliases
  assert.equal(getFaqTopicById('healing')?.id, 'multi-block-healing');
  assert.equal(getFaqTopicById('repair')?.id, 'multi-block-healing');
  assert.equal(getFaqTopicById('telemetry')?.id, 'audit-telemetry');
  assert.equal(getFaqTopicById('starttoken')?.id, 'token-offsets');
  assert.equal(getFaqTopicById('tokens')?.id, 'token-offsets');
  assert.equal(getFaqTopicById('tagmap')?.id, 'locations-and-tagmap');
  assert.equal(getFaqTopicById('tables')?.id, 'sqlite-tables-overview');

  // Safe fallback for nonexistent terms
  assert.equal(getFaqTopicById('nonexistent-id'), undefined);
  assert.equal(getFaqTopicById(null), undefined);
  assert.equal(getFaqTopicById(undefined), undefined);
});

test('FAQ & Guide: searchFaqTopics query filtering', () => {
  // Empty or null query returns all topics
  assert.equal(searchFaqTopics('').length, FAQ_TOPICS.length);
  assert.equal(searchFaqTopics(null).length, FAQ_TOPICS.length);
  assert.equal(searchFaqTopics('   ').length, FAQ_TOPICS.length);

  // Exact term query
  const healingResults = searchFaqTopics('healing');
  assert.ok(healingResults.some(t => t.id === 'multi-block-healing'));

  const telemetryResults = searchFaqTopics('telemetry');
  assert.ok(telemetryResults.some(t => t.id === 'audit-telemetry'));

  const blockRangeResults = searchFaqTopics('BlockRange');
  assert.ok(blockRangeResults.some(t => t.id === 'usermark-vs-blockrange'));

  const tokenResults = searchFaqTopics('StartToken');
  assert.ok(tokenResults.some(t => t.id === 'token-offsets'));

  const tagResults = searchFaqTopics('TagMap');
  assert.ok(tagResults.some(t => t.id === 'locations-and-tagmap'));

  // Non-matching query returns empty array
  const emptyResults = searchFaqTopics('xyznonexistentquery987');
  assert.equal(emptyResults.length, 0);
});

const assert = require('node:assert/strict');
const { test } = require('node:test');
const handler = require('../api/farm-ai');

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

test('uses the server-side Bedrock key without sending it to the client', async () => {
  const previousKey = process.env.BEDROCK_API_KEY;
  const previousLegacyKey = process.env.OPENAI_API_KEY;
  const previousFetch = global.fetch;
  process.env.BEDROCK_API_KEY = 'test-bedrock-key';
  process.env.OPENAI_API_KEY = 'legacy-key';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Water 20 L every 2 days.' } }] }) };
  };

  try {
    const res = response();
    await handler({ method: 'POST', body: { question: 'តើខ្ញុំគួរស្រោចទឹកចម្ការទុរេនពេលណា?' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(request.url, 'https://bedrock-mantle.ap-southeast-2.api.aws/v1/chat/completions');
    assert.equal(request.options.headers.Authorization, 'Bearer test-bedrock-key');
    assert.equal(JSON.parse(request.options.body).model, 'openai.gpt-oss-20b');
    assert.ok(res.body.answer);
    assert.ok(!res.body.answer.includes('20'));
    assert.ok(res.body.answer.includes('ទឹកជាំ'));
    assert.deepEqual(res.body.knowledgeSources.map(source => source.id), ['durian-irrigation']);
    assert.deepEqual(res.body.products, []);
    assert.ok(JSON.parse(request.options.body).messages[0].content.includes('Never advise watering already wet'));
    assert.ok(!JSON.stringify(res.body).includes('test-bedrock-key'));

    global.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'ខ្ញុំជួយកសិករដូរីយ៉ាន។' } }] }) });
    const wording = response();
    await handler({ method: 'POST', body: { question: 'តើអ្នកអាចជួយអ្វីខ្លះ?' } }, wording);
    assert.ok(wording.body.answer.includes('កសិករដាំទុរេន'));
    assert.ok(!wording.body.answer.includes('ដូរីយ៉ាន'));

    global.fetch = async () => { throw new Error('Greeting should use the reviewed Khmer text'); };
    const greeting = response();
    await handler({ method: 'POST', body: { question: 'hi b' } }, greeting);
    assert.equal(greeting.statusCode, 200);
    assert.ok(greeting.body.answer.startsWith('សួស្តីបង!'));
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BEDROCK_API_KEY;
    else process.env.BEDROCK_API_KEY = previousKey;
    if (previousLegacyKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousLegacyKey;
  }
});


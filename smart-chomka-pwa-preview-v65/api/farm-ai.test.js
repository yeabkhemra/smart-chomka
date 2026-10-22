const assert = require('node:assert/strict');
const { test } = require('node:test');
const handler = require('./farm-ai');

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
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'សួស្តី' } }] }) };
  };

  try {
    const res = response();
    await handler({ method: 'POST', body: { question: 'សួស្តី' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(request.url, 'https://bedrock-mantle.ap-southeast-2.api.aws/v1/chat/completions');
    assert.equal(request.options.headers.Authorization, 'Bearer test-bedrock-key');
    assert.equal(JSON.parse(request.options.body).model, 'openai.gpt-oss-20b');
    assert.ok(res.body.answer);
    assert.ok(!JSON.stringify(res.body).includes('test-bedrock-key'));
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BEDROCK_API_KEY;
    else process.env.BEDROCK_API_KEY = previousKey;
    if (previousLegacyKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousLegacyKey;
  }
});

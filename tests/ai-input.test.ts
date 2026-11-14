import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAiInput } from '../src/ai/input-policy';
import { geminiConfigured } from '../src/ai/model-config';

test('AI bounds input by UTF-8 bytes, including multi-byte text, before generation',()=> {
  assert.doesNotThrow(()=>validateAiInput({summary:'brief summary'}));
  assert.throws(()=>validateAiInput({summary:'x'.repeat(12000)}));
  assert.throws(()=>validateAiInput({summary:'界'.repeat(4000)}));
  assert.throws(()=>validateAiInput(undefined));
});
test('AI configuration requires paid-tier confirmation and both server credentials',()=> {
  const keys=['GOOGLE_GENAI_API_KEY','SUPABASE_SERVICE_ROLE_KEY','AI_PAID_TIER_CONFIRMED'] as const;
  const saved=keys.map(key=>process.env[key]);
  try {
    for(const key of keys)delete process.env[key];
    assert.equal(geminiConfigured(),false);
    process.env.GOOGLE_GENAI_API_KEY='synthetic-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service-key';
    assert.equal(geminiConfigured(),false);
    process.env.AI_PAID_TIER_CONFIRMED='true';
    assert.equal(geminiConfigured(),true);
    process.env.GOOGLE_GENAI_API_KEY='  ';
    assert.equal(geminiConfigured(),false);
  } finally {keys.forEach((key,i)=> {if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});}
});

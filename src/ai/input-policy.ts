import { MAX_AI_INPUT_BYTES } from './model-config';

export function validateAiInput(input: unknown) {
  const encoded = JSON.stringify(input);
  if (!encoded || new TextEncoder().encode(encoded).length > MAX_AI_INPUT_BYTES) {
    throw new Error('Please shorten your input to a brief summary (maximum 12 KB).');
  }
}

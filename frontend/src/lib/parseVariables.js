// Extracts valid variable names from {{ name }} templates in text.
// - accepts only legal JS identifiers (ignores {{ 1x }}, {{ a-b }}, {{ }} …)
// - dedupes, preserving first-seen order (so handle positions stay stable)
const TEMPLATE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function parseVariables(text = '') {
  const seen = new Set();
  let match;
  while ((match = TEMPLATE.exec(text)) !== null) {
    const name = match[1];
    if (IDENTIFIER.test(name)) seen.add(name);
  }
  return [...seen];
}

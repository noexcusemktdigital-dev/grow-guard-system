import type { Matcher } from './runner.ts';

export const contains = (text: string, opts: { caseSensitive?: boolean } = {}): Matcher => ({
  name: `contains("${text}")`,
  check: (out) => {
    const haystack = opts.caseSensitive ? out : out.toLowerCase();
    const needle = opts.caseSensitive ? text : text.toLowerCase();
    return { ok: haystack.includes(needle), reason: haystack.includes(needle) ? undefined : `not found in output` };
  }
});

export const notContains = (text: string): Matcher => ({
  name: `notContains("${text}")`,
  check: (out) => ({ ok: !out.toLowerCase().includes(text.toLowerCase()), reason: `unexpected presence` })
});

export const matchesRegex = (re: RegExp): Matcher => ({
  name: `matchesRegex(${re})`,
  check: (out) => ({ ok: re.test(out), reason: `regex did not match` })
});

export const minLength = (n: number): Matcher => ({
  name: `minLength(${n})`,
  check: (out) => ({ ok: out.length >= n, reason: `output too short (${out.length} < ${n})` })
});

export const maxLength = (n: number): Matcher => ({
  name: `maxLength(${n})`,
  check: (out) => ({ ok: out.length <= n, reason: `output too long (${out.length} > ${n})` })
});

export const isJSON = (): Matcher => ({
  name: `isJSON`,
  check: (out) => {
    try { JSON.parse(out); return { ok: true }; }
    catch (e) { return { ok: false, reason: `not valid JSON: ${e}` }; }
  }
});

export const hasKeys = (keys: string[]): Matcher => ({
  name: `hasKeys([${keys.join(',')}])`,
  check: (out) => {
    try {
      const obj = JSON.parse(out);
      const missing = keys.filter(k => !(k in obj));
      return { ok: missing.length === 0, reason: missing.length ? `missing: ${missing.join(',')}` : undefined };
    } catch (e) { return { ok: false, reason: `not JSON: ${e}` }; }
  }
});

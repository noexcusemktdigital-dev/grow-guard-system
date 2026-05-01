// Runner simples de evals.
// Cada eval define: nome, fn target, fixtures, matchers.
// Roda em série (LLM tem rate limit), reporta por fixture.

export interface EvalCase<T = unknown> {
  name: string;
  input: T;
  matchers: Matcher[];
}

export interface Matcher {
  name: string;
  check: (output: string) => Promise<{ ok: boolean; reason?: string }> | { ok: boolean; reason?: string };
}

export interface EvalSuite<T = unknown> {
  name: string;
  fnTarget: (input: T) => Promise<string>;
  cases: EvalCase<T>[];
  threshold?: number;  // default 0.9
}

export interface EvalResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  rate: number;
  failures: Array<{ case: string; matcher: string; reason: string }>;
}

export async function runEval<T>(suite: EvalSuite<T>): Promise<EvalResult> {
  const failures: EvalResult['failures'] = [];
  let passed = 0, total = 0;
  for (const c of suite.cases) {
    let output: string;
    try {
      output = await suite.fnTarget(c.input);
    } catch (e) {
      total += c.matchers.length;
      for (const m of c.matchers) failures.push({ case: c.name, matcher: m.name, reason: `target_throw: ${e}` });
      continue;
    }
    for (const m of c.matchers) {
      total++;
      const r = await m.check(output);
      if (r.ok) passed++;
      else failures.push({ case: c.name, matcher: m.name, reason: r.reason ?? 'no_reason' });
    }
  }
  return {
    suite: suite.name,
    total, passed, failed: total - passed,
    rate: total === 0 ? 0 : passed / total,
    failures,
  };
}

export function printResult(r: EvalResult, threshold = 0.9): boolean {
  console.log(`\n=== ${r.suite} ===`);
  console.log(`Pass rate: ${(r.rate * 100).toFixed(1)}% (${r.passed}/${r.total})`);
  console.log(`Threshold: ${(threshold * 100).toFixed(0)}%`);
  if (r.failures.length > 0) {
    console.log(`\nFailures (${r.failures.length}):`);
    for (const f of r.failures.slice(0, 10)) {
      console.log(`  - [${f.case}] ${f.matcher}: ${f.reason}`);
    }
  }
  const ok = r.rate >= threshold;
  console.log(ok ? 'PASS' : 'FAIL');
  return ok;
}

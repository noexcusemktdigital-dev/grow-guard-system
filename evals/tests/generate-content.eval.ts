import { runEval, printResult, type EvalSuite } from '../lib/runner.ts';
import { minLength, maxLength, notContains } from '../lib/matchers.ts';
import fixtures from '../fixtures/content-briefs.json' assert { type: 'json' };

async function callGenerateContent(input: any): Promise<string> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-content`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  return data.message ?? data.content ?? JSON.stringify(data);
}

const suite: EvalSuite<any> = {
  name: 'generate-content',
  fnTarget: callGenerateContent,
  cases: fixtures.map((f: any) => ({
    name: f.name,
    input: f.input,
    matchers: [
      minLength(50),
      maxLength(f.input.max_chars + 200),  // tolera +200 (LLM ignora limites estritos)
      notContains('Lorem ipsum'),
      notContains('como modelo de IA'),
    ]
  }))
};

if (import.meta.main) {
  const result = await runEval(suite);
  const ok = printResult(result, 0.85);
  Deno.exit(ok ? 0 : 1);
}

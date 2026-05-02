import { runEval, printResult, type EvalSuite } from '../lib/runner.ts';
import { contains, notContains, minLength, maxLength } from '../lib/matchers.ts';
import fixtures from '../fixtures/generate-template-layout-inputs.json' assert { type: 'json' };

async function callFn(input: any): Promise<string> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-template-layout`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  return data.message ?? data.content ?? data.layout ?? JSON.stringify(data);
}

const suite: EvalSuite<any> = {
  name: 'generate-template-layout',
  fnTarget: callFn,
  cases: fixtures.map((f: any) => ({
    name: f.name,
    input: f.input,
    matchers: [
      minLength(100),
      maxLength(6000),
      notContains('Lorem ipsum'),
      notContains('como modelo de IA'),
      contains(f.input.template_type),
      contains(f.input.brand),
      contains(f.input.format),
    ],
  })),
};

if (import.meta.main) {
  const r = await runEval(suite);
  Deno.exit(printResult(r, 0.85) ? 0 : 1);
}

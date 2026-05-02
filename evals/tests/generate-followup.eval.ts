import { runEval, printResult, type EvalSuite } from '../lib/runner.ts';
import { contains, notContains, minLength, maxLength } from '../lib/matchers.ts';
import fixtures from '../fixtures/generate-followup-inputs.json' assert { type: 'json' };

async function callFn(input: any): Promise<string> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-followup`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  return data.message ?? data.content ?? data.followup ?? JSON.stringify(data);
}

const suite: EvalSuite<any> = {
  name: 'generate-followup',
  fnTarget: callFn,
  cases: fixtures.map((f: any) => ({
    name: f.name,
    input: f.input,
    matchers: [
      minLength(50),
      maxLength(2000),
      notContains('Lorem ipsum'),
      notContains('como modelo de IA'),
      contains(f.input.lead_name),
      contains(f.input.product),
    ],
  })),
};

if (import.meta.main) {
  const r = await runEval(suite);
  Deno.exit(printResult(r, 0.85) ? 0 : 1);
}

import { runEval, printResult, type EvalSuite } from '../lib/runner.ts';
import { contains, notContains, minLength, maxLength } from '../lib/matchers.ts';
import fixtures from '../fixtures/prospection-leads.json' assert { type: 'json' };

// Stub: substituir por chamada real à edge fn em prod
async function callGenerateProspection(input: any): Promise<string> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-prospection`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  return data.message ?? data.content ?? JSON.stringify(data);
}

const suite: EvalSuite<any> = {
  name: 'generate-prospection',
  fnTarget: callGenerateProspection,
  cases: fixtures.map((f: any) => ({
    name: f.name,
    input: f.input,
    matchers: [
      minLength(100),                          // resposta não muito curta
      maxLength(2000),                          // não exagerada
      contains(f.input.lead_name),              // menciona o lead
      contains(f.input.segment),                // contextualiza segmento
      notContains('Lorem ipsum'),               // não é placeholder
      notContains('como modelo de IA'),         // não revela ser LLM
    ]
  }))
};

if (import.meta.main) {
  const result = await runEval(suite);
  const ok = printResult(result, 0.85);
  Deno.exit(ok ? 0 : 1);
}

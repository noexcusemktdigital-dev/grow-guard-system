#!/usr/bin/env tsx
// scripts/check-stale-time.ts
//
// Phase 19 T8 — verifica queries React sem staleTime explícito.
// Sem staleTime, React Query usa default 0 (refetch agressivo) — custo desnecessário
// + carga extra em Supabase + UX pior (re-render flicker).
//
// Falha CI se encontrar queries problematicas em arquivos modificados (PR diff).

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { glob } from 'glob';

const MODE = process.env.CHECK_STALE_TIME_MODE ?? 'diff'; // 'diff' | 'all'
const ALLOW_LIST = ['src/__tests__/', 'src/test/'];

function findFiles(): string[] {
  if (MODE === 'all') {
    return glob.sync('src/**/*.{ts,tsx}', { ignore: 'src/**/*.test.*' });
  }
  // diff mode: arquivos alterados vs origin/main
  try {
    const out = execSync('git diff --name-only origin/main...HEAD -- "src/**/*.ts" "src/**/*.tsx"').toString();
    return out.split('\n').filter(f => f && existsSync(f) && !ALLOW_LIST.some(a => f.startsWith(a)));
  } catch {
    return [];
  }
}

function checkFile(path: string): { problem: boolean; details: string[] } {
  const content = readFileSync(path, 'utf-8');
  const issues: string[] = [];
  // Match useQuery({...}) ignoring staleTime
  // Heuristica: regex multi-linha. Falsos negativos preferidos a falsos positivos.
  const useQueryRegex = /useQuery\s*\(\s*\{[^}]*\}/gms;
  let match;
  while ((match = useQueryRegex.exec(content)) !== null) {
    const block = match[0];
    if (!block.includes('staleTime')) {
      const lineNumber = content.slice(0, match.index).split('\n').length;
      issues.push(`${path}:${lineNumber} — useQuery sem staleTime`);
    }
  }
  return { problem: issues.length > 0, details: issues };
}

const files = findFiles();
console.log(`[check-stale-time] Verificando ${files.length} arquivo(s) (mode=${MODE})...`);

const allIssues: string[] = [];
for (const f of files) {
  const r = checkFile(f);
  allIssues.push(...r.details);
}

if (allIssues.length === 0) {
  console.log('OK Nenhuma query sem staleTime encontrada.');
  process.exit(0);
}

console.error(`ERRO Encontradas ${allIssues.length} queries sem staleTime:\n`);
allIssues.forEach(i => console.error(`  ${i}`));
console.error('\nAdicione `staleTime: <ms>` em cada useQuery. Recomendacao:');
console.error('  - Listas (que mudam pouco): 5*60*1000 (5 min)');
console.error('  - Detalhes: 60*1000 (1 min)');
console.error('  - Tempo real (chat, notificacoes): 0');
process.exit(1);

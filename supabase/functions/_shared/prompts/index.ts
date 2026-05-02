// Re-exports centralizados dos prompts versionados.
// Cada namespace corresponde a uma edge function generate-*.
// Import: import { Prospection } from '../_shared/prompts/index.ts';

export * as Prospection from './generate-prospection.ts';
export * as Content from './generate-content.ts';
export * as Followup from './generate-followup.ts';
export * as Strategy from './generate-strategy.ts';
export * as Script from './generate-script.ts';

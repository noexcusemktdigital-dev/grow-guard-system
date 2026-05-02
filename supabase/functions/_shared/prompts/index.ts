// Re-exports centralizados dos prompts versionados.
// Cada namespace corresponde a uma edge function generate-*.
// Import: import { Prospection } from '../_shared/prompts/index.ts';

export * as Prospection from './generate-prospection.ts';
export * as Content from './generate-content.ts';
export * as Followup from './generate-followup.ts';
export * as Strategy from './generate-strategy.ts';
export * as Script from './generate-script.ts';
export * as TrafficStrategy from './generate-traffic-strategy.ts';
export * as SocialBriefing from './generate-social-briefing.ts';
export * as SocialConcepts from './generate-social-concepts.ts';
export * as TemplateLayout from './generate-template-layout.ts';
export * as DailyChecklist from './generate-daily-checklist.ts';
export * as DailyTasks from './generate-daily-tasks.ts';
export * as Site from './generate-site.ts';
export * as SocialImage from './generate-social-image.ts';
export * as SocialVideoFrames from './generate-social-video-frames.ts';
export * as VideoBriefing from './generate-video-briefing.ts';
export * as SupportAccess from './generate-support-access.ts';

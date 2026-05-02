/**
 * Taxonomy de eventos — fonte única de verdade.
 *
 * Nomenclatura: snake_case, verb_object.
 * Adicionar novo evento aqui ANTES de chamar analytics.track().
 */

export const ANALYTICS_EVENTS = {
  // Auth
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_SUCCEEDED: 'login_succeeded',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_FINISHED: 'onboarding_finished',

  // Pagamento
  CHECKOUT_INITIATED: 'checkout_initiated',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_FAILED: 'checkout_failed',
  CREDITS_PURCHASED: 'credits_purchased',

  // IA
  AI_CONTENT_GENERATED: 'ai_content_generated',
  AI_CONTENT_FAILED: 'ai_content_failed',
  AI_CREDITS_DEPLETED: 'ai_credits_depleted',
  AI_RATE_LIMITED: 'ai_rate_limited',

  // Integrações
  INTEGRATION_CONNECTED: 'integration_connected',
  INTEGRATION_DISCONNECTED: 'integration_disconnected',
  INTEGRATION_FAILED: 'integration_failed',

  // CRM
  LEAD_CREATED: 'lead_created',
  LEAD_STAGE_CHANGED: 'lead_stage_changed',

  // Engagement
  PAGE_VIEWED: 'page_viewed',
  FEATURE_USED: 'feature_used',

  // LGPD
  DSR_EXPORT_REQUESTED: 'dsr_export_requested',
  DSR_DELETE_REQUESTED: 'dsr_delete_requested',

  // Erros
  ERROR_DISPLAYED: 'error_displayed',
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

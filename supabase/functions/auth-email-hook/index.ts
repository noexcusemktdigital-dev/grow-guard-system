import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { maskEmail } from '../_shared/redact.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const SITE_NAME = "NoExcuse Digital"
const ROOT_DOMAIN = "sistema.noexcusedigital.com.br"
const FROM_ADDRESS = `${SITE_NAME} <noreply@noexcusedigital.com.br>`

// API-004: webhook is called server-to-server by Lovable; no wildcard needed.
const corsHeaders = {
  'Access-Control-Allow-Origin': `https://${ROOT_DOMAIN}`,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirme seu e-mail',
  invite: 'Você foi convidado(a)',
  magiclink: 'Seu link de acesso',
  recovery: 'Redefinir sua senha',
  email_change: 'Confirme seu novo e-mail',
  reauthentication: 'Seu código de verificação',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EMAIL_TEMPLATES: Record<string, React.ComponentType<Record<string, unknown>>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Types already handled by dedicated Edge Functions — skip to avoid duplicates
const SKIP_TYPES = new Set(['signup', 'recovery'])

const SAMPLE_PROJECT_URL = "https://grow-guard-system.lovable.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, recipient: SAMPLE_EMAIL, confirmationUrl: SAMPLE_PROJECT_URL },
  magiclink: { siteName: SITE_NAME, confirmationUrl: SAMPLE_PROJECT_URL },
  recovery: { siteName: SITE_NAME, confirmationUrl: SAMPLE_PROJECT_URL },
  invite: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, confirmationUrl: SAMPLE_PROJECT_URL },
  email_change: { siteName: SITE_NAME, email: SAMPLE_EMAIL, newEmail: SAMPLE_EMAIL, confirmationUrl: SAMPLE_PROJECT_URL },
  reauthentication: { token: '123456' },
}

// Preview endpoint — returns rendered HTML without sending
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? `https://${ROOT_DOMAIN}`,
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]
  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Send email directly via Resend API
async function sendViaResend(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Resend API error', { status: response.status, body: errorBody })
      return { success: false, error: `Resend API ${response.status}: ${errorBody}` }
    }

    const result = await response.json()
    return { success: true, id: result.id }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, error: msg }
  }
}

// Webhook handler — verifies signature, renders template, sends via Resend
async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  type EmailWebhookPayload = {
    run_id: string;
    version: string;
    data: { action_type: string; email: string; url: string; token: string; new_email?: string };
  };
  // Verify webhook signature
  let payload: EmailWebhookPayload
  let run_id = ''
  try {
    const verified = await verifyWebhookRequest({
      req, secret: apiKey, parser: parseEmailWebhookPayload,
    })
    payload = verified.payload as EmailWebhookPayload
    run_id = payload.run_id
  } catch (error) {
    if (error instanceof WebhookError) {
      switch (error.code) {
        case 'invalid_signature':
        case 'missing_timestamp':
        case 'invalid_timestamp':
        case 'stale_timestamp':
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        case 'invalid_payload':
        case 'invalid_json':
          return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
      }
    }
    console.error('Webhook verification failed', { error })
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!run_id) {
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (payload.version !== '1') {
    return new Response(JSON.stringify({ error: `Unsupported payload version: ${payload.version}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = payload.data.action_type
  console.log('Received auth event', { emailType, email: maskEmail(payload.data.email), run_id })

  // Skip types already handled by dedicated Edge Functions
  if (SKIP_TYPES.has(emailType)) {
    console.log('Skipping — handled by dedicated Edge Function', { emailType, run_id })
    return new Response(JSON.stringify({ success: true, skipped: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType, run_id })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const messageId = crypto.randomUUID()
  const subject = EMAIL_SUBJECTS[emailType] || 'Notificação'

  // Log pending
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: 'pending',
  })

  // Send directly via Resend
  const result = await sendViaResend(resendApiKey, payload.data.email, subject, html, text)

  if (!result.success) {
    console.error('Failed to send auth email via Resend', { error: result.error, run_id, emailType })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: emailType,
      recipient_email: payload.data.email,
      status: 'failed',
      error_message: result.error,
    })
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Log success
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: 'sent',
  })

  console.log('Auth email sent via Resend', { emailType, email: maskEmail(payload.data.email), resendId: result.id, run_id })

  return new Response(
    JSON.stringify({ success: true, sent: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'auth-email-hook');
  const log = makeLogger(ctx);
  log.info('request_received', { method: req.method });

  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    return await handleWebhook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

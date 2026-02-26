

## Audio Transcription for AI Agents

### Problem
Two gaps prevent AI agents from processing audio messages:

1. **Webhook (`whatsapp-webhook/index.ts`, line 161)**: Only triggers `ai-agent-reply` when `messageText` exists. Audio messages have no text, only `media_url` -- so the AI is never called.
2. **Webhook doesn't pass `message_type` or `media_url`** to the AI agent function, so even if triggered, the agent can't find the audio URL.
3. **AI Agent (`ai-agent-reply/index.ts`, line 105)**: Requires `message_text` to be present (`!message_text` returns error). For audio, `message_text` will be empty.

### Solution

**File 1: `supabase/functions/whatsapp-webhook/index.ts`**

- Change the trigger condition (line 161) from `if (messageText)` to `if (messageText || mediaUrl)` so audio/media messages also invoke the AI agent.
- Pass `message_type` and `media_url` in the payload sent to `ai-agent-reply`.

**File 2: `supabase/functions/ai-agent-reply/index.ts`**

- Update the destructuring (line 93) to also extract `media_url`.
- Change the validation (line 105) to accept messages that have either `message_text` or `media_url`.
- Update the audio transcription block (line 243) to use `media_url` when `message_text` is empty (audio-only messages).

### Impact
- 2 edge functions updated
- AI agents will automatically transcribe incoming voice notes and respond based on the transcribed content
- No UI changes needed
- Both functions will be auto-deployed

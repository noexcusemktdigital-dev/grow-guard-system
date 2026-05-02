# WhatsApp Meta/Izitech Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the NoExcuse WhatsApp integrations UI into two explicit modules: official Meta WhatsApp Cloud API for App Review and Izitech/Evolution for managed QR operation.

**Architecture:** Keep the existing `whatsapp_instances.provider` contract. Filter `whatsapp_cloud` instances into a Meta module and `evolution`/legacy instances into an Izitech module, with provider-specific setup copy, status metadata, and actions.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Supabase Edge Functions.

---

### Task 1: Prove Visible Separation

**Files:**
- Create: `src/pages/cliente/__tests__/ClienteIntegracoes.whatsapp-split.test.tsx`
- Modify: `src/pages/cliente/ClienteIntegracoes.tsx`
- Modify: `src/pages/cliente/ClienteIntegracoesHelpers.tsx`
- Modify: `src/components/cliente/WhatsAppSetupWizard.tsx`

- [ ] Write a failing test that renders `ClienteIntegracoes` with one `whatsapp_cloud` instance and one `evolution` instance.
- [ ] Assert the page shows `WhatsApp Cloud API — Meta oficial`, `WhatsApp via Izitech`, WABA ID, Phone Number ID, and the Meta webhook URL.
- [ ] Run `npm test -- src/pages/cliente/__tests__/ClienteIntegracoes.whatsapp-split.test.tsx` and verify it fails because the current UI groups everything as Izitech.
- [ ] Implement provider filtering and provider-specific cards.
- [ ] Re-run the focused test until it passes.

### Task 2: Make The Meta Setup Flow Reviewable

**Files:**
- Modify: `src/components/cliente/WhatsAppSetupWizard.tsx`
- Modify: `src/pages/cliente/ClienteIntegracoes.tsx`

- [ ] Add setup mode props so the same dialog can open in `meta_cloud` or `izitech` mode.
- [ ] For Meta mode, render official Cloud API setup copy, required identifiers, webhook URL, verification checklist, and save through `provider: "whatsapp_cloud"`.
- [ ] For Izitech mode, preserve the QR/payment flow and Izitech copy.
- [ ] Keep existing Evolution behavior unchanged.

### Task 3: Verify And Publish

**Files:**
- Test only unless failures require scoped fixes.

- [ ] Run the focused page test.
- [ ] Run `npm test -- src/hooks/__tests__/useWhatsApp.test.ts src/pages/cliente/__tests__/ClienteIntegracoes.whatsapp-split.test.tsx`.
- [ ] Run `npm run build`.
- [ ] Commit, push, open PR, and merge when CI is green.

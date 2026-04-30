import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Meta App Review compliance — least privilege scopes", () => {
  // ----- Read flows must NOT request ads_management or business_management -----
  it("ads-oauth-start does not request ads_management or business_management", () => {
    const src = read("supabase/functions/ads-oauth-start/index.ts");
    expect(src).not.toMatch(/"ads_management"/);
    expect(src).not.toMatch(/"business_management"/);
    expect(src).toMatch(/"ads_read"/);
    expect(src).toMatch(/"leads_retrieval"/);
    expect(src).toMatch(/"pages_show_list"/);
    expect(src).toMatch(/"pages_read_engagement"/);
    expect(src).toMatch(/"pages_manage_ads"/);
    expect(src).toMatch(/"pages_manage_metadata"/);
  });

  it("useAdPlatforms Meta Ads scopes are read-only (no ads_management/business_management)", () => {
    const src = read("src/hooks/useAdPlatforms.ts");
    const metaLine = src.split("\n").find((l) => l.includes("metaScopes ="));
    expect(metaLine).toBeTruthy();
    expect(metaLine).not.toMatch(/ads_management/);
    expect(metaLine).not.toMatch(/business_management/);
    expect(metaLine).toMatch(/ads_read/);
    expect(metaLine).toMatch(/leads_retrieval/);
    expect(metaLine).toMatch(/pages_show_list/);
    expect(metaLine).toMatch(/pages_read_engagement/);
    expect(metaLine).toMatch(/pages_manage_ads/);
    expect(metaLine).toMatch(/pages_manage_metadata/);
  });

  it("use-ads-connections useInitiateMetaOAuth scope is read-only", () => {
    const src = read("src/hooks/use-ads-connections.ts");
    // Encontrar a linha do scope dentro do dialog OAuth
    const scopeLine = src.split("\n").find((l) => l.includes("scope:") && l.includes("ads_read"));
    expect(scopeLine).toBeTruthy();
    expect(scopeLine).not.toMatch(/ads_management/);
    expect(scopeLine).not.toMatch(/business_management/);
    expect(scopeLine).toMatch(/leads_retrieval/);
    expect(scopeLine).toMatch(/pages_manage_ads/);
    expect(scopeLine).toMatch(/pages_manage_metadata/);
  });

  // ----- Social OAuth Meta: base scopes always present, lead-ads only on crm-leads -----
  it("social-oauth-meta has 6 base social scopes and conditional lead-ads scopes", () => {
    const src = read("supabase/functions/social-oauth-meta/index.ts");
    // base scopes
    for (const s of [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
    ]) {
      expect(src).toMatch(new RegExp(`"${s}"`));
    }
    // lead-ads conditional
    expect(src).toMatch(/leads_retrieval/);
    expect(src).toMatch(/pages_manage_ads/);
    expect(src).toMatch(/pages_manage_metadata/);
    expect(src).toMatch(/redirectTo === "crm-leads"/);
  });

  it("social-oauth-callback writes lead-ads scopes when redirect_to=crm-leads", () => {
    const src = read("supabase/functions/social-oauth-callback/index.ts");
    expect(src).toMatch(/redirect_to/);
    expect(src).toMatch(/crm-leads/);
    expect(src).toMatch(/leads_retrieval/);
    expect(src).toMatch(/pages_manage_ads/);
    expect(src).toMatch(/pages_manage_metadata/);
    // base scopes still present
    expect(src).toMatch(/instagram_content_publish/);
    expect(src).toMatch(/pages_manage_posts/);
  });

  // ----- Lead Ads error messages guide reconnection through CRM > Integrações > Meta Lead Ads -----
  it("meta-leadgen-pages error message guides Meta Lead Ads reconnection", () => {
    const src = read("supabase/functions/meta-leadgen-pages/index.ts");
    expect(src).toMatch(/CRM > Integra[cç][oõ]es > Meta Lead Ads/);
    expect(src).toMatch(/leads_retrieval/);
    expect(src).toMatch(/pages_manage_ads/);
    expect(src).toMatch(/pages_manage_metadata/);
  });

  it("meta-leadgen-subscribe error message guides Meta Lead Ads reconnection", () => {
    const src = read("supabase/functions/meta-leadgen-subscribe/index.ts");
    expect(src).toMatch(/CRM > Integra[cç][oõ]es > Meta Lead Ads/);
    expect(src).toMatch(/leads_retrieval/);
    expect(src).toMatch(/pages_manage_ads/);
    expect(src).toMatch(/pages_manage_metadata/);
  });

  // ----- Privacy policy & compliance doc -----
  it("PoliticaPrivacidade lists all Meta permissions and revocation paths", () => {
    const src = read("src/pages/PoliticaPrivacidade.tsx");
    for (const s of [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "leads_retrieval",
      "pages_manage_ads",
      "pages_manage_metadata",
      "ads_read",
    ]) {
      expect(src).toMatch(new RegExp(s));
    }
    expect(src).toMatch(/Redes Sociais/);
    expect(src).toMatch(/CRM/);
    expect(src).toMatch(/Meta Lead Ads/);
    expect(src).toMatch(/Ferramentas de Neg[óo]cios/);
  });

  it("compliance doc covers permissions, URLs, videos, least-privilege checklist and ads_management risk", () => {
    const src = read("docs/meta-app-review-compliance-2026-04-29.md");
    // permissions
    for (const s of [
      "leads_retrieval",
      "pages_manage_ads",
      "pages_manage_metadata",
      "ads_read",
      "instagram_content_publish",
      "pages_manage_posts",
    ]) {
      expect(src).toMatch(new RegExp(s));
    }
    // URLs
    expect(src).toMatch(/ads-oauth-start/);
    expect(src).toMatch(/ads-oauth-callback/);
    expect(src).toMatch(/meta-leadgen-webhook/);
    // refs
    expect(src).toMatch(/Marketing API/);
    expect(src).toMatch(/Authorization/);
    expect(src).toMatch(/Lead Ads/);
    // videos 6 e 7
    expect(src).toMatch(/6\.\s+\*\*Meta Lead Ads/);
    expect(src).toMatch(/7\.\s+\*\*Meta Ads/);
    // checklist & risk
    expect(src).toMatch(/menor privil[ée]gio/i);
    expect(src).toMatch(/ads_management/);
  });
});

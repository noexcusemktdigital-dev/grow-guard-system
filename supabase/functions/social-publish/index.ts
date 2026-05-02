// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';
import { parseOrThrow, validationErrorResponse, UUID } from "../_shared/schemas.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// social-publish uses a post-lookup pattern — body carries IDs, not content
const SocialPublishBodySchema = z.object({
  social_post_id: UUID,
  org_id: UUID,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialPost {
  id: string;
  social_account_id: string;
  platform: string;
  caption: string;
  hashtags: string[] | null;
  media_urls: string[] | null;
  status: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  access_token: string;
  status: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCaption(caption: string, hashtags: string[] | null): string {
  if (!hashtags || hashtags.length === 0) return caption;
  return `${caption}\n\n${hashtags.join(" ")}`;
}

/** Sleep for ms milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Meta / Instagram publishing (2-step with container polling)
// ---------------------------------------------------------------------------

async function publishInstagram(
  account: SocialAccount,
  post: SocialPost
): Promise<{ platform_post_id: string }> {
  const igUserId = account.metadata?.ig_user_id as string | undefined;
  if (!igUserId) {
    throw new Error(
      "ig_user_id ausente no metadata da conta. Reconecte a conta do Instagram para popular este campo."
    );
  }

  const token = account.access_token;
  const fullCaption = buildCaption(post.caption, post.hashtags);
  const mediaUrl = post.media_urls?.[0];

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    caption: fullCaption,
    access_token: token,
  });

  if (mediaUrl) {
    containerParams.set("image_url", mediaUrl);
    containerParams.set("media_type", "IMAGE");
  } else {
    // Text-only carousel single image not supported on Instagram — require image
    throw new Error(
      "Instagram requer pelo menos uma imagem. Adicione media_urls ao post."
    );
  }

  const containerRes = await fetch(
    `https://graph.facebook.com/v25.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams,
    }
  );

  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(
      `Meta API container error: ${containerData.error?.message ?? JSON.stringify(containerData)}`
    );
  }

  const containerId = containerData.id as string;
  if (!containerId) {
    throw new Error("Meta API não retornou creation_id para o container.");
  }

  // Poll container status (up to 3 × 3s = 9s)
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(3000);
    const statusRes = await fetch(
      `https://graph.facebook.com/v25.0/${containerId}?fields=status_code&access_token=${token}`
    );
    const statusData = await statusRes.json();
    const statusCode = statusData.status_code as string | undefined;

    if (statusCode === "FINISHED") break;
    if (statusCode === "ERROR") {
      throw new Error(
        `Container de mídia com erro no Meta. Container ID: ${containerId}`
      );
    }
    // IN_PROGRESS or unknown — keep polling
    if (attempt === 2 && statusCode !== "FINISHED") {
      throw new Error(
        `Container de mídia não ficou pronto a tempo (status: ${statusCode}). Tente novamente.`
      );
    }
  }

  // Step 2: Publish container
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: token,
  });

  const publishRes = await fetch(
    `https://graph.facebook.com/v25.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams,
    }
  );

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(
      `Meta API publish error: ${publishData.error?.message ?? JSON.stringify(publishData)}`
    );
  }

  return { platform_post_id: publishData.id as string };
}

// ---------------------------------------------------------------------------
// Facebook Page publishing
// ---------------------------------------------------------------------------

async function publishFacebook(
  account: SocialAccount,
  post: SocialPost
): Promise<{ platform_post_id: string }> {
  const pageId = account.metadata?.page_id as string | undefined;
  const pageAccessToken =
    (account.metadata?.page_access_token as string | undefined) ??
    account.access_token;

  if (!pageId) {
    throw new Error(
      "page_id ausente no metadata da conta. Reconecte a conta do Facebook para popular este campo."
    );
  }

  const fullCaption = buildCaption(post.caption, post.hashtags);
  const mediaUrl = post.media_urls?.[0];

  let endpoint: string;
  const bodyParams = new URLSearchParams({ access_token: pageAccessToken });

  if (mediaUrl) {
    endpoint = `https://graph.facebook.com/v25.0/${pageId}/photos`;
    bodyParams.set("url", mediaUrl);
    bodyParams.set("caption", fullCaption);
  } else {
    endpoint = `https://graph.facebook.com/v25.0/${pageId}/feed`;
    bodyParams.set("message", fullCaption);
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyParams,
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Meta API Facebook error: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }

  // photos endpoint returns { id, post_id }; feed returns { id }
  const platformPostId = (data.post_id ?? data.id) as string;
  return { platform_post_id: platformPostId };
}

// ---------------------------------------------------------------------------
// LinkedIn publishing (images: 3-step; text-only: 1-step)
// ---------------------------------------------------------------------------

async function publishLinkedIn(
  account: SocialAccount,
  post: SocialPost
): Promise<{ platform_post_id: string }> {
  const orgUrnId = account.metadata?.linkedin_org_urn as string | undefined;
  if (!orgUrnId) {
    throw new Error(
      "linkedin_org_urn ausente no metadata da conta. Reconecte a conta do LinkedIn para popular este campo."
    );
  }

  const token = account.access_token;
  const authorUrn = `urn:li:organization:${orgUrnId}`;
  const fullCaption = buildCaption(post.caption, post.hashtags);
  const mediaUrl = post.media_urls?.[0];

  const linkedInHeaders = {
    Authorization: `Bearer ${token}`,
    "Linkedin-Version": "202503",
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  let imageUrn: string | undefined;

  if (mediaUrl) {
    // Step 1: Initialize upload
    const initRes = await fetch(
      "https://api.linkedin.com/rest/images?action=initializeUpload",
      {
        method: "POST",
        headers: linkedInHeaders,
        body: JSON.stringify({
          initializeUploadRequest: { owner: authorUrn },
        }),
      }
    );

    const initData = await initRes.json();
    if (!initRes.ok || initData.status) {
      throw new Error(
        `LinkedIn initializeUpload error: ${initData.message ?? JSON.stringify(initData)}`
      );
    }

    const uploadUrl = initData.value?.uploadUrl as string | undefined;
    const rawImageUrn = initData.value?.image as string | undefined;

    if (!uploadUrl || !rawImageUrn) {
      throw new Error("LinkedIn não retornou uploadUrl ou image URN.");
    }

    // Step 2: Upload image binary
    const imageRes = await fetch(mediaUrl);
    if (!imageRes.ok) {
      throw new Error(`Falha ao buscar imagem de ${mediaUrl}: ${imageRes.status}`);
    }
    const imageBuffer = await imageRes.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          imageRes.headers.get("content-type") ?? "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(
        `LinkedIn image upload falhou: ${uploadRes.status} — ${errText}`
      );
    }

    // rawImageUrn looks like "urn:li:image:C5500AQF..." — extract the image ID
    // The API expects "urn:li:image:{id}" so we use rawImageUrn directly
    imageUrn = rawImageUrn;
  }

  // Step 3: Create post
  // deno-lint-ignore no-explicit-any
  const postBody: Record<string, any> = {
    author: authorUrn,
    commentary: fullCaption,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    postBody.content = {
      media: {
        id: imageUrn,
      },
    };
  }

  const postRes = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedInHeaders,
    body: JSON.stringify(postBody),
  });

  // LinkedIn returns 201 with no body on success; the post ID is in the header
  if (postRes.status === 201 || postRes.ok) {
    const locationHeader = postRes.headers.get("x-restli-id") ?? postRes.headers.get("location") ?? "";
    // Extract ID from location header (e.g. "urn:li:share:123456789")
    const platformPostId =
      locationHeader || `linkedin-post-${Date.now()}`;
    return { platform_post_id: platformPostId };
  }

  const errData = await postRes.json().catch(() => ({}));
  throw new Error(
    `LinkedIn post error ${postRes.status}: ${
      // deno-lint-ignore no-explicit-any
      (errData as any).message ?? JSON.stringify(errData)
    }`
  );
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'social-publish');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsHeaders = withCorrelationHeader(ctx, getCorsHeaders(req));
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- 1. Validate JWT via user client ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // Service client for all DB writes
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // --- 2. Parse request body ---
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    let body: { social_post_id: string; org_id: string };
    try {
      body = parseOrThrow(SocialPublishBodySchema, raw);
    } catch (err) {
      const vr = validationErrorResponse(err, corsHeaders);
      if (vr) return vr;
      throw err;
    }

    const { social_post_id, org_id } = body;

    console.log(`[social-publish] post=${social_post_id} org=${org_id} user=${user.id}`);

    // --- 3. Verify user is member of org ---
    const { data: membership, error: memberError } = await adminClient
      .from("organization_memberships")
      .select("user_id")
      .eq("organization_id", org_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("[social-publish] membership check error:", memberError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissão de organização" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: usuário não é membro desta organização" }),
        { status: 403, headers: jsonHeaders }
      );
    }

    // --- 4. Fetch social_posts row ---
    const { data: post, error: postError } = await adminClient
      .from("social_posts")
      .select(
        "id, social_account_id, platform, caption, hashtags, media_urls, status"
      )
      .eq("id", social_post_id)
      .maybeSingle();

    if (postError) {
      console.error("[social-publish] post fetch error:", postError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar post" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (!post) {
      return new Response(
        JSON.stringify({ error: "Post não encontrado" }),
        { status: 404, headers: jsonHeaders }
      );
    }

    // --- 5. Guard: only publish draft or scheduled posts ---
    if (post.status !== "draft" && post.status !== "scheduled") {
      return new Response(
        JSON.stringify({
          error: `Post já foi publicado ou está em estado inválido (status atual: ${post.status})`,
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // --- 6. Fetch social_accounts row ---
    const { data: account, error: accountError } = await adminClient
      .from("social_accounts")
      .select("id, platform, access_token, status, metadata")
      .eq("id", post.social_account_id)
      .maybeSingle();

    if (accountError) {
      console.error("[social-publish] account fetch error:", accountError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar conta social" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Conta social não encontrada" }),
        { status: 404, headers: jsonHeaders }
      );
    }

    // --- 7. Guard: account must be connected ---
    if (account.status === "disconnected" || account.status === "expired") {
      return new Response(
        JSON.stringify({
          error: `Conta social desconectada ou com token expirado (status: ${account.status}). Reconecte a conta.`,
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // --- 8. Publish to platform ---
    let platformPostId: string;
    let publishError: string | null = null;

    try {
      let result: { platform_post_id: string };

      switch (post.platform) {
        case "instagram":
          result = await publishInstagram(account, post);
          break;
        case "facebook":
          result = await publishFacebook(account, post);
          break;
        case "linkedin":
          result = await publishLinkedIn(account, post);
          break;
        default:
          throw new Error(
            `Plataforma não suportada: ${post.platform}. Plataformas válidas: instagram, facebook, linkedin.`
          );
      }

      platformPostId = result.platform_post_id;
      console.log(
        `[social-publish] SUCCESS platform=${post.platform} post_id=${social_post_id} platform_post_id=${platformPostId}`
      );
    } catch (err) {
      publishError = err instanceof Error ? err.message : String(err);
      console.error(
        `[social-publish] FAILED platform=${post.platform} post_id=${social_post_id}:`,
        publishError
      );
      platformPostId = "";
    }

    // --- 9. Update social_posts status ---
    if (!publishError) {
      await adminClient
        .from("social_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_post_id: platformPostId,
        })
        .eq("id", social_post_id);
    } else {
      await adminClient
        .from("social_posts")
        .update({
          status: "failed",
          error_message: publishError,
        })
        .eq("id", social_post_id);
    }

    // --- 10. Upsert social_posting_queue ---
    await adminClient
      .from("social_posting_queue")
      .upsert(
        {
          social_post_id,
          org_id,
          status: publishError ? "failed" : "success",
          error_message: publishError ?? null,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "social_post_id" }
      );

    // --- 11. Return result ---
    if (publishError) {
      return new Response(
        JSON.stringify({ success: false, error: publishError }),
        { status: 422, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform_post_id: platformPostId,
        platform: post.platform,
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    log.error("social-publish unhandled error", { error: message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
});

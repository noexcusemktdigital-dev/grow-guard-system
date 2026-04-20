// Helper compartilhado para publicar em Facebook/Instagram via Graph API.
// Usado por social-publish-post (manual) e social-process-scheduled (worker).
const GRAPH = "https://graph.facebook.com/v21.0";

async function publishFacebook(pageId: string, token: string, caption: string, imageUrl?: string) {
  if (imageUrl) {
    const r = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message ?? `FB photo ${r.status}`);
    return j.post_id ?? j.id;
  }
  const r = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: caption, access_token: token }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? `FB feed ${r.status}`);
  return j.id;
}

async function publishInstagram(igUserId: string, token: string, caption: string, imageUrl: string) {
  const r1 = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const j1 = await r1.json();
  if (!r1.ok) throw new Error(j1?.error?.message ?? `IG container ${r1.status}`);

  const r2 = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: j1.id, access_token: token }),
  });
  const j2 = await r2.json();
  if (!r2.ok) throw new Error(j2?.error?.message ?? `IG publish ${r2.status}`);
  return j2.id;
}

export async function publishToPlatform(
  account: { platform: string; account_id: string; metadata: unknown },
  caption: string,
  imageUrl?: string,
): Promise<string> {
  const meta = (account.metadata ?? {}) as Record<string, any>;
  const token: string | undefined = meta.access_token ?? meta.page_access_token;
  if (!token) throw new Error("Token de acesso ausente na conta social");

  if (account.platform === "facebook") {
    return await publishFacebook(account.account_id, token, caption, imageUrl);
  }
  if (account.platform === "instagram") {
    if (!imageUrl) throw new Error("Instagram exige uma imagem para publicar");
    return await publishInstagram(account.account_id, token, caption, imageUrl);
  }
  throw new Error(`Plataforma não suportada: ${account.platform}`);
}

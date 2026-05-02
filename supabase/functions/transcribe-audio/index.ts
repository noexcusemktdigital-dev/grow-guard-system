// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { newRequestContext, makeLogger, withCorrelationHeader } from '../_shared/correlation.ts';

function jsonRes(data: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

// Safe base64 encoding for large ArrayBuffers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }
  return btoa(chunks.join(""));
}

Deno.serve(async (req) => {
  const ctx = newRequestContext(req, 'transcribe-audio');
  const log = makeLogger(ctx);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return jsonRes({ error: "Nenhum áudio enviado" }, 400, req);
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonRes({ error: "API key não configurada" }, 500, req);
    }

    // Use Gemini Flash with inline_data for audio transcription
    const response = await fetch(
      "https://api.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva o áudio a seguir em português brasileiro. Retorne APENAS o texto transcrito, sem formatação, sem aspas, sem explicações adicionais. Se o áudio estiver inaudível ou vazio, retorne uma string vazia.",
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: base64Audio,
                    format: "webm",
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      // Fallback: try with image_url style data URI
      const fallbackResponse = await fetch(
        "https://api.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Transcreva o áudio a seguir em português brasileiro. Retorne APENAS o texto transcrito, sem formatação, sem aspas, sem explicações adicionais. Se o áudio estiver inaudível ou vazio, retorne uma string vazia.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:audio/webm;base64,${base64Audio}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        }
      );

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error("Fallback also failed:", fallbackResponse.status, fallbackError);
        return jsonRes(
          { error: "Erro ao transcrever áudio. Tente novamente." },
          502,
          req
        );
      }

      const fallbackResult = await fallbackResponse.json();
      const fallbackText = fallbackResult.choices?.[0]?.message?.content?.trim() || "";
      return jsonRes({ text: fallbackText }, 200, req);
    }

    const result = await response.json();
    const transcription = result.choices?.[0]?.message?.content?.trim() || "";

    return jsonRes({ text: transcription }, 200, req);
  } catch (err) {
    console.error("Transcription error:", err);
    return jsonRes({ error: "Erro interno ao processar áudio" }, 500, req);
  }
});

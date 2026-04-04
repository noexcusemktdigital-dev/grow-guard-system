import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return jsonRes({ error: "Nenhum áudio enviado" }, 400);
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonRes({ error: "API key não configurada" }, 500);
    }

    // Use Gemini Flash for audio transcription (supports audio input)
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
                    format: "wav",
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
      console.error("Lovable AI error:", errorText);
      return jsonRes(
        { error: "Erro ao transcrever áudio. Tente novamente." },
        502
      );
    }

    const result = await response.json();
    const transcription =
      result.choices?.[0]?.message?.content?.trim() || "";

    return jsonRes({ text: transcription });
  } catch (err) {
    console.error("Transcription error:", err);
    return jsonRes({ error: "Erro interno ao processar áudio" }, 500);
  }
});

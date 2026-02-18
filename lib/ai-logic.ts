
import { Ingredient } from "@/hooks/use-ingredients";

export async function transcribeAudio(audioBlob: Blob) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY missing");

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.ogg");
  formData.append("model", "saaras:v3");
  formData.append("mode", "codemix");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`STT API error: ${response.status}`);
  }

  return await response.json();
}

export async function generateRecipes(text: string, format: "json" | "text" = "text", language: string = "Hindi") {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY missing");

  const systemPrompt = format === "json" 
    ? `You are an expert Indian Home Chef. The user has these ingredients/notes: ${text}.
    Task: Generate 5 distinct Indian recipes.
    Output Format: Strict JSON:
    {
      "message": "Spoken summary...",
      "recipes": [
        { "id": "1", "name": "...", "region": "Indian", "time": "30 mins", "difficulty": "Easy", "ingredients": [], "steps": [], "description": "..." }
      ]
    }`
    : `You are an expert Indian Home Chef. The user has these ingredients/notes: ${text}.
    Task: Generate 3 distinct Indian recipes. Use bold headers and bullets. Concise for chat. Respond in user's language.`;

  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sarvam-m",
      messages: [
          { role: "system", content: format === "json" ? "Output strict JSON." : "Helpful chef assistant." },
          { role: "user", content: systemPrompt }
      ],
      temperature: 0.3, 
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  if (format === "json") {
      try {
          const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleaned);
      } catch (e) {
          console.error("Failed to parse AI JSON response");
          throw new Error("Invalid AI response");
      }
  }

  return content;
}

export async function textToSpeech(text: string, language: string = "hi-IN") {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) throw new Error("SARVAM_API_KEY missing");

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [text.substring(0, 500)],
        target_language_code: language,
        speaker: "shubh",
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v3",
      }),
    });

    if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
    }

    const data = await response.json();
    return data.audios[0]; // base64
}


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

export async function generateRecipes(text: string, format: "json" | "text" = "text", language: string = "hi-IN") {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("SARVAM_API_KEY missing");

  // Map locale codes to human-readable language names for the prompt
  const languageNames: Record<string, string> = {
    "hi-IN": "Hindi",
    "en-IN": "English",
    "en-US": "English",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "bn-IN": "Bengali",
    "pa-IN": "Punjabi",
    "or-IN": "Odia",
    "ur-IN": "Urdu",
  };
  const languageName = languageNames[language] || "Hindi";

  const jsonPrompt = `You are an expert Indian Home Chef. The user has these ingredients/notes: ${text}.

  Task: Generate 5 distinct, delicious Indian recipes that primarily use the provided ingredients.

  Guidelines:
  - USE THE INGREDIENTS: Prioritize recipes that use the user's specific ingredients.
  - LANGUAGE: You MUST respond entirely in ${languageName}. All recipe names, ingredient names, step descriptions, and the message field must be written in ${languageName}. Do not use English unless the language is English.
  - AUTHENTICITY: Recipes must be tasty and realistic.
  - OUTPUT: Return ONLY a raw JSON object. No markdown, no backticks, no extra text before or after.

  Required JSON structure:
  {
    "message": "A short friendly spoken summary of what you found (1-2 sentences, in ${languageName})",
    "recipes": [
      {
        "id": "generated_1",
        "name": "Recipe Name in ${languageName}",
        "region": "Indian",
        "time": "30 mins",
        "difficulty": "Easy",
        "ingredients": ["ingredient in ${languageName}"],
        "steps": ["Step description in ${languageName}"],
        "description": "Short appetizing description in ${languageName}"
      }
    ]
  }`;

  const textPrompt = `You are an expert Indian Home Chef. The user has: ${text}.
  Generate 3 Indian recipes. Use *bold* for recipe names. Keep it concise for a chat interface. You MUST respond entirely in ${languageName}.`;

  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sarvam-m",
      messages: [
          { role: "system", content: format === "json" ? "You are a JSON-only API. Output only valid raw JSON with no markdown or extra text." : "You are a helpful chef assistant." },
          { role: "user", content: format === "json" ? jsonPrompt : textPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3500,
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
          console.error("Failed to parse AI JSON response. Raw content was:", content);
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

// Conversational chat with full message history for bot integrations.
// Unlike generateRecipes (which is stateless), this maintains context across turns.
export async function chatWithHistory(
    history: { role: "user" | "assistant"; content: string }[],
    language: string = "en-IN"
): Promise<string> {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) throw new Error("SARVAM_API_KEY missing");

    const languageNames: Record<string, string> = {
        "hi-IN": "Hindi", "en-IN": "English", "en-US": "English",
        "ta-IN": "Tamil", "te-IN": "Telugu", "kn-IN": "Kannada",
        "ml-IN": "Malayalam", "mr-IN": "Marathi", "gu-IN": "Gujarati",
        "bn-IN": "Bengali", "pa-IN": "Punjabi", "or-IN": "Odia", "ur-IN": "Urdu",
    };
    const languageName = languageNames[language] || "English";

    const systemPrompt = `You are an expert, friendly Indian Home Chef assistant on Telegram.

Your personality:
- Warm, conversational, and encouraging — like a knowledgeable friend in the kitchen.
- You remember everything discussed in this conversation.
- You give concise but complete answers suited for a chat interface.

Your capabilities:
- Suggest recipes based on available ingredients.
- Give detailed step-by-step instructions for any recipe you've mentioned.
- Answer follow-up questions like "how long does it take?", "can I substitute X?", "make it spicier".
- Adjust recipes for serving sizes, dietary restrictions, or skill level.
- Explain cooking techniques if asked.

Language rule: You MUST respond entirely in ${languageName}. Match the language the user is speaking.

CRITICAL Formatting rules for Telegram:
- NEVER use ### or ## or # for headers. Telegram does not support markdown headers.
- NEVER use --- or *** as dividers.
- Use *text* for bold (recipe names, section titles like *Ingredients:* and *Steps:*).
- Use _text_ for italic if needed.
- Use numbered lists (1. 2. 3.) for steps.
- Use a dash - for ingredient lists.
- Keep a blank line between sections for readability.
- If suggesting multiple recipes, list them with *1. Recipe Name* format and a 2-line description each. Give full details only when asked.`;

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "sarvam-m",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
            ],
            temperature: 0.4,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}


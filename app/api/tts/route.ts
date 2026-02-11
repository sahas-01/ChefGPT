
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, language = "hi-IN", speaker = "shubh" } = await req.json();

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Constraint: Sarvam API limit is 500 characters.
    // We will truncate and log a warning if text exceeds it.
    let processedText = text;
    if (processedText.length > 500) {
        console.warn("TTS Input truncated from", processedText.length, "to 500 chars");
        processedText = processedText.substring(0, 497) + "...";
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [processedText],
        target_language_code: language,
        speaker: speaker,
        // pitch, pace, loudness not supported in v3
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v3", // Reverting to v1 as v3 might be unstable or specific
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam TTS Error:", errorText);
        return NextResponse.json({ error: `Sarvam API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    // API returns { audios: ["base64string"] }
    const audioBase64 = data.audios[0];

    return NextResponse.json({ audio: audioBase64 });

  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

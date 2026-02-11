
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY mismatch" }, { status: 500 });
    }

    const sarvamFormData = new FormData();
    sarvamFormData.append("file", file);
    sarvamFormData.append("model", "saaras:v3");
    sarvamFormData.append("mode", "transcribe"); // transcribe preserves original language (e.g. Hindi/English mix)
    // We do NOT send language_code, so Sarvam auto-detects it.
    // Saaras v3 returns "language_code" in response.

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam STT Error:", errorText);
        return NextResponse.json({ error: `Sarvam API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("STT Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

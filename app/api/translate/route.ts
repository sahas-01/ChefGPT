
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { input, source_language_code, target_language_code = "en-IN" } = await req.json();

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY mismatch" }, { status: 500 });
    }

    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        input,
        source_language_code,
        target_language_code,
        model: "sarvam-translate:v1",
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Sarvam Translate Error:", errorText);
        return NextResponse.json({ error: `Sarvam API error: ${response.status} ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Translate Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

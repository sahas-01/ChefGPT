import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { generateRecipes } from "@/lib/ai-logic";

function twimlReply(message: string) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    const from = body.From as string;
    const textInput = body.Body as string;

    console.log(`WhatsApp from ${from}: "${textInput}"`);

    if (!textInput?.trim()) {
      return twimlReply("Please type your ingredients and I'll suggest recipes! 🍳");
    }

    // Detect language from script
    const hasDevanagari = /[\u0900-\u097F]/.test(textInput);
    const detectedLanguage = hasDevanagari ? "hi-IN" : "en-IN";

    const chefResponse = await generateRecipes(textInput, "text", detectedLanguage);
    return twimlReply(chefResponse);

  } catch (error: any) {
    console.error("WhatsApp Route Error:", error);
    return twimlReply("The AI Chef is busy right now. Please try again in a moment!");
  }
}

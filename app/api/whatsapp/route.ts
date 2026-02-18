
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { transcribeAudio, generateRecipes } from "@/lib/ai-logic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());
    
    // Twilio sends data as form-urlencoded
    const from = body.From as string;
    const textInput = body.Body as string;
    const mediaUrl = body.MediaUrl0 as string;
    const mediaType = body.MediaContentType0 as string;

    console.log(`WhatsApp Message from ${from}: ${textInput || "Media Attached"}`);

    let userInput = textInput;

    // Handle Voice Notes
    if (mediaUrl && mediaType?.includes("audio")) {
      console.log("Processing WhatsApp Voice Note...");
      // Download the media from Twilio
      const response = await fetch(mediaUrl);
      const audioBlob = await response.blob();
      
      const sttResult = await transcribeAudio(audioBlob);
      userInput = sttResult.transcript;
      console.log("Transcribed Voice Note:", userInput);
    }

    if (!userInput) {
       return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>I couldn't hear anything. Please try again!</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Generate response using our shared logic
    const chefResponse = await generateRecipes(userInput);

    // Send TwiML response back to Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(chefResponse);

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error: any) {
    console.error("WhatsApp Route Error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>The AI Chef is currently busy. Please try again later!</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

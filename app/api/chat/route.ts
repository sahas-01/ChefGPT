import { NextRequest, NextResponse } from "next/server";
import { generateRecipes } from "@/lib/ai-logic";

// Allow this API to be called from any origin (needed for bots and external clients)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { ingredients, cuisine, language = "Hindi" } = await req.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Ingredients must be a valid non-empty list" },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY missing" }, { status: 500, headers: corsHeaders });
    }

    const userIngredients = ingredients.map((i: any) => i.name).join(", ");
    const parsed = await generateRecipes(userIngredients, "json", language);

    return NextResponse.json(parsed, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Chat Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

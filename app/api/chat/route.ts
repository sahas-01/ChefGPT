import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ingredients, cuisine, language = "Hindi" } = await req.json();
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY missing" }, { status: 500 });
    }

    const userIngredients = ingredients.map((i: any) => i.name).join(", ");
    
    let taskInstruction = `1. Generate 5 distinct, authentic Indian recipes that can be made primarily with these ingredients. You can assume common pantry staples (oil, salt, spices, water) are available.`;
    if (cuisine) {
        taskInstruction = `1. Generate 5 authentic ${cuisine} Indian recipes using these ingredients. If the ingredients don't strictly fit, adapt them creatively to ${cuisine} style.`;
    }

    const systemPrompt = `You are an expert Indian Home Chef with decades of experience. The user has these ingredients: ${userIngredients}.
    
    Task:
    ${taskInstruction}
    
    Guidelines for Authenticity & Quality:
    - Recipes must be REAL and TESTED Indian home-style dishes. Do not invent non-existent dishes.
    - If the ingredients are unusual for Indian cooking (e.g., avocado), suggest valid fusion or modern Indian adaptations (e.g., Avocado Chaat), but acknowledge it.
    - INSTRUCTIONS: Must be step-by-step, detailed, and use Indian cooking terminology (e.g., "sauté until oil separates", "crackling spices").
    - QUANTITIES: Assume standard Indian household quantities (e.g., serving 2-3 people).
    - LANGUAGE: The response must be in ${language}. If the user asks for Hindi, use natural conversational Hindi.
    
    Output Format:
    - Provide a brief, friendly spoken summary of what you found.
    - Return strict JSON format with this structure:
    {
      "message": "Spoken summary text...",
      "recipes": [
        {
          "id": "generated_1",
          "name": "Recipe Name",
          "region": "Region/Cuisine (e.g. Punjabi, South Indian)",
          "time": "XX mins",
          "difficulty": "Easy/Medium/Hard",
          "ingredients": ["1 cup Rice", "2 tbsp Oil"], // Detailed with quantities
          "steps": ["Step 1...", "Step 2..."], // Detailed steps
          "description": "Short appetizing description"
        }
      ]
    }
    
    Do not include markdown formatting, backticks, or any other text. Just the raw JSON string.`;

    // Use correct endpoint for OpenAI-compatible chat
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sarvam-m", // Reverting to user-specified model
        messages: [
            { role: "system", content: "You are a helpful assistant found at providing accurate JSON outputs." },
            { role: "user", content: systemPrompt }
        ],
        temperature: 0.3, 
        max_tokens: 3500, // Increased to ensure 5 recipes don't get truncated
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Sarvam Chat Error:", err);
        return NextResponse.json({ error: "LLM error" }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse LLM JSON:", content);
        return NextResponse.json({ error: "Failed to parse recipe generation" }, { status: 500 });
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Chat Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

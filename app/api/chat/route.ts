import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ingredients, cuisine, language = "Hindi" } = await req.json();
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY missing" }, { status: 500 });
    }

    const userIngredients = ingredients.map((i: any) => i.name).join(", ");
    
    let taskInstruction = `1. Generate 5 distinct, delicious Indian recipes that primarily use the provided ingredients. Try to use AS MANY of the user's ingredients as possible.`;
    
    if (cuisine) {
        taskInstruction = `1. Generate 5 authentic ${cuisine} Indian recipes using these ingredients. If the ingredients don't strictly fit, adapt them creatively to ${cuisine} style.`;
    }

    const systemPrompt = `You are an expert Indian Home Chef. The user has these ingredients/notes: ${userIngredients}.
    
    Task:
    ${taskInstruction}
    
    Guidelines:
    - **USE THE INGREDIENTS**: Prioritize recipes that use the user's specific ingredients.
    - **SERVING SIZE**: Check if the user mentioned a number of people (e.g., "for 5 people"). If yes, scale quantities for that number. If not, default to 2-3 people.
    - **LABELS**: Use "Indian" as the default label. Do NOT use terms like "Homestyle", "Street Food", "South Indian", or "North Indian". Only exception is if the dish is a specific famous regional specialty (e.g. "Hyderabadi Biryani").
    - **AUTHENTICITY**: Recipes must be tasty and realistic.
    - **LANGUAGE**: Respond in the same language as the user's input ingredients/notes. If the input is in English script, respond in English. If in Devanagari/Hindi, respond in Hindi. Fallback to ${language} only if unsure.
    
    Output Format:
    - Provide a brief, friendly spoken summary.
    - Return strict JSON format:
    {
      "message": "Spoken summary text...",
      "recipes": [
        {
          "id": "generated_1",
          "name": "Recipe Name",
          "region": "Indian", 
          "time": "XX mins",
          "difficulty": "Easy/Medium/Hard",
          "ingredients": ["1 cup Rice", "2 tbsp Oil"], // Quantities adjusted for serving size
          "steps": ["Step 1...", "Step 2..."],
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

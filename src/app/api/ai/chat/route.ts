import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-7b-it:free",
        messages: messages,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || "OpenRouter API Error");
    }

    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI response" }, { status: 500 });
  }
}

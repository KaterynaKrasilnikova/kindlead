import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const body = await req.json();
    const { rawText, modelType, tone, modifier } = body;

    if (!rawText || !modelType || !tone) {
      return new Response(JSON.stringify({ error: "Missing required fields: rawText, modelType, or tone" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server missing GEMINI_API_KEY. Please verify .env.local configuration." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    let structureGuidance = "";
    if (modelType === "SBI") {
      structureGuidance = `Use the SBI (Situation-Behavior-Impact) model to structure the thoughts, but output it as a continuous, natural text fluidly flowing from situation to behavior to impact. Do NOT use bullet points or headings like "Situation:" in the text itself.`;
    } else if (modelType === "STAR") {
      structureGuidance = `Use the STAR (Situation-Task-Action-Result) model to structure the thoughts, but output it as a continuous, natural text fluidly flowing through the points. Do NOT use bullet points or headings like "Situation:" in the text itself.`;
    }

    let modifierText = modifier ? `\\nAdditional User Request (for rewriting): ${modifier}` : "";

    const prompt = `
### ROLE
You are a world-class Executive Coach and Organizational Psychologist with 20+ years of experience in Non-Violent Communication (NVC) and performance management. You specialize in transforming emotional workplace friction into constructive growth opportunities.

### OBJECTIVE
Your goal is to rewrite "raw" feedback from a manager into a structured, objective, and empowering message.

### INPUT DATA
- Raw Text: "${rawText}"
- Requested Tone: ${tone}${modifierText}

${structureGuidance}

### TRANSFORMATION RULES (The "Guru" Logic)
1. **Fact Harvesting:** Strip away all judgmental adjectives (e.g., "lazy," "unprofessional," "bad"). Replace them with specific, observable behaviors.
2. **Neutrality Check:** If the raw text says "You never listen," rewrite it as "I noticed that during our last three meetings, you didn't leave space for others to finish their points."
3. **The "So What?" (Impact):** Clearly define how the behavior affects the team, the project, or the employee's own reputation.
4. **Tone Calibration:**
   - *Supportive / Підтримуючий:* Use "we" language, focus on partnership and "How can I help you improve?"
   - *Neutral / Нейтральний:* Stick to objective facts and logical consequences. Professional and calm.
   - *Directive / Директивний (Прямий):* Focus on expectations, standards, and the necessity of change. Clear and firm, but not aggressive.

### CRITICAL STYLE GUIDELINES (HUMAN, NOT CORPORATE)
- **Pronouns:** ALWAYS use the informal "you" (в українській мові звертайся до особи СУВОРО на "ТИ", ніяких "Ви" чи "Вас").
- **Language Level:** Write like a modern tech leader talking to a teammate over coffee. Do NOT use overly formal, bureaucratic, or robotic language ("канцелярит"). Use simple, clear, and empathetic words.
- **Length:** Keep sentences short and digestible.

### RESPONSE STRUCTURE (JSON ONLY)
You must return a valid JSON with these fields in the SAME LANGUAGE as the Raw Text:

{
  "emotion_score": <0-100 score of toxicity in raw text>,
  "emotion_label": "<Short description of the manager's state, e.g., 'Frustrated but caring' in raw text language>",
  "feedback_text": "<The rewritten feedback. Continuous text. No headers like 'Situation:'. Natural flow.>",
  "changes_explained": "<STRICT FORMAT: Return EXACTLY 2-3 bullet points using '•'. Each bullet must be ONE short sentence (max 15 words). Format: '• [What was removed/changed] → [Why it works better]'. Example: '• Прибрав слово «ледачий» → конкретна поведінка ефективніша за оцінку'. NO long paragraphs. NO explanations of bias theory.>",
  "tips": [
    "<Practical tip on body language or timing for this specific feedback — MUST BE IN THE SAME LANGUAGE AS THE RAW TEXT>",
    "<A follow-up question the manager should ask after delivering the text — MUST BE IN THE SAME LANGUAGE AS THE RAW TEXT>"
  ]
}
`;

    const result = await model.generateContent(prompt);
    
    // Parse the JSON text returned by Gemini
    let responseText = result.response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", responseText);
      throw new Error("Invalid format received from AI.");
    }

    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error generating feedback:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error during feedback generation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

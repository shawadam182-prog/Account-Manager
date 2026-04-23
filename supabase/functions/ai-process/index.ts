const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callGemini(prompt: string): Promise<string> {
  let lastErr = "";
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const err = await response.text();
    lastErr = `${model}: ${response.status} ${err}`;
    // Fall through to next model on 404 (model unavailable) or 429 (quota).
    // Other errors (auth, bad request) are real — surface them immediately.
    if (response.status !== 404 && response.status !== 429) break;
  }
  throw new Error(`Gemini API error: ${lastErr}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    let result;
    if (action === "extractActions") result = await extractActions(payload);
    else if (action === "processTranscript") result = await processTranscript(payload);
    else if (action === "summariseAccount") result = await summariseAccount(payload);
    else return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function extractActions({ notes, accountName, meetingType }: {
  notes: string;
  accountName: string;
  meetingType: string;
}) {
  const prompt = `You are helping an account manager at Planet Mark, a UK sustainability certification company.

Extract action items from these meeting notes. For each action, identify:
- The description (what needs to be done)
- The owner: "Millie" (the account manager), "Client" (the client company), or "Internal" (another Planet Mark team)

Account: ${accountName}
Meeting type: ${meetingType}

Notes:
${notes}

Respond with JSON only, no explanation:
{
  "actions": [
    { "description": "...", "owner": "Millie" | "Client" | "Internal" }
  ]
}

Rules:
- Only extract concrete, actionable next steps — not discussion points
- Maximum 6 actions
- If there are no clear actions, return { "actions": [] }
- Keep descriptions concise (under 15 words each)`;

  const text = await callGemini(prompt);
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { actions: [] };
  }
}

async function processTranscript({ transcript, accountName, accountContext }: {
  transcript: string;
  accountName: string;
  accountContext: string;
}) {
  const prompt = `You are an expert account manager assistant at Planet Mark, a UK sustainability certification company that helps businesses measure and reduce their carbon footprint and achieve sustainability certifications (Business Certification, Advanced, Net Zero Committed).

Process this meeting transcript for account: ${accountName}

Account context (recent history):
${accountContext || "No previous context available."}

Transcript:
${transcript}

Respond with JSON only, no explanation:
{
  "summary": "2-3 sentence plain English summary of what was discussed and what matters",
  "meetingType": "Check-in" | "Renewal" | "Strategy" | "Data Review" | "Ad hoc",
  "attendees": "comma-separated list of names mentioned (exclude Millie)",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "actions": [
    { "description": "...", "owner": "Millie" | "Client" | "Internal" }
  ],
  "risks": ["any concerns, blockers, or churn signals mentioned — leave empty array if none"],
  "opportunities": ["any upgrade opportunities, upsell signals, or expansion possibilities — leave empty array if none"],
  "suggestedNotes": "clean, structured meeting notes suitable for saving (2-4 paragraphs, no bullet points, professional but readable)"
}

Rules for actions: only concrete next steps, max 8, concise descriptions under 15 words
Rules for risks: only flag genuine concerns (unhappy client, considering leaving, payment issues, key contact leaving)
Rules for opportunities: only flag genuine signals (mentioned expanding, interested in higher tier, asked about add-ons)`;

  const text = await callGemini(prompt);
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { error: "Failed to parse AI response", raw: text };
  }
}

async function summariseAccount({ accountName, accountDetails, meetings, openActions }: {
  accountName: string;
  accountDetails: string;
  meetings: string;
  openActions: string;
}) {
  const prompt = `You are an expert account manager assistant at Planet Mark, a UK sustainability certification company.

An account manager needs a quick briefing on the current status of this account. Analyse ALL the meeting history, notes, and open actions to produce a comprehensive but concise account summary.

Account: ${accountName}

Account details:
${accountDetails}

Meeting history (chronological):
${meetings || "No meetings recorded yet."}

Open actions:
${openActions || "No open actions."}

Respond with JSON only, no explanation:
{
  "overallStatus": "A 2-3 sentence executive summary of where this account stands right now — the overall health, relationship quality, and trajectory",
  "keyHighlights": ["3-5 most important things the account manager should know about this account right now"],
  "risks": ["Any active risks, concerns, or red flags — empty array if none"],
  "opportunities": ["Any upsell, expansion, or deepening opportunities — empty array if none"],
  "relationshipHealth": "Strong" | "Good" | "Needs Attention" | "At Risk",
  "nextSteps": ["Top 3-5 recommended priority actions the account manager should focus on, based on the full history"],
  "engagementTrend": "Increasing" | "Stable" | "Declining" | "New",
  "lastContactSummary": "One sentence about what happened in the most recent interaction"
}

Rules:
- Base everything on the actual data provided — do not invent or assume
- Be direct and useful, not generic — the AM needs actionable intelligence
- If there is limited data, say so honestly rather than padding with generic advice
- Keep highlights and next steps specific to this account
- For relationshipHealth, consider meeting frequency, action follow-through, risks mentioned, and overall tone`;

  const text = await callGemini(prompt);
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { error: "Failed to parse AI response", raw: text };
  }
}

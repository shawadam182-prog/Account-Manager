import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    let result;
    if (action === "extractActions") result = await extractActions(payload);
    else if (action === "processTranscript") result = await processTranscript(payload);
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
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are helping an account manager at Planet Mark, a UK sustainability certification company.

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
- Keep descriptions concise (under 15 words each)`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
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
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `You are an expert account manager assistant at Planet Mark, a UK sustainability certification company that helps businesses measure and reduce their carbon footprint and achieve sustainability certifications (Business Certification, Advanced, Net Zero Committed).

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
Rules for opportunities: only flag genuine signals (mentioned expanding, interested in higher tier, asked about add-ons)`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { error: "Failed to parse AI response", raw: text };
  }
}

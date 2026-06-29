// app/api/copilot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const {
      scenario,
      situation,
      plan,
      answers,
      completedActions,
      pendingActions,
      timelineProgress,
      recoveryScore,
      recoveryStatus,
      emergencyMode,
      message,
    } = await req.json();

    // Determine status of early urgent phases to share with the AI agent
    const rightNowFinished = timelineProgress?.now?.every(Boolean) ?? false;
    const next10Finished = timelineProgress?.next10?.every(Boolean) ?? false;

    const prompt = `
You are NextMove, an AI emergency recovery assistant.
Your primary objective is to help the user safely recover from their emergency.

Return ONLY valid JSON matching this exact schema:
{
  "answer": string,
  "actions": string[],
  "warning": string | null
}

CURRENT RECOVERY STATUS
Current Recovery Score: ${recoveryScore ?? 0}%
Current Recovery Status: ${recoveryStatus || "Initial"}

Completed Actions:
${completedActions?.length ? completedActions.map((a: string) => `✓ ${a}`).join("\n") : "None"}

Remaining Actions:
${pendingActions?.length ? pendingActions.map((a: string) => `○ ${a}`).join("\n") : "None"}

Timeline Phase Progress:
- Completed everything scheduled for "Right Now": ${rightNowFinished ? "YES" : "NO"}
- Completed everything scheduled for "Next 10 Minutes": ${next10Finished ? "YES" : "NO"}

Recovery Rules:
- Never recommend a completed action.
- Always prioritize remaining actions.
- Whenever the user completes major milestones or tracks multiple progress boxes, acknowledge the progress warmly before detailing the next step.
- If Recovery Score is 100%, do not suggest additional emergency actions. Instead: congratulate the user, summarize what has been completed, mention any optional monitoring, and remind them to keep detailed documentation.

Emergency Mode Status: ${emergencyMode ? "ON" : "OFF"}

If Emergency Mode is ON:
- Keep responses under 120 words.
- Use clean numbered steps for actions.
- Put the absolute next action first.
- Do not explain technical reasoning unless completely necessary.
- Focus only on immediate, short-term recovery.

If Emergency Mode is OFF:
- Explain your underlying safety reasoning.
- Provide clear context and reassurance.
- Offer proactive prevention tips when appropriate.

Contextual Framework:
Scenario: ${scenario}
Initial Situation: ${situation}
Plan Metadata: ${JSON.stringify(plan?.summary || "")}
Form Answers: ${JSON.stringify(answers || {})}

User message:
${message}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Return only valid JSON matching the exact schema specified.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let raw = response.choices[0]?.message?.content || "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      console.log("RAW GROQ OUTPUT:", raw);
      parsed = JSON.parse(raw);
    } catch (error) {
      console.error("Invalid JSON:", raw);
      return NextResponse.json({ success: false, error: "Invalid response format" }, { status: 500 });
    }

    if (!parsed?.answer || !Array.isArray(parsed?.actions)) {
      return NextResponse.json({ success: false, error: "Incomplete response fields" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal processing error" }, { status: 500 });
  }
}
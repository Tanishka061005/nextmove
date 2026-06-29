import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const {
    scenario,
    situation,
    answers,
    previousPlan,
    } = await req.json();

    if (!situation) {
      return NextResponse.json(
        { error: "Situation is required" },
        { status: 400 }
      );
    }


        let userPrompt = `
    Selected Scenario:
    ${scenario || "Not Selected"}

    Situation:
    ${situation}
    `;

    if (
        previousPlan &&
        answers &&
        Object.keys(answers).length > 0
    ) {
    userPrompt += `

    The user has already received an emergency action plan.

    Original Plan:
    ${JSON.stringify(previousPlan, null, 2)}

    The user answered these follow-up questions:

    ${JSON.stringify(answers, null, 2)}

    Your task:

    You are refining an existing emergency plan.

    Do NOT regenerate the plan from scratch.

    Keep everything that is still correct.

    Only modify the sections that should change based on the user's answers.

    Keep the same JSON schema.

    Update:
    - severity (if necessary)
    - confidence
    - timeline
    - checklist
    - risks
    - important_contacts
    - follow_up_questions

    If a follow-up question has been answered, remove it unless another related clarification is still required.

    Return ONLY valid JSON.
    Keep the same JSON schema.

    Modify:
    - severity if needed
    - confidence if needed
    - risks
    - timeline
    - checklist
    - important_contacts
    - follow_up_questions

    If enough information has been collected, reduce the number of follow-up questions.
    `;
    }

    const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",

    temperature: 0.2,

    messages: [
        {
        role: "system",
        content: SYSTEM_PROMPT,
        },
        {
        role: "user",
        content: userPrompt,
        },
    ],

    response_format: {
        type: "json_object",
    },
    });

const text = response.choices[0].message.content || "";

const parsed = JSON.parse(text);

return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze situation",
      },
      { status: 500 }
    );
  }
}
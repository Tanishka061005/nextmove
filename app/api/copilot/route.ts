// app/api/copilot/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      situation,
      scenario,
      completedActions = [],
      pendingActions = [],
      recoveryScore = 0,
      recoveryStatus = "Stable",
      message = "",
      history = [],
    } = body;

    const cleanMessage = message.toLowerCase().trim();

    // =========================================================================
    // 🧠 PROGRESS-AWARE ACKNOWLEDGEMENTS (Plain text, conversational)
    // =========================================================================
    let progressContext = "";
    if (recoveryScore === 0) {
      progressContext = "We've just started stabilizing your situation. Let's work together to eliminate the absolute highest risks first.";
    } else if (recoveryScore < 40) {
      progressContext = "We are in the critical initial steps. Some areas are still exposed, but we're starting to secure the situation.";
    } else if (recoveryScore < 75) {
      progressContext = "You're making good progress. The most urgent risks have already been handled. We now need to finish the remaining security steps before you can consider this incident fully contained.";
    } else if (recoveryScore < 100) {
      progressContext = "Nice work. The situation is becoming much more manageable and under your control. We are just wrapping up secondary steps.";
    } else {
      progressContext = "Excellent. You have completed every recommended recovery step. At this point, keep your records secure and just monitor your accounts.";
    }

    // =========================================================================
    // 🎯 INTENT DETECTOR: PLAIN TEXT DETERMINISTIC ENGINES (NO MARKDOWN)
    // =========================================================================
    
    // Intent 1: Next Priority Request
    if (cleanMessage.includes("next priority") || cleanMessage.includes("next step") || cleanMessage.includes("what's next")) {
      const currentTask = pendingActions[0];
      const nextUpcomingTask = pendingActions[1] || "reviewing secondary safety steps";

      if (!currentTask) {
        return NextResponse.json({
          success: true,
          data: {
            answer: `${progressContext} There are no remaining pending items on your checklist. Continue monitoring your accounts for any unusual activity.`,
            actions: [],
            warning: null,
          },
        });
      }

      // 4-part structure: Direct answer, Explain why, Next action, Future sight
      const nextPriorityPlainResponse = `Your next priority is to ${currentTask.toLowerCase()}.\n\nDoing this prevents any further unauthorized actions or transactions from escalating.\n\nThe next thing you should do is complete this task and mark it as checked on your list.\n\nAfter you've finished, we'll move on to ${nextUpcomingTask.toLowerCase()}.`;

      return NextResponse.json({
        success: true,
        data: {
          answer: nextPriorityPlainResponse,
          actions: [currentTask],
          warning: null,
        },
      });
    }

    // Intent 2: Safety Assessment
    if (cleanMessage.includes("am i safe") || cleanMessage.includes("is it safe")) {
      let humanSafetyResponse = "";

      if (recoveryScore < 40) {
        humanSafetyResponse = `You're not completely safe yet.\n\nThe biggest remaining risk is that tasks like "${pendingActions[0] || "initial protection"}" are still open, leaving your accounts exposed.\n\nThe next thing you should do is handle that task right away.\n\nOnce that's done, the situation becomes much safer and we can focus on secondary protection steps.`;
      } else if (recoveryScore < 75) {
        humanSafetyResponse = `You are significantly safer than when you started, but a few loose ends remain.\n\nWhile your immediate core accounts are isolated, steps like "${pendingActions[0] || "changing secondary credentials"}" are still pending.\n\nYou should clear that pending step next.\n\nAfter that, we'll finish up the remaining items to ensure total peace of mind.`;
      } else {
        humanSafetyResponse = `Yes, you are currently in a secure position.\n\n${progressContext}\n\nYou can take a deep breath because the active crisis has been fully handled.\n\nMoving forward, simply save your local report and monitor your statements over the next few days.`;
      }

      return NextResponse.json({
        success: true,
        data: {
          answer: humanSafetyResponse,
          actions: pendingActions.slice(0, 1),
          warning: null,
        },
      });
    }

    // =========================================================================
    // 🤖 CONTEXTUAL LLM ROUTER (Strictly plain-text, conversational template)
    // =========================================================================

    const systemPrompt = `You are NextMove Copilot, a calm, deeply reassuring, and clear human advisor helping a user navigate an emergency.
Never use markdown headers (###), bold tags (**), horizontal lines (---), or bullet points. Output ONLY plain paragraphs separated by simple line breaks.

Do not use technical or robotic terms like "threat vectors", "vulnerability surface", "blast radius", "pivot", "defensive wall", "perimeter", "telemetry", "infrastructure", "current objective", "mission", "commander", or "tactical". 

You must strictly follow this exact 4-part conversational template structure for your answer:
Paragraph 1: Answer the user's question directly in a comforting, human tone.
Paragraph 2: Explain cleanly and logically why this matters or what is happening.
Paragraph 3: Give exactly one clear next action for the user to focus on.
Paragraph 4: Tell them what will happen or what we will focus on immediately afterwards.

CURRENT SITUATION PROGRESS TO WORK INTO YOUR RESPONSE:
"${progressContext}"

CRITICAL constraint: You must respond ONLY with a clean JSON object structure matching:
{
  "answer": "Your multi-line plain text response following the 4-part template.",
  "actions": ["Single immediate action text string if applicable"],
  "warning": null
}
No backticks, prefix text, or trailing syntax outside the JSON object block.`;

    const operationalTelemetryContext = `APPLICATION STATE SUMMARY:
- Scenario Type: ${scenario}
- Summary: ${situation}
- Finished Steps: ${JSON.stringify(completedActions)}
- Next Urgent Open Step: "${pendingActions[0] || "None"}"
- Upcoming Scheduled Step: "${pendingActions[1] || "None"}"
- Overall Progress: ${recoveryScore}%`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.role === "assistant" ? JSON.stringify({ answer: msg.content }) : msg.content,
      })),
      { role: "system", content: operationalTelemetryContext },
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const rawResponse = completion.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(rawResponse);

    return NextResponse.json({
      success: true,
      data: {
        answer: parsedData.answer || "I am right here with you. Let's focus on taking things one step at a time and completing the active task on your checklist.",
        actions: parsedData.actions || [],
        warning: parsedData.warning || null,
      },
    });

  } catch (error: any) {
    console.error("Copilot API Router Error:", error);
    return NextResponse.json({
      success: true,
      data: {
        answer: "I am right here with you. Let's focus on taking things one step at a time and completing the active task on your checklist.",
        actions: [],
        warning: null,
      },
    });
  }
}
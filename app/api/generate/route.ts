import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, category } = body;

    // TODO: Plug in your actual OpenAI / Anthropic LLM compilation engine here
    // For now, here is a structured mock response matching your exact UI requirements:
    const mockProtocolData = {
      scenario: category === "lost_property" ? "Lost Device Containment Protocol" : "Emergency Mitigation Plan",
      severity: "High",
      confidence: 94,
      estimated_resolution_time: "45 minutes",
      summary: `Initiating active containment countermeasures for: "${prompt}". Focus is on immediate risk isolation and asset lockdown.`,
      critical_action: {
        title: "Isolate immediate access tokens and notify emergency nodes.",
        estimated_time: "2 mins"
      },
      timeline: {
        now: [
          "Change main account passwords from a secure separate device.",
          "Revoke current active active-session tokens."
        ],
        next_10_minutes: [
          "Call carrier/bank to report fraudulent activity or device theft.",
          "Enable temporary freeze on affected assets."
        ],
        next_hour: [
          "Download offline structural backup data logs.",
          "File local protective incident report."
        ],
        today: [
          "Monitor credit profile updates.",
          "Audit linked secondary recovery accounts."
        ]
      },
      important_contacts: [
        "Emergency Hotline: 911",
        "Google Find My Device: https://www.google.com/android/find"
      ],
      risks: [
        { type: "Identity Exposure", level: 85 },
        { type: "Financial Leakage", level: 60 }
      ],
      decision_reasoning: [
        "Prioritizing asset freeze over diagnostic logs to stop live exfiltration loops."
      ],
      mistakes_to_avoid: [
        "Do not log into compromised accounts using old password combinations."
      ],
      alternative_actions: [
        "If primary contact phone is offline, resort to trusted backup email fallback channels."
      ],
      follow_up_questions: [
        "Are there any secondary connected credit devices linked to this primary account?"
      ]
    };

    return NextResponse.json(mockProtocolData);
  } catch (error) {
    console.error("Backend compilation error:", error);
    return NextResponse.json(
      { error: "Failed to compile strategic framework blueprint." },
      { status: 500 }
    );
  }
}
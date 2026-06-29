// components/CopilotChat.tsx
"use client";

import { useState } from "react";
import { jsPDF } from "jspdf"; // Ensure this import matches your project configuration

type CopilotChatProps = {
  situation: string;
  scenario: string;
  result: any;
  answers: Record<string, string>;
  completed: boolean[];
  timelineProgress?: {
    now: boolean[];
    next10: boolean[];
    nextHour: boolean[];
    today: boolean[];
  };
  recoveryScore?: number;
  recoveryStatus?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content?: string;
  answer?: string;
  actions?: string[];
  warning?: string | null;
  doneActions?: boolean[];
};

export default function CopilotChat({
  situation,
  scenario,
  result,
  answers,
  completed,
  timelineProgress = { now: [], next10: [], nextHour: [], today: [] },
  recoveryScore = 0,
  recoveryStatus = "Improving",
}: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(true);

  const toggleAction = (msgIndex: number, actionIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i !== msgIndex) return msg;
        const prevDone = msg.doneActions ?? [];
        const updated = [...prevDone];
        updated[actionIndex] = !updated[actionIndex];
        return {
          ...msg,
          doneActions: updated,
        };
      })
    );
  };

  const handleSend = async (customMessage?: string) => {
    const activeText = customMessage || input;
    if (!activeText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: activeText,
      },
    ]);

    if (!customMessage) setInput("");
    setLoading(true);

    const completedActions = result?.checklist?.filter((_: string, i: number) => completed[i]) || [];
    const pendingActions = result?.checklist?.filter((_: string, i: number) => !completed[i]) || [];

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          situation,
          scenario,
          plan: result,
          answers,
          completedActions,
          pendingActions,
          timelineProgress,
          recoveryScore,
          recoveryStatus,
          emergencyMode,
          message: activeText,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed");
      }

      const actions = data.data.actions ?? [];

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          answer: data.data.answer,
          actions,
          warning: data.data.warning,
          doneActions: actions.map(() => false),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          answer: "Something went wrong processing your emergency recovery stream.",
          actions: [],
          warning: null,
          doneActions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 16;
    const maxWidth = pageWidth - margin * 2;

    let y = 20;

    const addText = (
      text: string,
      size = 11,
      bold = false
    ) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");

      const lines = doc.splitTextToSize(text, maxWidth);

      lines.forEach((line: string) => {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = 20;
        }

        doc.text(line, margin, y);
        y += 6;
      });
    };

    const addHeaderBox = (
      title: string,
      color: [number, number, number]
    ) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(...color);
      doc.rect(margin, y - 5, maxWidth, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 3, y + 2);

      doc.setTextColor(0, 0, 0);

      y += 14;
    };

    // ==========================
    // TITLE
    // ==========================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NextMove", margin, y);

    y += 8;

    doc.setFontSize(15);
    doc.text("Emergency Response Report", margin, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      y
    );

    y += 12;

    // ==========================
    // PLAN OVERVIEW
    // ==========================
    addHeaderBox("PLAN OVERVIEW", [40, 40, 40]);
    addText(`Scenario: ${result.scenario}`);
    addText(`Severity: ${result.severity}`);
    addText(`Confidence: ${result.confidence}%`);

    if (result.confidence_reason) {
      addText(`Reason: ${result.confidence_reason}`);
    }

    addText(
      `Estimated Resolution: ${result.estimated_resolution_time}`
    );

    y += 4;

    // ==========================
    // CRITICAL ACTION
    // ==========================
    if (result.critical_action) {
      addHeaderBox("CRITICAL ACTION", [220, 53, 69]);
      addText(
        result.critical_action.title,
        13,
        true
      );

      if (result.critical_action.estimated_time) {
        addText(
          `Estimated Time: ${result.critical_action.estimated_time}`
        );
      }

      y += 2;
    }

    // ==========================
    // SUMMARY
    // ==========================
    addHeaderBox("SUMMARY", [0, 123, 255]);
    addText(result.summary);

    // ==========================
    // RISKS
    // ==========================
    addHeaderBox("RISK ASSESSMENT", [255, 140, 0]);
    result.risks
      ?.sort((a: any, b: any) => b.level - a.level)
      .forEach((risk: any) => {
        addText(`• ${risk.type} (${risk.level}%)`);
      });

    // ==========================
    // TIMELINE
    // ==========================
    addHeaderBox("ACTION TIMELINE", [0, 153, 76]);

    const sections = [
      {
        title: "🚨 RIGHT NOW",
        items: result.timeline.now,
      },
      {
        title: "⏱ NEXT 10 MINUTES",
        items: result.timeline.next_10_minutes,
      },
      {
        title: "🕐 NEXT HOUR",
        items: result.timeline.next_hour,
      },
      {
        title: "📅 TODAY",
        items: result.timeline.today,
      },
    ];

    sections.forEach((section) => {
      addText(section.title, 12, true);

      section.items?.forEach((item: string) => {
        addText(`• ${item}`);
      });

      y += 2;
    });

    // ==========================
    // CHECKLIST
    // ==========================
    addHeaderBox("ACTION CHECKLIST", [90, 90, 255]);
    result.checklist?.forEach((item: string) => {
      addText(`☐ ${item}`);
    });

    // ==========================
    // IMPORTANT CONTACTS
    // ==========================
    addHeaderBox("IMPORTANT CONTACTS", [34, 139, 34]);
    result.important_contacts?.forEach((contact: string) => {
      addText(`• ${contact}`);
    });

    // ==========================
    // USER ANSWERS
    // ==========================
    if (Object.keys(answers).length > 0) {
      addHeaderBox("USER ANSWERS", [90, 90, 90]);
      Object.entries(answers).forEach(([question, answer]) => {
        addText(question, 11, true);
        addText(answer);
        y += 2;
      });
    }

    // ==========================
    // FOOTER
    // ==========================
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }

    y += 8;
    doc.setDrawColor(200);
    doc.line(
      margin,
      y,
      pageWidth - margin,
      y
    );

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);

    doc.text(
      "Generated by NextMove AI • Emergency Decision Support System",
      margin,
      y
    );

    doc.save(
      `NextMove-${result.scenario.replace(/\s+/g, "-")}-Report.pdf`
    );
  };

  return (
    <div
      className={`rounded-2xl border p-6 shadow-md flex flex-col gap-4 transition-all duration-300 ${
        emergencyMode ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">💬 NextMove Copilot</h2>
          <p className="text-sm text-gray-500">
            Ask follow-up questions about your situation. Get step-by-step guidance.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-gray-700">{recoveryScore}% Defended</div>
          <div className="text-xs font-medium text-gray-400 font-mono uppercase">{recoveryStatus}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`rounded-xl px-3 py-1 text-sm text-white font-medium shadow-sm transition-colors ${
            emergencyMode ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {emergencyMode ? "🚨 Emergency Mode ON" : "Normal Mode"}
        </button>

        <button
          onClick={exportPDF}
          className="rounded-xl border bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          📄 Export Report PDF
        </button>
      </div>

      {/* MESSAGES CONSOLE BOX */}
      <div className="h-80 overflow-y-auto rounded-xl border bg-gray-50 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No conversation yet. Use one of the interactive suggestion chips below to start.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] rounded-xl p-3 shadow-sm text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-white border text-gray-800"
                }`}
              >
                {/* USER */}
                {message.role === "user" && message.content}

                {/* ASSISTANT */}
                {message.role === "assistant" && (
                  <div className="space-y-2">
                    {message.answer && (
                      <p className="leading-relaxed font-normal">
                        {message.answer}
                      </p>
                    )}

                    {messages.length > 0 &&
                      messages[messages.length - 1].role === "assistant" && (
                        <div className="mb-2 rounded-lg bg-white p-2 text-xs border text-gray-500">
                          ⚡ AI is guiding you step-by-step. Complete actions in order.
                        </div>
                      )}

                    {message.actions && message.actions.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {message.actions.map((action, i) => (
                          <li
                            key={i}
                            onClick={() => toggleAction(index, i)}
                            className={`cursor-pointer select-none rounded-lg px-3 py-2 border transition ${
                              message.doneActions?.[i]
                                ? "bg-green-100 line-through text-green-700 border-green-200"
                                : i === 0
                                ? "bg-red-50 border-red-300 text-red-800 font-medium"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {message.doneActions?.[i] ? "✔ " : "○ "}
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}

                    {message.warning && (
                      <div className="mt-2 rounded border border-red-400 p-2 text-xs text-red-600 bg-red-50 font-medium">
                        ⚠ {message.warning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DYNAMIC SMART SUGGESTION CHIPS */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => handleSend("What's my next priority?")}
          disabled={loading}
          className="text-xs border bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition shadow-sm disabled:opacity-50"
        >
          🎯 What's my next priority?
        </button>
        <button
          onClick={() => handleSend("Am I safe now?")}
          disabled={loading}
          className="text-xs border bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition shadow-sm disabled:opacity-50"
        >
          🛡️ Am I safe now?
        </button>
        <button
          onClick={() => handleSend("Summarize my plan status")}
          disabled={loading}
          className="text-xs border bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition shadow-sm disabled:opacity-50"
        >
          📊 Summarize my plan
        </button>
        <button
          onClick={() => handleSend("What if I can't complete the next step?")}
          disabled={loading}
          className="text-xs border bg-white hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition shadow-sm disabled:opacity-50"
        >
          ⚠️ What if I get stuck?
        </button>
      </div>

      {/* INPUT BAR */}
      <div className="mt-1 flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 text-sm rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
          disabled={loading}
        />

        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:bg-gray-800 transition font-medium disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
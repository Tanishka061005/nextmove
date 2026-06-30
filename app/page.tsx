"use client";

import { useState, useRef, useEffect } from "react";
import OnboardingScreen from "@/components/OnboardingScreen";
import ResultScreen from "@/components/ResultScreen";

type Message = {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
};

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"blueprint" | "copilot">("blueprint");

  // Onboarding parameters cache to preserve context across refinements
  const [currentSituation, setCurrentSituation] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [timelineProgress, setTimelineProgress] = useState({
    now: [] as boolean[],
    next10: [] as boolean[],
    nextHour: [] as boolean[],
    today: [] as boolean[],
  });

  const [loadingStatus, setLoadingStatus] = useState("Analyzing incident report...");
  
  useEffect(() => {
    if (!isLoading) return;
    const stages = [
      "Analyzing emergency parameters...",
      "Consulting LLM shielding engine...",
      "Structuring timeline checkpoints...",
      "Compiling final protocol blueprint..."
    ];
    let count = 0;
    const interval = setInterval(() => {
      if (count < stages.length - 1) {
        count++;
        setLoadingStatus(stages[count]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (activeTab === "copilot") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (result) {
      setMessages([
        {
          id: "welcome",
          sender: "copilot",
          text: `🎯 Active protocol compiled. Ready to assist you in managing this incident. Let me know if you need specific instructions or alternate backup steps.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [result]);

  // INITIAL COMPILATION PASS
  const handleGenerateProtocol = async (situation: string, category: string) => {
    setIsLoading(true);
    setCurrentSituation(situation);
    setCurrentCategory(category);
    try {
      const response = await fetch("/api/analyze", { // 👈 Points to the single unified endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scenario: category, 
          situation: situation 
        }),
      });

      if (!response.ok) throw new Error("Failed to compile initial containment data");
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("System failure generating plan. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  // REFINEMENT UPDATE PASS
  const handleRefineProtocol = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", { // 👈 Points to the SAME unified endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scenario: currentCategory,
          situation: currentSituation,
          answers: answers,          // Passes follow-up answer map
          previousPlan: result       // Passes existing state for mutation prompt injections
        }),
      });

      if (!response.ok) throw new Error("Refinement pass failed");

      const data = await response.json();
      setResult(data);
      setAnswers({}); // Clear answer fields after merge success
    } catch (error) {
      console.error(error);
      alert("Refinement pass failed. Please check inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const copilotMsg: Message = {
        id: Math.random().toString(),
        sender: "copilot",
        text: `Understood. Analyzing parameters against the running plan. Focus on your urgent timeline items while I monitor live vectors.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    }, 1000);
  };

  const handleReset = () => {
    setResult(null);
    setAnswers({});
    setMessages([]);
    setCurrentSituation("");
    setCurrentCategory("");
    setTimelineProgress({ now: [], next10: [], nextHour: [], today: [] });
    setActiveTab("blueprint");
  };

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-900 pb-28 selection:bg-blue-500/10 relative">
      <div className="max-w-md mx-auto p-4">
        
        {isLoading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
            <div className="relative flex items-center justify-center mb-6">
              <div className="h-14 w-14 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
              <span className="absolute text-xl">🛡️</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Processing Defense Vector</h3>
            <p className="text-[11px] font-mono text-blue-600 mt-1.5 min-h-[16px]">{loadingStatus}</p>
          </div>
        )}

        {!result ? (
          <OnboardingScreen onSubmit={handleGenerateProtocol} isLoading={isLoading} />
        ) : (
          <div className="space-y-4">
            
            {activeTab === "blueprint" && (
              <div className="animate-in fade-in duration-200">
                <ResultScreen
                  result={result}
                  answers={answers}
                  setAnswers={setAnswers}
                  onRefine={handleRefineProtocol}
                  onReset={handleReset}
                  isRefined={false}
                  previousConfidence={null}
                  completed={[]} 
                  setCompleted={() => {}} 
                  timelineProgress={timelineProgress}
                  setTimelineProgress={setTimelineProgress}
                />
              </div>
            )}

            {activeTab === "copilot" && (
              <div className="animate-in fade-in duration-150 flex flex-col h-[78vh] bg-white border border-gray-100 rounded-2xl p-4 shadow-xs relative">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">🛡️ Live AI Copilot</h2>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 pb-20 text-xs">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] p-3.5 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user" ? "ml-auto bg-blue-600 text-white rounded-br-none" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="absolute bottom-3 left-3 right-3 bg-gray-50 border border-gray-200 p-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs focus-within:bg-white transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask how to handle counter-risks..."
                    className="flex-1 text-xs px-2.5 py-1.5 bg-transparent focus:outline-none"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="bg-gray-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium">Send</button>
                </form>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-md px-8 py-3.5 z-50 shadow-lg">
              <div className="max-w-md mx-auto flex justify-between items-center px-6">
                <button onClick={() => setActiveTab("blueprint")} className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === "blueprint" ? "text-blue-600 font-bold" : "text-gray-400"}`}>
                  <span className="text-lg">🎯</span>
                  <span>Action Plan</span>
                </button>
                <button onClick={() => setActiveTab("copilot")} className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === "copilot" ? "text-blue-600 font-bold" : "text-gray-400"}`}>
                  <span className="text-lg relative">💬</span>
                  <span>Copilot Chat</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
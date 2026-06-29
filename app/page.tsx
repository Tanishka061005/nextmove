"use client";

import { useState, useRef, useEffect } from "react";
import ResultScreen from "@/components/ResultScreen";
import LoadingScreen from "@/components/LoadingScreen";
import CopilotChat from "@/components/CopilotChat";

export default function Home() {
  const [situation, setSituation] = useState("");
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isRefined, setIsRefined] = useState(false); 
  const [previousConfidence, setPreviousConfidence] = useState<number | null>(null);
  
  // Track master checklist progress cleanly at root level for Copilot alignment
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [checklistProgress, setChecklistProgress] = useState<{
    now: boolean[];
    next10: boolean[];
    nextHour: boolean[];
    today: boolean[];
  }>({ now: [], next10: [], nextHour: [], today: [] });

  const resultRef = useRef<HTMLDivElement>(null);

  // Reset checklist tracking states when a brand new plan is loaded
  useEffect(() => {
    if (result) {
      setCompleted(result.checklist?.map(() => false) || []);
      setChecklistProgress({
        now: result.timeline?.now?.map(() => false) || [],
        next10: result.timeline?.next_10_minutes?.map(() => false) || [],
        nextHour: result.timeline?.next_hour?.map(() => false) || [],
        today: result.timeline?.today?.map(() => false) || [],
      });
    }
  }, [result]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setResult(null);
      setIsRefined(false);
      setAnswers({});
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario,
          situation,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    try {
      setLoading(true);
      setPreviousConfidence(result.confidence);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario,
          situation,
          answers,
          previousPlan: result,
        }),
      });

      const updatedPlan = await response.json();

      if (!response.ok) {
        throw new Error(updatedPlan.error || "Failed to refine plan");
      }

      setResult(updatedPlan);

      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setIsRefined(true);
      setAnswers({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      emoji: "📱",
      label: "Phone Lost",
      value: "Phone Lost or Stolen",
    },
    {
      emoji: "💳",
      label: "Scam / Fraud",
      value: "Online Scam or Fraud",
    },
    {
      emoji: "📄",
      label: "Lost Documents",
      value: "Lost Important Documents",
    },
    {
      emoji: "✈️",
      label: "Missed Flight",
      value: "Missed Flight or Train",
    },
    {
      emoji: "🔒",
      label: "Cyber Breach",
      value: "Cybersecurity Breach",
    },
    {
      emoji: "🚗",
      label: "Vehicle Breakdown",
      value: "Car or Bike Breakdown",
    },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6">
      {loading && <LoadingScreen />}

      <h1 className="text-4xl font-bold mb-2">NextMove</h1>
      <p className="text-gray-500 mb-6">When every minute matters, know your next move.</p>

      <div className="mb-6">
        <h2 className="font-semibold mb-3">Select a Scenario</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {scenarios.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setScenario(item.value)}
              className={`border rounded-xl p-4 text-left transition ${
                scenario === item.value ? "border-black bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="font-medium">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="border rounded-xl p-4 w-full"
        rows={6}
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder="Describe your situation..."
      />

      <button
        className="bg-black text-white px-6 py-3 rounded-xl mt-4"
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? "Working..." : "Analyze Situation"}
      </button>

      {!loading && result && (
        <div ref={resultRef}>
          <ResultScreen
            result={result}
            answers={answers}
            setAnswers={setAnswers}
            onRefine={handleRefine}
            isRefined={isRefined}
            previousConfidence={previousConfidence}
            completed={completed}
            setCompleted={setCompleted}
            timelineProgress={checklistProgress}
            setTimelineProgress={setChecklistProgress}
          />
        </div>
      )}

      {!loading && result && (
        <div className="mt-8">
          <CopilotChat
            situation={situation}
            scenario={scenario}
            result={result}
            answers={answers}
            completed={completed}
            timelineProgress={checklistProgress}
          />
        </div>
      )}
    </main>
  );
}
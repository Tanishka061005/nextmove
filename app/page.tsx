"use client";

import { useState } from "react";
import OnboardingScreen from "@/components/OnboardingScreen";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [currentSituation, setCurrentSituation] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");

  const [timelineProgress, setTimelineProgress] = useState({
    now: [] as boolean[],
    next10: [] as boolean[],
    nextHour: [] as boolean[],
    today: [] as boolean[],
  });

  const handleGenerateProtocol = async (situation: string, category: string) => {
    setIsLoading(true);
    setCurrentSituation(situation);
    setCurrentCategory(category);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: category, situation }),
      });

      if (!response.ok) throw new Error("Failed to compile protocol data");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineProtocol = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scenario: currentCategory,
          situation: currentSituation,
          answers,
          previousPlan: result 
        }),
      });

      if (!response.ok) throw new Error("Refinement failed");
      const data = await response.json();
      setResult(data);
      setAnswers({}); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAnswers({});
    setCurrentSituation("");
    setCurrentCategory("");
    setTimelineProgress({ now: [], next10: [], nextHour: [], today: [] });
  };

  return (
    <main className="min-h-screen bg-[#FDFBF9] text-gray-900 pb-12 selection:bg-orange-500/10">
      <div className="max-w-md mx-auto p-4">
        
        {isLoading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-10 w-10 rounded-full border-2 border-orange-100 border-t-orange-500 animate-spin mb-4" />
            <p className="text-xs font-medium text-gray-500">Recalibrating security parameters...</p>
          </div>
        )}

        {!result ? (
          <OnboardingScreen onSubmit={handleGenerateProtocol} isLoading={isLoading} />
        ) : (
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
        )}
      </div>
    </main>
  );
}
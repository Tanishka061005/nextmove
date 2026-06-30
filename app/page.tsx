"use client";

import { useState } from "react";
import OnboardingScreen from "@/components/OnboardingScreen";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Track timeline checkmarks safely across sessions
  const [timelineProgress, setTimelineProgress] = useState({
    now: [] as boolean[],
    next10: [] as boolean[],
    nextHour: [] as boolean[],
    today: [] as boolean[],
  });

  // Handle core API call using data payload from Onboarding Screen
  const handleGenerateProtocol = async (situation: string, category: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: situation, category }),
      });

      if (!response.ok) throw new Error("Failed to compile target containment data");
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Critical configuration failure:", error);
      alert("Something went wrong compiling your blueprint. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers if a user submits refinement questions inside the Result Screen
  const handleRefineProtocol = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentResult: result, userAnswers: answers }),
      });

      if (!response.ok) throw new Error("Refinement pass failed");

      const data = await response.json();
      setResult(data);
      setAnswers({}); // Flush answers input states after integration
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 text-gray-900 selection:bg-blue-500/10">
      <div className="max-w-4xl mx-auto cp-6 md:p-10">
        
        {!result ? (
          /* STEP 1: CONVERSATIONAL ONBOARDING FLOW */
          <OnboardingScreen 
            onSubmit={handleGenerateProtocol} 
            isLoading={isLoading} 
          />
        ) : (
          /* STEP 2: DYNAMIC RESOLUTION RUNTIME SYSTEM */
          <ResultScreen
            result={result}
            answers={answers}
            setAnswers={setAnswers}
            onRefine={handleRefineProtocol}
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
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type OnboardingScreenProps = {
  onSubmit: (situation: string, category: string) => void;
  isLoading: boolean;
};

type CategoryKey = "lost_property" | "travel" | "fraud" | "health" | "legal" | "other";

interface CategoryConfig {
  label: string;
  icon: string;
  placeholder: string;
  subPrompt: string;
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  lost_property: {
    label: "I lost something",
    icon: "📍",
    placeholder: "e.g., iPhone 15 Pro, black case, lost near transit station 20 mins ago...",
    subPrompt: "What did you lose, and where or when was it last seen?",
  },
  travel: {
    label: "Travel issue",
    icon: "✈️",
    placeholder: "e.g., Flight AA123 delayed by 5 hours, missing connection to Paris...",
    subPrompt: "What is your flight/train info or current travel disruption details?",
  },
  fraud: {
    label: "Financial fraud",
    icon: "💳",
    placeholder: "e.g., Unauthorized charges on Visa card totaling $450 from an unknown vendor...",
    subPrompt: "Which card or account was affected, and have you frozen it yet?",
  },
  health: {
    label: "Health / Medical",
    icon: "🩺",
    placeholder: "e.g., Sprained ankle hiking, cannot put weight on it, miles from main road...",
    subPrompt: "Briefly detail the symptoms or injury context so we can prioritize protection.",
  },
  legal: {
    label: "Legal emergency",
    icon: "⚖️",
    placeholder: "e.g., Received an immediate eviction notice, landlord locked gate...",
    subPrompt: "What urgent document, event, or dispute occurred?",
  },
  other: {
    label: "Something else",
    icon: "🛡️",
    placeholder: "Describe what is happening as simply as you can...",
    subPrompt: "Tell us exactly what went wrong so we can construct a response path.",
  },
};

export default function OnboardingScreen({ onSubmit, isLoading }: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [description, setDescription] = useState("");

  const handleCategorySelect = (key: CategoryKey) => {
    setSelectedCategory(key);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !selectedCategory) return;
    
    // Package it up elegantly for the core generator API
    const contextString = `[Category: ${CATEGORIES[selectedCategory].label}] Details: ${description}`;
    onSubmit(contextString, selectedCategory);
  };

  return (
    <div className="max-w-md mx-auto min-h-[70vh] flex flex-col justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">What's happening?</h1>
              <p className="text-xs text-gray-400">Tap the category that fits your situation best.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
                const cat = CATEGORIES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategorySelect(key)}
                    className="flex items-center gap-4 w-full p-4 text-left rounded-2xl border border-gray-100 bg-white hover:border-blue-300 hover:bg-blue-50/10 active:scale-[0.99] transition shadow-2xs group"
                  >
                    <span className="text-xl bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition">
                      {cat.icon}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm p-1 rounded bg-gray-100">
                  {selectedCategory && CATEGORIES[selectedCategory].icon}
                </span>
                <h2 className="text-base font-bold text-gray-900">
                  {selectedCategory && CATEGORIES[selectedCategory].label}
                </h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {selectedCategory && CATEGORIES[selectedCategory].subPrompt}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  rows={4}
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={selectedCategory ? CATEGORIES[selectedCategory].placeholder : ""}
                  className="w-full text-xs border border-gray-200 bg-white rounded-xl p-4.5 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-2xs resize-none placeholder:text-gray-300 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!description.trim() || isLoading}
                className="w-full flex items-center justify-center rounded-xl bg-blue-600 py-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-xs gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Building Defensive Protocol...
                  </>
                ) : (
                  "Generate Containment Blueprint"
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
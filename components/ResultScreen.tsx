"use client";

import { exportEmergencyReport } from "@/lib/exportEmergencyReport";
import StickyCriticalAction from "@/components/StickyCriticalAction";
import { useEffect, useState } from "react";
import EmergencyProgress from "./EmergencyProgress";
import RecoveryMilestone from "./RecoveryMilestone";
import SituationUpdates from "@/components/SituationUpdates";
import DecisionReasoning from "@/components/DecisionReasoning";
import AlternativeActions from "@/components/AlternativeActions";
import MistakesToAvoid from "@/components/MistakesToAvoid";
import AnimatedCard from "@/components/AnimatedCard";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type ResultScreenProps = {
  result: any;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRefine: () => void;
  isRefined: boolean;
  previousConfidence: number | null;
  completed: boolean[];
  setCompleted: React.Dispatch<React.SetStateAction<boolean[]>>;
  timelineProgress: {
    now: boolean[];
    next10: boolean[];
    nextHour: boolean[];
    today: boolean[];
  };
  setTimelineProgress: React.Dispatch<React.SetStateAction<{
    now: boolean[];
    next10: boolean[];
    nextHour: boolean[];
    today: boolean[];
  }>>;
};

export default function ResultScreen({
  result,
  answers,
  setAnswers,
  onRefine,
  isRefined,
  previousConfidence,
  completed,
  setCompleted,
  timelineProgress,
  setTimelineProgress,
}: ResultScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [hourSecondsLeft, setHourSecondsLeft] = useState(3600); // 60 minutes

  useEffect(() => {
    if (result?.timeline) {
      setTimelineProgress((prev) => ({
        now: prev.now?.length === result.timeline.now?.length ? prev.now : new Array(result.timeline.now?.length || 0).fill(false),
        next10: prev.next10?.length === result.timeline.next_10_minutes?.length ? prev.next10 : new Array(result.timeline.next_10_minutes?.length || 0).fill(false),
        nextHour: prev.nextHour?.length === result.timeline.next_hour?.length ? prev.nextHour : new Array(result.timeline.next_hour?.length || 0).fill(false),
        today: prev.today?.length === result.timeline.today?.length ? prev.today : new Array(result.timeline.today?.length || 0).fill(false),
      }));
    }
  }, [result, setTimelineProgress]);

  // Compute milestones safely (if an AI section is empty, consider it automatically complete so it doesn't block progression)
  const hasNow = result?.timeline?.now?.length > 0;
  const nowComplete = !hasNow || (timelineProgress.now.length > 0 && timelineProgress.now.every(Boolean));

  const hasNext10 = result?.timeline?.next_10_minutes?.length > 0;
  const next10Complete = !hasNext10 || (timelineProgress.next10.length > 0 && timelineProgress.next10.every(Boolean));

  const hasNextHour = result?.timeline?.next_hour?.length > 0;
  const nextHourComplete = !hasNextHour || (timelineProgress.nextHour.length > 0 && timelineProgress.nextHour.every(Boolean));

  const hasToday = result?.timeline?.today?.length > 0;
  const todayComplete = !hasToday || (timelineProgress.today.length > 0 && timelineProgress.today.every(Boolean));

  // 10-Minute Timer logic
  useEffect(() => {
    if (next10Complete) return; // Freeze timer if completed

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [next10Complete]);

  // 1-Hour Timer logic (Starts only when next10 is complete)
  useEffect(() => {
    if (!next10Complete || nextHourComplete) return; // Don't start until unlocked, freeze when done

    const interval = setInterval(() => {
      setHourSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [next10Complete, nextHourComplete]);

  if (!result) return null;

  const sortedRisks = [...(result.risks || [])].sort((a, b) => b.level - a.level);

  const totalTimelineItems =
    (result.timeline?.now?.length || 0) +
    (result.timeline?.next_10_minutes?.length || 0) +
    (result.timeline?.next_hour?.length || 0) +
    (result.timeline?.today?.length || 0);

  const completedTimelineItems = [
    ...(timelineProgress?.now || []),
    ...(timelineProgress?.next10 || []),
    ...(timelineProgress?.nextHour || []),
    ...(timelineProgress?.today || []),
  ].filter(Boolean).length;

  const remainingActionsCount = totalTimelineItems - completedTimelineItems;
  const recoveryScore = totalTimelineItems === 0 ? 0 : Math.round((completedTimelineItems / totalTimelineItems) * 100);

  let dynamicSeverity = result.severity || "High";
  let severityColor = "text-red-600 bg-red-50 border-red-100";

  if (nowComplete && next10Complete) {
    dynamicSeverity = "Controlled";
    severityColor = "text-green-600 bg-green-50 border-green-100";
  } else if (nowComplete) {
    dynamicSeverity = "Mitigating";
    severityColor = "text-orange-600 bg-orange-50 border-orange-100";
  }

  const handleToggleAction = (section: "now" | "next10" | "nextHour" | "today", index: number) => {
    setTimelineProgress((prev) => {
      const currentArray = prev[section] ? [...prev[section]] : [];
      if (index >= currentArray.length) return prev;

      const wasAlreadyChecked = currentArray[index];
      currentArray[index] = !wasAlreadyChecked;

      const updated = { ...prev, [section]: currentArray };

      const targetLength = 
        section === "now" ? result.timeline?.now?.length :
        section === "next10" ? result.timeline?.next_10_minutes?.length :
        section === "nextHour" ? result.timeline?.next_hour?.length :
        result.timeline?.today?.length;

      const isSectionNowComplete = currentArray.filter(Boolean).length === targetLength;
      const wasSectionAlreadyComplete = (prev[section] || []).filter(Boolean).length === targetLength;

      if (isSectionNowComplete && !wasSectionAlreadyComplete) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      return updated;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {result.critical_action && remainingActionsCount > 0 && (
        <StickyCriticalAction title={result.critical_action.title} estimatedTime={result.critical_action.estimated_time} severity={dynamicSeverity} />
      )}

      {/* EMERGENCY STATUS HERO DASHBOARD */}
      <AnimatedCard delay={0.05}>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Current Protocol</span>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{result.scenario}</h1>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${severityColor}`}>
              Status: {dynamicSeverity}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-gray-400 font-medium">Recovery Progress</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{recoveryScore}%</div>
            </div>
            <div>
              <div className="text-gray-400 font-medium">Remaining Tasks</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{remainingActionsCount} actions</div>
            </div>
            <div>
              <div className="text-gray-400 font-medium">Est. Resolution</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">{result.estimated_resolution_time || "Pending"}</div>
            </div>
            <div>
              <div className="text-gray-400 font-medium">Plan Confidence</div>
              <div className="text-lg font-bold text-blue-600 mt-0.5">{result.confidence}%</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500 leading-relaxed">
            {result.summary}
          </div>
        </div>
      </AnimatedCard>

      {/* EXECUTE TIMELINE BLOCK */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Execute Plan</h2>
        <div className="border border-gray-100 bg-white rounded-2xl p-5 shadow-xs flex flex-col gap-5">
          
          <TimelineSection
            title="🚨 Right Now"
            items={result.timeline?.now}
            completed={timelineProgress?.now || []}
            onToggle={(index) => handleToggleAction("now", index)}
          />
          
          <AnimatePresence>
            {nowComplete && hasNow && !next10Complete && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-3.5 text-xs flex items-center gap-2 font-medium">
                  ✅ Immediate danger isolated. Proceed smoothly below.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <TimelineSection
            title="⏱ Next 10 Minutes"
            items={result.timeline?.next_10_minutes}
            completed={timelineProgress?.next10 || []}
            locked={!nowComplete}
            countdownText={secondsLeft > 0 ? `${Math.floor(secondsLeft / 60)}:${secondsLeft % 60 < 10 ? "0" : ""}${secondsLeft % 60} left` : "0:00 overdue"}
            onToggle={(index) => handleToggleAction("next10", index)}
            isFrozen={next10Complete}
          />

          <AnimatePresence>
            {next10Complete && hasNext10 && !nextHourComplete && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-3.5 text-xs flex items-center gap-2 font-medium">
                  ✅ Situation secured. Transition to recovery steps.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TIMER ADDED HERE */}
          <TimelineSection
            title="🕐 Next Hour"
            items={result.timeline?.next_hour}
            completed={timelineProgress?.nextHour || []}
            locked={!next10Complete}
            countdownText={hourSecondsLeft > 0 ? `${Math.floor(hourSecondsLeft / 60)}:${hourSecondsLeft % 60 < 10 ? "0" : ""}${hourSecondsLeft % 60} left` : "0:00 overdue"}
            onToggle={(index) => handleToggleAction("nextHour", index)}
            isFrozen={nextHourComplete}
          />

          <AnimatePresence>
            {nextHourComplete && hasNextHour && !todayComplete && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-3.5 text-xs flex items-center gap-2 font-medium">
                  ✅ Great work. Just a few administrative tasks left today.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <TimelineSection
            title="📅 Today"
            items={result.timeline?.today}
            completed={timelineProgress?.today || []}
            locked={!nextHourComplete}
            onToggle={(index) => handleToggleAction("today", index)}
          />
        </div>
      </div>

      {/* ACTIONS & EMERGENCY HOTLINES */}
      {result.important_contacts?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Actionable Links & Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.important_contacts.map((contact: string, index: number) => {
              const parts = contact.split(/[:\-]/);
              const label = parts[0]?.trim() || "Helpline";
              const targetValue = parts.slice(1).join(":")?.trim() || "";
              const isWebPortal = /www\.|http|\.gov|\.in|\.com/i.test(targetValue);

              return (
                <div key={index} className="flex items-center justify-between border border-gray-100 bg-white rounded-xl p-3.5 shadow-xs">
                  <div className="pr-2 truncate">
                    <div className="text-xs font-medium text-gray-800 flex items-center gap-1">📞 {label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{targetValue}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWebPortal ? (
                      <a href={targetValue.startsWith("http") ? targetValue : `https://${targetValue}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50 transition shadow-2xs">Open Link</a>
                    ) : (
                      <a href={`tel:${targetValue.replace(/\s+/g, "")}`} className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50 transition shadow-2xs">Call</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SituationUpdates updates={result.situation_updates} />

      {/* METRICS TRACKER PANELS */}
      <div className="space-y-6 pt-2 border-t border-gray-100">
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recovery Metrics</h2>
          <EmergencyProgress completed={completedTimelineItems} total={totalTimelineItems} progress={recoveryScore} />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Threat Risk Analysis</h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-3.5">
            {sortedRisks.map((risk: any, index: number) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span className={index === 0 ? "font-medium text-gray-900" : ""}>{index === 0 ? "⚠️ " : ""}{risk.type}</span>
                  <span className="text-gray-400 font-mono text-[11px]">{risk.level}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-50">
                  <div className={`h-1 rounded-full transition-all duration-300 ${index === 0 ? "bg-amber-500" : "bg-amber-400/50"}`} style={{ width: `${risk.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACCORDION MATRIX BLOCKS */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Context & Diagnostics</h2>
        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>🧠 Strategy Logic Matrix</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/10 text-xs text-gray-600">
            <DecisionReasoning reasoning={result.decision_reasoning} />
          </div>
        </details>
        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>❌ Critical Actions to Avoid</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/10 text-xs text-gray-600">
            <MistakesToAvoid mistakes={result.mistakes_to_avoid} />
          </div>
        </details>
        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>🔄 Contingency Paths</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/10 text-xs text-gray-600">
            <AlternativeActions actions={result.alternative_actions} />
          </div>
        </details>
      </div>

      {/* REFINEMENT FOOTER */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        {result.follow_up_questions?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Refine Analysis</h2>
            <div className="space-y-2">
              {result.follow_up_questions.map((question: string, index: number) => (
                <div key={index} className="border border-blue-50 rounded-xl p-3 bg-blue-50/10">
                  <p className="text-xs font-medium text-gray-700 mb-2">❓ {question}</p>
                  <input
                    type="text"
                    placeholder="Provide additional details..."
                    value={answers[question] || ""}
                    onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                    className="w-full text-xs border bg-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-2xs"
                  />
                </div>
              ))}
            </div>
            <button onClick={onRefine} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-medium text-white hover:bg-blue-700 shadow-xs transition">
              Update Strategic Protocol
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-medium text-gray-900">📄 Local Defensive Report</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Persist report locally for completely offline access.</p>
          </div>
          <button onClick={() => exportEmergencyReport(result, answers)} className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-gray-800 transition shadow-xs">
            Save Offline
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineSection({
  title,
  items = [],
  completed,
  onToggle,
  locked = false,
  countdownText,
  isFrozen,
}: {
  title: string;
  items: string[];
  completed: boolean[];
  onToggle: (index: number) => void;
  locked?: boolean;
  countdownText?: string;
  isFrozen?: boolean;
}) {
  const styles: Record<string, { header: string; activeCard: string; baseCard: string }> = {
    "🚨 Right Now": { header: "text-red-700 bg-red-50", activeCard: "border-green-200 bg-green-50/10 text-gray-400 line-through font-normal", baseCard: "border-gray-100 bg-white text-gray-700 font-medium hover:border-gray-300 shadow-2xs" },
    "⏱ Next 10 Minutes": { header: "text-orange-700 bg-orange-50", activeCard: "border-green-200 bg-green-50/10 text-gray-400 line-through font-normal", baseCard: "border-gray-100 bg-white text-gray-700 font-medium hover:border-gray-300 shadow-2xs" },
    "🕐 Next Hour": { header: "text-amber-700 bg-amber-50", activeCard: "border-green-200 bg-green-50/10 text-gray-400 line-through font-normal", baseCard: "border-gray-100 bg-white text-gray-700 font-medium hover:border-gray-300 shadow-2xs" },
    "📅 Today": { header: "text-green-700 bg-green-50", activeCard: "border-green-200 bg-green-50/10 text-gray-400 line-through font-normal", baseCard: "border-gray-100 bg-white text-gray-700 font-medium hover:border-gray-300 shadow-2xs" },
  };
  const style = styles[title] || styles["📅 Today"];

  if (locked) {
    return (
      <div className="opacity-40 select-none transition-opacity pointer-events-none">
        <div className="flex justify-between items-center mb-2">
          <div className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100">🔒 {title}</div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 opacity-60">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs text-gray-400">
                <div className="w-4 h-4 rounded border border-gray-200 bg-gray-100" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs text-gray-400 italic">
              No actions generated for this timeframe.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.header}`}>
          {title}
        </div>
        {countdownText && (
          <div className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm transition-colors ${isFrozen ? "text-green-700 bg-green-50" : "text-orange-600 bg-orange-50"}`}>
            {isFrozen ? "✅ Done" : `⏳ ${countdownText}`}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {items.length > 0 ? (
          items.map((item, index) => {
            const isChecked = !!completed[index];
            return (
              <label key={index} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition text-xs ${isChecked ? style.activeCard : style.baseCard}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(index)}
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="leading-relaxed">{item}</span>
              </label>
            );
          })
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs text-gray-400 italic">
            No specific actions required right now.
          </div>
        )}
      </div>
    </div>
  );
}
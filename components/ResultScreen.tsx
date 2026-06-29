"use client";

import { exportEmergencyReport } from "@/lib/exportEmergencyReport";
import StickyCriticalAction from "@/components/StickyCriticalAction";
import { useEffect, useRef } from "react";
import EmergencyProgress from "./EmergencyProgress";
import RecoveryMilestone from "./RecoveryMilestone";
import SituationUpdates from "@/components/SituationUpdates";
import DecisionReasoning from "@/components/DecisionReasoning";
import AlternativeActions from "@/components/AlternativeActions";
import MistakesToAvoid from "@/components/MistakesToAvoid";
import AnimatedCard from "@/components/AnimatedCard";
import { motion } from "framer-motion";
// @ts-ignore
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
  if (!result) return null;

  const confettiFired = useRef({
    now: false,
    next10: false,
    nextHour: false,
    today: false,
  });

  const sortedRisks = [...(result.risks || [])].sort((a, b) => b.level - a.level);

  const totalTimelineItems =
    (timelineProgress?.now?.length || 0) +
    (timelineProgress?.next10?.length || 0) +
    (timelineProgress?.nextHour?.length || 0) +
    (timelineProgress?.today?.length || 0);

  const completedTimelineItems = [
    ...(timelineProgress?.now || []),
    ...(timelineProgress?.next10 || []),
    ...(timelineProgress?.nextHour || []),
    ...(timelineProgress?.today || []),
  ].filter(Boolean).length;

  const recoveryScore =
    totalTimelineItems === 0 ? 0 : Math.round((completedTimelineItems / totalTimelineItems) * 100);

  const recoveryStatus =
    recoveryScore === 100
      ? "Recovered"
      : recoveryScore >= 75
      ? "Almost Safe"
      : recoveryScore >= 40
      ? "Improving"
      : "Critical";

  const recoveryStyle =
    recoveryScore === 100
      ? "bg-green-100 text-green-700"
      : recoveryScore >= 75
      ? "bg-emerald-100 text-emerald-700"
      : recoveryScore >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  const nowComplete = timelineProgress?.now?.length > 0 && timelineProgress.now.every(Boolean);
  const next10Complete = timelineProgress?.next10?.length > 0 && timelineProgress.next10.every(Boolean);
  const nextHourComplete = timelineProgress?.nextHour?.length > 0 && timelineProgress.nextHour.every(Boolean);
  const todayComplete = timelineProgress?.today?.length > 0 && timelineProgress.today.every(Boolean);

  const fireConfetti = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
  };

  useEffect(() => {
    if (nowComplete && !confettiFired.current.now) {
      fireConfetti();
      confettiFired.current.now = true;
    } else if (!nowComplete) {
      confettiFired.current.now = false;
    }
  }, [nowComplete]);

  useEffect(() => {
    if (next10Complete && !confettiFired.current.next10) {
      fireConfetti();
      confettiFired.current.next10 = true;
    } else if (!next10Complete) {
      confettiFired.current.next10 = false;
    }
  }, [next10Complete]);

  useEffect(() => {
    if (nextHourComplete && !confettiFired.current.nextHour) {
      fireConfetti();
      confettiFired.current.nextHour = true;
    } else if (!nextHourComplete) {
      confettiFired.current.nextHour = false;
    }
  }, [nextHourComplete]);

  useEffect(() => {
    if (todayComplete && !confettiFired.current.today) {
      fireConfetti();
      confettiFired.current.today = true;
    } else if (!todayComplete) {
      confettiFired.current.today = false;
    }
  }, [todayComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-6 space-y-8"
    >
      {result.critical_action && (
        <StickyCriticalAction
          title={result.critical_action.title}
          estimatedTime={result.critical_action.estimated_time}
          severity={result.severity}
        />
      )}

      {/* 1. HERO - Dynamic Mission Control */}
      <AnimatedCard delay={0.1}>
        <div id="mission-control" className="rounded-2xl border bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 mb-5">
            <span className={`rounded-full px-4 py-2 text-xs font-semibold ${
              result.severity === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
            }`}>
              🚨 {result.severity} Severity
            </span>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700">
              🎯 {result.confidence}% Confidence
            </span>
            <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-700">
              ⏱ {result.estimated_resolution_time}
            </span>
            <span className={`rounded-full px-4 py-2 text-xs font-semibold ${recoveryStyle}`}>
              🩺 {recoveryStatus}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{result.scenario}</h1>
          <p className="mt-3 text-gray-600 leading-relaxed text-sm md:text-base">{result.summary}</p>

          <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-800">
              {recoveryScore >= 75
                ? "✅ Most immediate risks have been addressed."
                : recoveryScore >= 40
                ? "⚠ You're making good progress. Continue following the recovery plan."
                : "🚨 Immediate action is still required to reduce risk."}
            </p>
          </div>

          {result.confidence_reason && (
            <div className="mt-4 rounded-lg bg-white/60 border p-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">Assessment Logic:</span> {result.confidence_reason}
              </p>
            </div>
          )}

          {recoveryScore < 75 && result.urgency_message && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700">⚠ {result.urgency_message}</p>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* 2. Progress Tracker & Milestones */}
      <AnimatedCard delay={0.15}>
        <div className="space-y-4">
          <EmergencyProgress completed={completedTimelineItems} total={totalTimelineItems} progress={recoveryScore} />
          {recoveryScore >= 25 && recoveryScore < 50 && (
            <RecoveryMilestone title="Great Start" message="You've completed the first critical actions. Keep going." />
          )}
          {recoveryScore >= 50 && recoveryScore < 75 && (
            <RecoveryMilestone title="Halfway There" message="The situation is becoming more manageable. Continue following the plan." />
          )}
          {recoveryScore >= 75 && recoveryScore < 100 && (
            <RecoveryMilestone title="Almost Safe" message="Most immediate risks have been reduced. Only a few actions remain." />
          )}
          {recoveryScore === 100 && (
            <RecoveryMilestone title="Recovery Complete" message="Excellent work. You've completed every recommended emergency action." />
          )}
        </div>
      </AnimatedCard>

      {/* 3. Action Timeline (Prioritized Execution Step) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Action Timeline</h2>
        <div className="border border-gray-100 bg-white rounded-2xl p-5 space-y-6 shadow-sm">
          <TimelineSection
            title="🚨 Right Now"
            items={result.timeline?.now}
            completed={timelineProgress?.now || []}
            onToggle={(index) =>
              setTimelineProgress((prev) => ({
                ...prev,
                now: prev.now.map((v, i) => (i === index ? !v : v)),
              }))
            }
          />
          {nowComplete && (
            <div className="rounded-xl border border-green-100 bg-green-50 p-3">
              <div className="text-xs font-medium text-green-800">✅ Immediate danger isolated. Proceed smoothly below.</div>
            </div>
          )}

          <TimelineSection
            title="⏱ Next 10 Minutes"
            items={result.timeline?.next_10_minutes}
            completed={timelineProgress?.next10 || []}
            locked={!nowComplete}
            onToggle={(index) =>
              setTimelineProgress((prev) => ({
                ...prev,
                next10: prev.next10.map((v, i) => (i === index ? !v : v)),
              }))
            }
          />

          <TimelineSection
            title="🕐 Next Hour"
            items={result.timeline?.next_hour}
            completed={timelineProgress?.nextHour || []}
            locked={!next10Complete}
            onToggle={(index) =>
              setTimelineProgress((prev) => ({
                ...prev,
                nextHour: prev.nextHour.map((v, i) => (i === index ? !v : v)),
              }))
            }
          />

          <TimelineSection
            title="📅 Today"
            items={result.timeline?.today}
            completed={timelineProgress?.today || []}
            locked={!nextHourComplete}
            onToggle={(index) =>
              setTimelineProgress((prev) => ({
                ...prev,
                today: prev.today.map((v, i) => (i === index ? !v : v)),
              }))
            }
          />
        </div>
      </div>

      {/* 4. Situation Updates */}
      <SituationUpdates updates={result.situation_updates} />

      {/* 5. Risk Assessment (Premium Typographic treatment, softened metrics) */}
      <AnimatedCard delay={0.2}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Risk Assessment</h2>
          
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            {sortedRisks?.length > 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">⚠ Highest Priority Threat</p>
                <h3 className="mt-1 font-medium text-gray-900 text-sm md:text-base">{sortedRisks[0].type}</h3>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full bg-gray-100">
                    <div className="h-1 rounded-full bg-amber-500/80 transition-all duration-300" style={{ width: `${sortedRisks[0].level}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium font-mono">{sortedRisks[0].level}%</span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              {sortedRisks.slice(1).map((risk: any, index: number) => (
                <div key={index} className="flex flex-col gap-1 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-xs text-gray-700">
                    <span className="font-normal">{risk.type}</span>
                    <span className="text-gray-400 font-mono">{risk.level}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-50">
                    <div className="h-1 rounded-full bg-amber-500/60 transition-all duration-300" style={{ width: `${risk.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Reasoning Context Panels */}
      <DecisionReasoning reasoning={result.decision_reasoning} />
      <AlternativeActions actions={result.alternative_actions} />
      <MistakesToAvoid mistakes={result.mistakes_to_avoid} />

      {/* Export Report Layout */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-900">
            <span className="text-lg">📄</span>
            <h3 className="text-sm font-medium">Emergency Action Report</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Download this full defensive response documentation local to device.</p>
        </div>
        <button
          onClick={() => exportEmergencyReport(result, answers)}
          className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition shadow-sm"
        >
          Download PDF
        </button>
      </div>

      {/* 6. Important Contacts (Beautiful Emergency Contacts Cards Block) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Important Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.important_contacts?.map((contact: string, index: number) => {
            const parts = contact.split(/[:\-]/);
            const label = parts[0]?.trim() || "Emergency Helpline";
            const detail = parts.slice(1).join(":")?.trim() || "Active Response";

            return (
              <div key={index} className="flex items-center justify-between border border-gray-100 bg-white rounded-xl p-4 shadow-sm">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                    <span>🚨</span> {label}
                  </div>
                  <div className="text-xs text-gray-400">Available 24x7 • Priority Channel</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    {detail}
                  </span>
                  <a
                    href={`tel:${detail.replace(/\s+/g, "")}`}
                    className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50 transition shadow-xs"
                  >
                    Call
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Follow-Up Questions (Prompts directly into the Refinement Loop) */}
      {result.follow_up_questions?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Questions We Need Answered</h2>
          <div className="space-y-3">
            {result.follow_up_questions.map((question: string, index: number) => (
              <div key={index} className="border border-blue-50 rounded-xl p-4 bg-blue-50/30">
                <p className="text-xs font-medium text-gray-800 mb-2">❓ {question}</p>
                <input
                  type="text"
                  placeholder="Provide situation details to optimize strategy..."
                  value={answers[question] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                  className="w-full text-xs border bg-white rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-xs"
                />
              </div>
            ))}
          </div>
          <button
            onClick={onRefine}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            Refine Action Blueprint
          </button>
        </div>
      )}
    </motion.div>
  );
}

function TimelineSection({
  title,
  items,
  completed,
  onToggle,
  locked = false,
}: {
  title: string;
  items: string[];
  completed: boolean[];
  onToggle: (index: number) => void;
  locked?: boolean;
}) {
  const styles: Record<string, { header: string; activeCard: string; baseCard: string }> = {
    "🚨 Right Now": { header: "text-red-700 bg-red-50", activeCard: "border-green-300 bg-green-50/50", baseCard: "border-gray-100 hover:bg-red-50/20" },
    "⏱ Next 10 Minutes": { header: "text-orange-700 bg-orange-50", activeCard: "border-green-300 bg-green-50/50", baseCard: "border-gray-100 hover:bg-orange-50/20" },
    "🕐 Next Hour": { header: "text-amber-700 bg-amber-50", activeCard: "border-green-300 bg-green-50/50", baseCard: "border-gray-100 hover:bg-amber-50/20" },
    "📅 Today": { header: "text-green-700 bg-green-50", activeCard: "border-green-300 bg-green-50/50", baseCard: "border-gray-100 hover:bg-green-50/20" },
  };
  const style = styles[title] || styles["📅 Today"];
  if (!items || items.length === 0) return null;

  if (locked) {
    return (
      <div className="opacity-40 select-none">
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style.header}`}>
          🔒 {title}
        </div>
        <div className="mt-2 text-xs text-gray-400 italic pl-1">Complete preceding priorities to unlock actions.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style.header}`}>
        {title}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item, index) => (
          <label
            key={index}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition text-xs ${
              completed[index] ? style.activeCard : style.baseCard
            }`}
          >
            <input
              type="checkbox"
              checked={completed[index] || false}
              onChange={() => onToggle(index)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
            />
            <span className={`leading-relaxed ${completed[index] ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
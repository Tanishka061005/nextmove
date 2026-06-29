"use client";

import { exportEmergencyReport } from "@/lib/exportEmergencyReport";
import StickyCriticalAction from "@/components/StickyCriticalAction";
import { useEffect, useRef, useState } from "react";
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

  const confettiFired = useRef({ now: false, next10: false, nextHour: false, today: false });
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

  const recoveryScore = totalTimelineItems === 0 ? 0 : Math.round((completedTimelineItems / totalTimelineItems) * 100);
  const recoveryStatus = recoveryScore === 100 ? "Recovered" : recoveryScore >= 75 ? "Almost Safe" : recoveryScore >= 40 ? "Improving" : "Critical";

  const recoveryStyle =
    recoveryScore === 100 ? "bg-green-100 text-green-700" : recoveryScore >= 75 ? "bg-emerald-100 text-emerald-700" : recoveryScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  const nowComplete = timelineProgress?.now?.length > 0 && timelineProgress.now.every(Boolean);
  const next10Complete = timelineProgress?.next10?.length > 0 && timelineProgress.next10.every(Boolean);
  const nextHourComplete = timelineProgress?.nextHour?.length > 0 && timelineProgress.nextHour.every(Boolean);
  const todayComplete = timelineProgress?.today?.length > 0 && timelineProgress.today.every(Boolean);

  useEffect(() => {
    if (nowComplete && !confettiFired.current.now) { confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } }); confettiFired.current.now = true; }
    else if (!nowComplete) confettiFired.current.now = false;
  }, [nowComplete]);

  useEffect(() => {
    if (next10Complete && !confettiFired.current.next10) { confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } }); confettiFired.current.next10 = true; }
    else if (!next10Complete) confettiFired.current.next10 = false;
  }, [next10Complete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      {result.critical_action && (
        <StickyCriticalAction title={result.critical_action.title} estimatedTime={result.critical_action.estimated_time} severity={result.severity} />
      )}

      {/* ==================== 1. HERO SECTION ==================== */}
      <AnimatedCard delay={0.05}>
        <div id="mission-control" className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow-xs">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${result.severity === "Critical" ? "bg-red-50 text-red-700 border border-red-100" : "bg-orange-50 text-orange-700 border border-orange-100"}`}>
              🚨 {result.severity}
            </span>
            <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              🎯 {result.confidence}% Confidence
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              ⏱ {result.estimated_resolution_time}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${recoveryStyle}`}>
              🩺 {recoveryStatus}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{result.scenario}</h1>
          <p className="mt-2.5 text-gray-600 leading-relaxed text-sm md:text-base">{result.summary}</p>

          {result.critical_action && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50/30 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-red-600">⚡ High Priority Focus</div>
              <div className="mt-1 font-semibold text-gray-900 text-sm md:text-base">{result.critical_action.title}</div>
              <div className="mt-1.5 text-xs text-gray-500">Duration: Roughly {result.critical_action.estimated_time}</div>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* ==================== 2. EXECUTE SECTION ==================== */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Action Timeline</h2>
        <div className="border border-gray-100 bg-white rounded-2xl p-5 space-y-6 shadow-xs">
          <TimelineSection
            title="🚨 Right Now"
            items={result.timeline?.now}
            completed={timelineProgress?.now || []}
            onToggle={(index) => setTimelineProgress(prev => ({ ...prev, now: prev.now.map((v, i) => i === index ? !v : v) }))}
          />
          <TimelineSection
            title="⏱ Next 10 Minutes"
            items={result.timeline?.next_10_minutes}
            completed={timelineProgress?.next10 || []}
            locked={!nowComplete}
            onToggle={(index) => setTimelineProgress(prev => ({ ...prev, next10: prev.next10.map((v, i) => i === index ? !v : v) }))}
          />
          <TimelineSection
            title="🕐 Next Hour"
            items={result.timeline?.next_hour}
            completed={timelineProgress?.nextHour || []}
            locked={!next10Complete}
            onToggle={(index) => setTimelineProgress(prev => ({ ...prev, nextHour: prev.nextHour.map((v, i) => i === index ? !v : v) }))}
          />
          <TimelineSection
            title="📅 Today"
            items={result.timeline?.today}
            completed={timelineProgress?.today || []}
            locked={!nextHourComplete}
            onToggle={(index) => setTimelineProgress(prev => ({ ...prev, today: prev.today.map((v, i) => i === index ? !v : v) }))}
          />
        </div>
      </div>

      {/* Emergency Hotlines Row - Lifted to High-Priority Execution Space */}
      {result.important_contacts?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.important_contacts.map((contact: string, index: number) => {
              const parts = contact.split(/[:\-]/);
              const label = parts[0]?.trim() || "Helpline";
              const phone = parts.slice(1).join(":")?.trim() || "";

              return (
                <div key={index} className="flex items-center justify-between border border-gray-100 bg-white rounded-xl p-3.5 shadow-xs">
                  <div>
                    <div className="text-xs font-medium text-gray-800 flex items-center gap-1">📞 {label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Priority Response Link</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{phone}</span>
                    <a href={`tel:${phone.replace(/\s+/g, "")}`} className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50 transition shadow-2xs">Call</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SituationUpdates updates={result.situation_updates} />

      {/* ==================== 3. MONITOR SECTION ==================== */}
      <div className="space-y-6 pt-2 border-t border-gray-50">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Recovery Progress</h2>
          <EmergencyProgress completed={completedTimelineItems} total={totalTimelineItems} progress={recoveryScore} />
          {recoveryScore > 0 && (
            <RecoveryMilestone title={`System Health: ${recoveryStatus}`} message={`You have verified execution on ${completedTimelineItems} response benchmarks.`} />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Risk Assessment</h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-3.5">
            {sortedRisks.map((risk: any, index: number) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span className={index === 0 ? "font-medium text-gray-900 flex items-center gap-1" : ""}>
                    {index === 0 && "⚠️ "}{risk.type}
                  </span>
                  <span className="text-gray-400 font-mono text-[11px]">{risk.level}%</span>
                </div>
                {/* Cleaned layout: Thin profile track and softened saturation bars */}
                <div className="h-1 w-full rounded-full bg-gray-50">
                  <div className={`h-1 rounded-full transition-all duration-300 ${index === 0 ? "bg-amber-500" : "bg-amber-400/60"}`} style={{ width: `${risk.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 4. UNDERSTAND SECTION ==================== */}
      {/* Structural change: Accordions clean up page height for analytical telemetry */}
      <div className="space-y-2 pt-2 border-t border-gray-50">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-3">Strategy Context</h2>
        
        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>🧠 Decision Reasoning Matrix</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/20 text-xs text-gray-600 leading-relaxed">
            <DecisionReasoning reasoning={result.decision_reasoning} />
          </div>
        </details>

        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>❌ Critical Pitfalls to Avoid</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/20 text-xs text-gray-600 leading-relaxed">
            <MistakesToAvoid mistakes={result.mistakes_to_avoid} />
          </div>
        </details>

        <details className="group border border-gray-100 bg-white rounded-xl shadow-2xs overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex justify-between items-center p-4 text-xs font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50 transition">
            <span>🔄 Alternative Path Contingencies</span>
            <span className="text-gray-400 transition group-open:rotate-180">↓</span>
          </summary>
          <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/20 text-xs text-gray-600 leading-relaxed">
            <AlternativeActions actions={result.alternative_actions} />
          </div>
        </details>
      </div>

      {/* ==================== 5. FINISH SECTION ==================== */}
      <div className="space-y-4 pt-2 border-t border-gray-50">
        {result.follow_up_questions?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Refinement Variables</h2>
            <div className="space-y-2.5">
              {result.follow_up_questions.map((question: string, index: number) => (
                <div key={index} className="border border-blue-50 rounded-xl p-3.5 bg-blue-50/20">
                  <p className="text-xs font-medium text-gray-700 mb-2">❓ {question}</p>
                  <input
                    type="text"
                    placeholder="Provide context answer..."
                    value={answers[question] || ""}
                    onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                    className="w-full text-xs border bg-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-2xs"
                  />
                </div>
              ))}
            </div>
            <button onClick={onRefine} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-medium text-white hover:bg-blue-700 shadow-xs transition">
              Update Strategy Protocol
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-medium text-gray-900 flex items-center gap-1">📄 Incident Response Portfolio</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Freeze-dry this localized document for remote access.</p>
          </div>
          <button onClick={() => exportEmergencyReport(result, answers)} className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-gray-800 transition shadow-xs">
            Download PDF
          </button>
        </div>
      </div>
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
    "🚨 Right Now": { header: "text-red-700 bg-red-50", activeCard: "border-green-200 bg-green-50/40", baseCard: "border-gray-50 hover:bg-red-50/10" },
    "⏱ Next 10 Minutes": { header: "text-orange-700 bg-orange-50", activeCard: "border-green-200 bg-green-50/40", baseCard: "border-gray-50 hover:bg-orange-50/10" },
    "🕐 Next Hour": { header: "text-amber-700 bg-amber-50", activeCard: "border-green-200 bg-green-50/40", baseCard: "border-gray-50 hover:bg-amber-50/10" },
    "📅 Today": { header: "text-green-700 bg-green-50", activeCard: "border-green-200 bg-green-50/40", baseCard: "border-gray-50 hover:bg-green-50/10" },
  };
  const style = styles[title] || styles["📅 Today"];
  if (!items || items.length === 0) return null;

  if (locked) {
    return (
      <div className="opacity-35 select-none transition-opacity">
        <div className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.header}`}>🔒 {title}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.header}`}>
        {title}
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {items.map((item, index) => (
          <label key={index} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition text-xs ${completed[index] ? style.activeCard : style.baseCard}`}>
            <input
              type="checkbox"
              checked={completed[index] || false}
              onChange={() => onToggle(index)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
            />
            <span className={`leading-relaxed ${completed[index] ? "line-through text-gray-400 font-normal" : "text-gray-700 font-medium"}`}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
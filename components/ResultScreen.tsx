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
import { speakPlan } from "@/lib/speakPlan";

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

  // Track confetti explosions so they only fire once per stage completion
  const confettiFired = useRef({
    now: false,
    next10: false,
    nextHour: false,
    today: false,
  });

  const sortedRisks = [...(result.risks || [])].sort((a, b) => b.level - a.level);

  // Dynamic Timeline Calculations (Recovery Score Engine)
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

  // Derive Recovery Status metrics
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

  // Stage Completion Checks
  const nowComplete = timelineProgress?.now?.length > 0 && timelineProgress.now.every(Boolean);
  const next10Complete = timelineProgress?.next10?.length > 0 && timelineProgress.next10.every(Boolean);
  const nextHourComplete = timelineProgress?.nextHour?.length > 0 && timelineProgress.nextHour.every(Boolean);
  const todayComplete = timelineProgress?.today?.length > 0 && timelineProgress.today.every(Boolean);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  useEffect(() => {
    if (nowComplete) {
      if (!confettiFired.current.now) {
        fireConfetti();
        confettiFired.current.now = true;
      }
    } else {
      confettiFired.current.now = false;
    }
  }, [nowComplete]);

  useEffect(() => {
    if (next10Complete) {
      if (!confettiFired.current.next10) {
        fireConfetti();
        confettiFired.current.next10 = true;
      }
    } else {
      confettiFired.current.next10 = false;
    }
  }, [next10Complete]);

  useEffect(() => {
    if (nextHourComplete) {
      if (!confettiFired.current.nextHour) {
        fireConfetti();
        confettiFired.current.nextHour = true;
      }
    } else {
      confettiFired.current.nextHour = false;
    }
  }, [nextHourComplete]);

  useEffect(() => {
    if (todayComplete) {
      if (!confettiFired.current.today) {
        fireConfetti();
        confettiFired.current.today = true;
      }
    } else {
      confettiFired.current.today = false;
    }
  }, [todayComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mt-6 space-y-6"
    >
      {result.critical_action && (
        <StickyCriticalAction
          title={result.critical_action.title}
          estimatedTime={result.critical_action.estimated_time}
          severity={result.severity}
        />
      )}

      {/* 1. Dynamic Mission Control */}
      <AnimatedCard delay={0.1}>
        <div
          id="mission-control"
          className="rounded-2xl border bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-6 shadow-sm"
        >
          <div className="flex flex-wrap gap-3 mb-5">
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                result.severity === "Critical"
                  ? "bg-red-100 text-red-700"
                  : result.severity === "High"
                  ? "bg-orange-100 text-orange-700"
                  : result.severity === "Medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              🚨 {result.severity}
            </span>

            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              🎯 {result.confidence}% Confidence
            </span>

            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              ⏱ {result.estimated_resolution_time}
            </span>

            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${recoveryStyle}`}>
              🩺 {recoveryStatus}
            </span>
          </div>

          <h1 className="text-3xl font-bold">{result.scenario}</h1>

          <p className="mt-3 text-gray-700 leading-relaxed">{result.summary}</p>

          <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
            <p className="font-medium text-gray-800">
              {recoveryScore >= 75
                ? "✅ Most immediate risks have been addressed."
                : recoveryScore >= 40
                ? "⚠ You're making good progress. Continue following the recovery plan."
                : "🚨 Immediate action is still required to reduce risk."}
            </p>
          </div>

          {result.confidence_reason && (
            <div className="mt-4 rounded-lg bg-white border p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Why {result.confidence}%?</span> {result.confidence_reason}
              </p>
            </div>
          )}

          {recoveryScore < 75 && result.urgency_message && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-100 p-3">
              <p className="font-medium text-red-700">⚠ {result.urgency_message}</p>
            </div>
          )}

          {result.critical_action && (
            <div className="mt-6 rounded-xl border-2 border-red-300 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-red-600">⚡ MOST IMPORTANT NEXT STEP</div>
              <div className="mt-2 text-2xl font-bold">{result.critical_action.title}</div>
              <div className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm">
                ⏱ Takes about {result.critical_action.estimated_time}
              </div>
            </div>
          )}

          {isRefined && previousConfidence !== null && result.confidence > previousConfidence && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="font-semibold text-green-700">✨ Plan Improved</div>
              <p className="text-sm mt-1">
                Confidence increased from <strong>{previousConfidence}%</strong> to <strong>{result.confidence}%</strong>.
              </p>
            </div>
          )}

          {recoveryScore === 100 && (
            <div className="mt-5 rounded-xl border border-green-300 bg-green-50 p-5 shadow-sm">
              <div className="text-lg font-semibold text-green-700">🎉 Recovery Complete</div>
              <p className="mt-2 text-green-700 text-sm leading-relaxed">
                You have completed every recommended emergency action. Continue monitoring the situation if necessary.
              </p>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Why This Plan */}
      <DecisionReasoning reasoning={result.decision_reasoning} />
      <AlternativeActions actions={result.alternative_actions} />
      <MistakesToAvoid mistakes={result.mistakes_to_avoid} />

      {/* Export PDF */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <h2 className="text-xl font-semibold">Your Emergency Report</h2>
            </div>
            <p className="mt-2 text-gray-600">Your personalized emergency action plan is ready to download.</p>
          </div>
          <button
            onClick={() => exportEmergencyReport(result, answers)}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
          >
            Download PDF
          </button>
        </div>
      </div>



        {/* Voice Button */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

            <div>

                <h2 className="text-xl font-semibold">
                    🔊 Listen to Your Plan
                </h2>

                <p className="mt-2 text-gray-600">
                    Have NextMove read your emergency plan aloud.
                </p>

            </div>

            <button
                onClick={() =>
                    speakPlan(
                        result.summary,
                        result.critical_action.title,
                        result.timeline
                    )
                }
                className="rounded-xl bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
            >
                Read Plan
            </button>

        </div>

    </div>



      {/* 2. Progress Tracker & Milestones */}
      <AnimatedCard delay={0.2}>
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

      <SituationUpdates updates={result.situation_updates} />

      {/* 3. Risk Assessment */}
      <AnimatedCard delay={0.3}>
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-bold mb-6">Risk Assessment</h2>
          {sortedRisks?.length > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-600">⚠ Highest Priority Risk</p>
              <h3 className="mt-2 text-xl font-bold">{sortedRisks[0].type}</h3>
              <p className="mt-2 text-gray-600">Risk Level: {sortedRisks[0].level}%</p>
            </div>
          )}
          <div className="space-y-4">
            {sortedRisks.slice(1).map((risk: any, index: number) => (
              <div key={index} className="rounded-xl border p-4">
                <div className="flex justify-between">
                  <span className="font-medium">{risk.type}</span>
                  <span className="text-gray-500">{risk.level}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-orange-400" style={{ width: `${risk.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Action Timeline */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-4">Action Timeline</h2>
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
          <div className="mb-8 mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="font-semibold text-green-700">✅ Immediate danger reduced</div>
            <p className="mt-1 text-sm text-green-700">Great work. Continue with the next stage.</p>
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

      {/* Master Checklist */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-4">Action Checklist</h2>
        <div className="space-y-3">
          {result.checklist?.map((item: string, index: number) => (
            <ChecklistItem
              key={index}
              text={item}
              checked={completed[index] ?? false}
              onToggle={() =>
                setCompleted((prev) => prev.map((v, i) => (i === index ? !v : v)))
              }
            />
          ))}
        </div>
      </div>

      {/* Follow-Up Questions */}
      {result.follow_up_questions?.length > 0 && (
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-4">Questions We Need Answered</h2>
          <div className="space-y-4">
            {result.follow_up_questions.map((question: string, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-blue-50">
                <p className="mb-2">❓ {question}</p>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answers[question] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            ))}
          </div>
          <button
            onClick={onRefine}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700"
          >
            Refine My Plan
          </button>
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-4">Important Contacts</h2>
        <div className="space-y-3">
          {result.important_contacts?.map((contact: string, index: number) => (
            <div key={index} className="border rounded-lg p-3 bg-green-50">
              📞 {contact}
            </div>
          ))}
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
  const styles: Record<string, { header: string; card: string }> = {
    "🚨 Right Now": { header: "bg-red-100 text-red-700", card: "border-red-200 hover:bg-red-50" },
    "⏱ Next 10 Minutes": { header: "bg-orange-100 text-orange-700", card: "border-orange-200 hover:bg-orange-50" },
    "🕐 Next Hour": { header: "bg-yellow-100 text-yellow-700", card: "border-yellow-200 hover:bg-yellow-50" },
    "📅 Today": { header: "bg-green-100 text-green-700", card: "border-green-200 hover:bg-green-50" },
  };
  const style = styles[title] || styles["📅 Today"];
  if (!items || items.length === 0) return null;

  if (locked) {
    return (
      <div className="mb-8 opacity-50">
        <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${style.header}`}>
          🔒 {title}
        </div>
        <div className="mt-4 rounded-xl border border-dashed bg-gray-50 p-4 text-gray-500">
          Complete the previous stage to unlock this section.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${style.header}`}>
        {title}
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <label
            key={index}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
              completed[index] ? "border-green-300 bg-green-50" : style.card
            }`}
          >
            <input type="checkbox" checked={completed[index] || false} onChange={() => onToggle(index)} className="mt-1" />
            <span className={completed[index] ? "line-through text-gray-500" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ChecklistItem({ text, checked, onToggle }: { text: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1" />
      <span>{text}</span>
    </label>
  );
}
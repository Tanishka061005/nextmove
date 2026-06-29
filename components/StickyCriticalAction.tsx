"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  estimatedTime: string;
  severity: string;
};

const severityStyles = {
  Critical: {
    bg: "bg-red-600",
    border: "border-red-700",
    badge: "bg-red-500",
  },
  High: {
    bg: "bg-orange-500",
    border: "border-orange-600",
    badge: "bg-orange-400",
  },
  Medium: {
    bg: "bg-yellow-500",
    border: "border-yellow-600",
    badge: "bg-yellow-400",
  },
  Low: {
    bg: "bg-green-600",
    border: "border-green-700",
    badge: "bg-green-500",
  },
};


export default function StickyCriticalAction({
  title,
  estimatedTime,
  severity,
}: Props) {
  const [visible, setVisible] = useState(false);

  const style =
    severityStyles[severity as keyof typeof severityStyles] ??
    severityStyles.High;


 useEffect(() => {
    
    const missionControl = document.getElementById("mission-control");

    if (!missionControl) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
            setVisible(entry.intersectionRatio < 0.2);
        },
        {
            threshold: [0.2],
        }
    );

    observer.observe(missionControl);

    return () => observer.disconnect();
    }, []);

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto max-w-4xl px-6 pt-3">

  <div
    className={`flex items-center justify-between rounded-2xl border ${style.border} ${style.bg} px-6 py-4 text-white shadow-2xl`}
  >

    <div>

        <div
            className={`inline-flex items-center rounded-full ${style.badge} px-3 py-1 text-xs font-semibold uppercase tracking-wide`}
        >
            🚨 Active Incident
        </div>

        <h3 className="mt-3 text-lg font-semibold">
            {title}
        </h3>

        <p className="mt-2 text-sm text-white/90">
            {severity} Priority • ~{estimatedTime}
        </p>

        </div>

        <div className="text-3xl">
        ⚡
        </div>

    </div>

    </div>
    </div>
  );
}
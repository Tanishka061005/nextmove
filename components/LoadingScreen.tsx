"use client";

import { useEffect, useState } from "react";

const messages = [
  "Understanding your situation...",
  "Identifying immediate risks...",
  "Building your action timeline...",
  "Finding important contacts...",
  "Preparing your personalized plan...",
  "Performing final safety review...",
];

export default function LoadingScreen() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) =>
        prev === messages.length - 1 ? prev : prev + 1
      );
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-6">
      {/* 1. TOP DOCK CRITICAL PLAN OVERVIEW */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-orange-700/50 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/10">
            🚨 Active Incident
          </div>
          <h2 className="text-base font-bold tracking-tight">Calculating Primary Response...</h2>
        </div>
        <div className="text-xl animate-bounce">⚡</div>
      </div>

      {/* 2. NEXTMOVE INTERFACE BOX CONTAINER */}
      <div className="bg-[#FFF5F5] border border-red-100/80 rounded-[24px] p-5 space-y-4 shadow-sm">
        
        {/* Component Header Metadata Layout */}
        <div className="border-b border-red-200/30 pb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 font-serif">
            💬 NextMove Copilot
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
            Assembling strategic timeline protocols and analyzing threat parameters.
          </p>
        </div>

        {/* Live Active Status Indicator Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center text-[10px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
            🚨 Emergency Mode ON
          </span>
          <span className="inline-flex items-center text-[10px] font-medium bg-white border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full shadow-2xs">
            📄 Generating Matrix...
          </span>
        </div>

        {/* Core Loading Window Box */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 min-h-[160px] flex flex-col justify-center items-center shadow-3xs">
          <div className="flex flex-col items-center gap-4 text-center">
            
            {/* Custom Spinning Arc */}
            <div className="relative flex items-center justify-center h-10 w-10">
              <div className="absolute h-10 w-10 rounded-full border-2 border-gray-50" />
              <div className="absolute h-10 w-10 rounded-full border-2 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>

            {/* Dynamic Message Matrix Loader */}
            <div className="space-y-1">
              <p
                key={currentMessage}
                className="text-xs font-semibold text-gray-800 transition-all duration-300 tracking-wide"
              >
                {messages[currentMessage]}
              </p>
              <p className="text-[9px] font-mono tracking-tight text-gray-400 uppercase">
                Telemetry Log: 0x{((currentMessage + 1) * 16).toString(16).toUpperCase()}
              </p>
            </div>

          </div>
        </div>

        {/* Disabled Simulated Action Chips */}
        <div className="flex flex-col gap-1.5 pt-1 opacity-25 select-none pointer-events-none">
          <div className="w-fit bg-white border border-gray-200 text-gray-400 px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-3xs">
            🎯 Calibrating strategic priority...
          </div>
          <div className="w-fit bg-white border border-gray-200 text-gray-400 px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-3xs">
            🛡️ Isolating threat boundaries...
          </div>
        </div>

        {/* Solid Processing Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-red-200/20">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white border border-gray-100 p-0.5 shadow-3xs">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500 ease-out"
              style={{
                width: `${((currentMessage + 1) / messages.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-center text-[10px] text-gray-400 font-medium">
            Please stand by. Computing response telemetry...
          </p>
        </div>

      </div>
    </div>
  );
}
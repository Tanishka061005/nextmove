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
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border bg-white p-8 shadow-xl">

        <div className="flex flex-col items-center">

          <div className="mb-5 text-6xl animate-pulse">
            🧠
          </div>

          <h2 className="text-3xl font-bold">
            NextMove AI
          </h2>

          <p className="mt-2 text-gray-500">
            Building your emergency response plan
          </p>

        </div>

        <div className="mt-10 rounded-2xl border bg-gray-50 p-6">

          <div className="flex items-center gap-4">

            <div className="h-4 w-4 rounded-full bg-blue-500 animate-ping" />

            <p
              key={currentMessage}
              className="text-lg font-medium transition-all duration-300"
            >
              {messages[currentMessage]}
            </p>

          </div>

        </div>

        {/* Progress Bar */}

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700"
            style={{
              width: `${
                ((currentMessage + 1) / messages.length) * 100
              }%`,
            }}
          />

        </div>

        <p className="mt-5 text-center text-sm text-gray-400">
          This usually takes only a few seconds...
        </p>

      </div>
    </div>
  );
}
type ProgressTrackerProps = {
  hasResult: boolean;
  isRefined: boolean;
};

export default function ProgressTracker({
  hasResult,
  isRefined,
}: ProgressTrackerProps) {
  const steps = [
    {
      label: "Situation",
      completed: true,
    },
    {
      label: "Analysis",
      completed: hasResult,
    },
    {
      label: "Questions",
      completed:
        hasResult &&
        !isRefined,
    },
    {
      label: "Final Plan",
      completed: isRefined,
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">

        {steps.map((step, index) => (
          <div
            key={step.label}
            className="flex flex-1 items-center"
          >
            <div className="flex flex-col items-center">

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  step.completed
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>

              <span className="mt-2 text-sm font-medium">
                {step.label}
              </span>

            </div>

            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-1 flex-1 rounded ${
                  step.completed
                    ? "bg-green-400"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
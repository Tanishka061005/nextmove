type Props = {
  completed: number;
  total: number;
  progress: number;
};

export default function EmergencyProgress({
  completed,
  total,
  progress,
}: Props) {
  let status = "";
  let color = "bg-red-500";

  if (progress === 100) {
    status = "Recovery complete.";
    color = "bg-green-500";
  } else if (progress >= 70) {
    status =
      "You're in the final recovery stage. Finish the remaining tasks.";
    color = "bg-green-500";
  } else if (progress >= 40) {
    status =
      "You're past the most critical stage. Continue following the plan.";
    color = "bg-yellow-500";
  } else if (progress > 0) {
    status =
      "Critical actions are still pending. Prioritize the remaining tasks.";
    color = "bg-orange-500";
  } else {
    status =
      "No recovery actions completed yet. Start with the critical action.";
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold">
            📈 Emergency Recovery
          </h2>

          <p className="mt-1 text-gray-500">
            {completed} of {total} actions completed
          </p>
        </div>

        <div className="text-3xl font-bold">
          {progress}%
        </div>

      </div>

      <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-gray-200">

        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <p className="mt-4 text-sm text-gray-600">
        {status}
      </p>

    </div>
  );
}
type Update = {
  type: "info" | "warning" | "tip";
  text: string;
};

export default function SituationUpdates({
  updates,
}: {
  updates: Update[];
}) {
  if (!updates?.length) return null;

  const styles = {
    info: {
      icon: "ℹ️",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    warning: {
      icon: "⚠️",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    tip: {
      icon: "💡",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center gap-2">
        <span className="text-2xl">📢</span>

        <h2 className="text-xl font-semibold">
            Situation Updates
        </h2>
    </div>

    <p className="mt-2 text-sm text-gray-500">
        Helpful context while you work through your recovery.
    </p>

      <div className="space-y-3">

        {updates.map((update, index) => {
          const style = styles[update.type];

          return (
            <div
              key={index}
              className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
            >
              <div className="flex gap-3">

                <span className="text-lg">
                  {style.icon}
                </span>

                <p>{update.text}</p>

              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}
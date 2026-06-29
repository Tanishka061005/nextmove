type Props = {
  mistakes: string[];
};

export default function MistakesToAvoid({
  mistakes,
}: Props) {
  if (!mistakes?.length) return null;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚠</span>

        <h2 className="text-xl font-semibold">
          Mistakes to Avoid
        </h2>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        These actions can make the situation worse.
      </p>

      <div className="mt-5 space-y-3">
        {mistakes.map((mistake, index) => (
          <div
            key={index}
            className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
          >
            <div className="flex gap-3">
              <span className="text-yellow-700 font-bold">
                ✕
              </span>

              <p>{mistake}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
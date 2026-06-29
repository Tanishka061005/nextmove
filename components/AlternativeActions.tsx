type Props = {
  actions: string[];
};

export default function AlternativeActions({
  actions,
}: Props) {
  if (!actions?.length) return null;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center gap-2">
        <span className="text-2xl">🅱</span>

        <h2 className="text-xl font-semibold">
          If That Doesn't Work
        </h2>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Backup options if your primary action isn't possible.
      </p>

      <div className="mt-5 space-y-3">

        {actions.map((action, index) => (
          <div
            key={index}
            className="rounded-xl border border-blue-200 bg-blue-50 p-4"
          >
            <div className="flex gap-3">

              <span className="font-bold text-blue-600">
                {index + 1}
              </span>

              <p>{action}</p>

            </div>
          </div>
        ))}

      </div>

    </div>
  );
}
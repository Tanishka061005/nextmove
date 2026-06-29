type Props = {
  reasoning: string;
};

export default function DecisionReasoning({
  reasoning,
}: Props) {
  if (!reasoning) return null;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center gap-2">
        <span className="text-2xl">🧠</span>

        <h2 className="text-xl font-semibold">
          Why This Plan?
        </h2>
      </div>

      <p className="mt-4 leading-7 text-gray-700">
        {reasoning}
      </p>

    </div>
  );
}
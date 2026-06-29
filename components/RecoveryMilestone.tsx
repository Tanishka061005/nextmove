type RecoveryMilestoneProps = {
  title: string;
  message: string;
};

export default function RecoveryMilestone({
  title,
  message,
}: RecoveryMilestoneProps) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm animate-pulse">
      <div className="text-lg font-semibold text-green-700">
        🎉 {title}
      </div>

      <p className="mt-2 text-sm text-green-700">
        {message}
      </p>
    </div>
  );
}
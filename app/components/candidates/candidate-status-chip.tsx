const statusStyles: Record<string, string> = {
  Applied: "border-gray-400/30 bg-gray-500/10 text-gray-600 dark:text-gray-300",

  "HR Interview":
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",

  "Technical Interview":
    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",

  "Client Interview":
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",

  Offered:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

  Hired:
    "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",

  Discarded:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function CandidateStatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] ??
        "border-gray-400/30 bg-gray-500/10 text-gray-600 dark:text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}
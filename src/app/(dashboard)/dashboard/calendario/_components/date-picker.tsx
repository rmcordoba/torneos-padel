"use client";

import { useRouter } from "next/navigation";

export function DatePicker({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={defaultDate}
      onChange={(e) => {
        if (e.target.value) router.push(`/dashboard/calendario?date=${e.target.value}`);
      }}
      className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  );
}

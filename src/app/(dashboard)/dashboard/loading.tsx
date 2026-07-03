import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 }}>
      <div>
        <Skeleton style={{ width: 220, height: 28, marginBottom: 10 }} />
        <Skeleton style={{ width: 320, height: 13, maxWidth: "100%" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 96, borderRadius: 16 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} style={{ height: 56, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <Skeleton style={{ width: 280, height: 30, marginBottom: 12, maxWidth: "100%" }} />
        <Skeleton style={{ width: 380, height: 14, maxWidth: "100%" }} />
      </div>
      <Skeleton style={{ height: 220, borderRadius: 18 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ height: 160, borderRadius: 18 }} />
        ))}
      </div>
    </div>
  );
}

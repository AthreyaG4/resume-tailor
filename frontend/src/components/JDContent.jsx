import { MapPin } from "lucide-react";
import { SkillTag } from "./ui/SkillTag";

export function JDContent({ data }) {
  const jd = data.jd_json;
  if (!jd) return null;
  const mustHave = jd.must_have_qualifications || [];
  const niceToHave = jd.nice_to_have_qualifications || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {jd.location && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 99,
            padding: "5px 12px",
            alignSelf: "flex-start",
          }}
        >
          <MapPin style={{ width: 13, height: 13, color: "#94a3b8", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "#475569" }}>{jd.location}</span>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
            Must-have
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{mustHave.length} skills</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {mustHave.map((s) => <SkillTag key={s} label={s} variant="neutral" />)}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
            Nice to have
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{niceToHave.length} skills</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {niceToHave.map((s) => <SkillTag key={s} label={s} variant="ghost" />)}
        </div>
      </div>
    </div>
  );
}

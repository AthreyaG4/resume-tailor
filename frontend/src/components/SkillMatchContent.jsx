import { ScoreBar, scoreColor } from "./ui/ScoreBar";
import { SkillTag } from "./ui/SkillTag";

export function SkillMatchContent({ data }) {
  const r = data.skill_match_results;
  if (!r) return null;
  const overallPct = Math.round((r.final_score || 0) * 100);
  const c = scoreColor(overallPct);
  const matched = r.matched_must_have || [];
  const missing = r.missing_must_have || [];
  const total = matched.length + missing.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 28, color: c.text, lineHeight: 1 }}>
            {overallPct}%
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.text, opacity: 0.7 }}>overall match</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{matched.length}</span> of{" "}
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{total}</span> must-have skills matched
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            {missing.length} skills missing from your resume
          </div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 14, padding: "14px 16px" }}>
        <ScoreBar label="Must-have match" value={r.must_have_score || 0} />
        <ScoreBar label="Nice-to-have match" value={r.nice_to_have_score || 0} />
        <ScoreBar label="Overall score" value={r.final_score || 0} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#15803d" }}>Matched</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "1px 7px", borderRadius: 99 }}>{matched.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {matched.map((s) => <SkillTag key={s} label={s} variant="matched" />)}
          </div>
        </div>
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#be123c" }}>Missing</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#be123c", background: "#ffe4e6", padding: "1px 7px", borderRadius: 99 }}>{missing.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {missing.map((s) => <SkillTag key={s} label={s} variant="missing" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

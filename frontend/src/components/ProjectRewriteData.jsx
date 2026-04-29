export function ProjectRewriteData({ data, resumeJson }) {
  const origMap = Object.fromEntries(
    (resumeJson?.projects || []).map((p) => [p.title, p.bullets])
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(data.rewritten_projects || []).map((p, i) => (
        <div key={i}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {p.title}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Original</p>
              {(origMap[p.title] || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>Rewritten</p>
              {(p.bullets || []).map((b, j) => (
                <div key={j} style={{ fontSize: 12, color: "#1e293b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 11, padding: "8px 12px", marginBottom: 4, lineHeight: 1.6 }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

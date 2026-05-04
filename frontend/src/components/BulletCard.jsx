const STAR_COLORS = {
  situation: { badge: "#475569", underline: "#cbd5e1" },
  action: { badge: "#7c3aed", underline: "#c4b5fd" },
  result: { badge: "#059669", underline: "#6ee7b7" },
};

function buildKeywordPattern(keywords) {
  if (!keywords?.length) return null;
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(${escaped.join("|")})`, "gi");
}

function highlightText(text, pattern) {
  if (!pattern || !text) return text;
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-amber-100 text-amber-800 rounded-[3px] px-[2px] font-semibold"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function countMatches(text, pattern) {
  if (!pattern || !text) return 0;
  pattern.lastIndex = 0;
  return (text.match(pattern) || []).length;
}

export function BulletCard({ bullet, index, keywords }) {
  const text = typeof bullet === "string" ? bullet : bullet.text;
  const segments = typeof bullet === "string" ? [] : bullet.star_segments || [];
  const hasSTAR = segments.length > 0;

  const pattern = buildKeywordPattern(keywords);
  const jdKeywordCount = countMatches(text, pattern);

  return (
    <div
      className={`group relative bg-white border border-[#e8edf2] rounded-xl mb-1.5 overflow-hidden transition-[border-color,box-shadow] duration-150 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.05)] hover:shadow-[0_2px_12px_-4px_rgba(15,23,42,0.1)] cursor-default`}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-violet-300 group-hover:bg-violet-700 transition-colors duration-150" />

      {/* Content */}
      <div className="pt-[14px] pb-3 pl-[19px] pr-4 relative">
        {/* STAR text — drives card height */}
        <div
          className={`transition-opacity duration-150 text-sm text-slate-800 leading-[1.75] ${hasSTAR ? "opacity-0 group-hover:opacity-100" : "invisible"}`}
        >
          {segments.map((seg, i) => {
            const c = STAR_COLORS[seg.type] || {};
            return (
              <span key={i}>
                {i > 0 && " "}
                <span style={{ borderBottom: `2px solid ${c.underline}` }}>
                  <span
                    style={{ background: c.badge }}
                    className="inline-block text-white text-[9px] font-extrabold tracking-[0.07em] uppercase rounded-[5px] px-[5px] py-[1px] mr-1 align-middle leading-[1.6]"
                  >
                    {seg.type}
                  </span>
                  {highlightText(seg.text, pattern)}
                </span>
              </span>
            );
          })}
          {segments.length === 0 && <span className="invisible">{text}</span>}
        </div>

        {/* Plain text — fades out on hover */}
        <div
          className={`absolute top-[14px] left-[19px] right-4 transition-opacity duration-150 text-sm text-slate-700 leading-[1.75] pointer-events-none opacity-100 ${hasSTAR ? "group-hover:opacity-0" : ""}`}
        >
          {highlightText(text, pattern)}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-dashed border-slate-200 px-3.5 py-[7px] flex items-center gap-2">
        {jdKeywordCount > 0 && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-[2px] shrink-0">
            • {jdKeywordCount} JD keyword{jdKeywordCount !== 1 ? "s" : ""}
          </span>
        )}
        <span className="text-[11px] font-semibold text-slate-400">
          {text.length} chars
        </span>
        <span className="flex-1" />
        <span className="text-[11px] font-bold text-slate-300 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

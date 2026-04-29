const SIDEBAR_ITEMS = [
  { node: "jd_parsing_node", label: "Job description" },
  { node: "skill_match_node", label: "Skill match" },
  { node: "project_selection_node", label: "Project selection" },
  { node: "skill_selection_node", label: "Skill selection" },
  { node: "execute_project_rewrite_node", label: "Project rewrites" },
  { node: "execute_experience_rewrite_node", label: "Experience rewrites" },
  { node: "__review__", label: "Your review" },
  { node: "__complete__", label: "Resume ready" },
];

const POST_TAILOR_STATUSES = ["tailored", "applied", "interviewing", "rejected"];

export function Sidebar({ steps, status, currentNode }) {
  const completedNodes = new Set(steps.map((s) => s.node));
  const isInterrupted = status === "interrupted";
  const isComplete = POST_TAILOR_STATUSES.includes(status);

  function getState(node) {
    if (node === "__review__") {
      if (isInterrupted) return "active";
      if (isComplete) return "done";
      return "pending";
    }
    if (node === "__complete__") return isComplete ? "done" : "pending";
    if (completedNodes.has(node)) return "done";
    if (node === currentNode) return "active";
    return "pending";
  }

  function scrollTo(node) {
    const el = document.getElementById(`step-${node}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <aside style={{ position: "sticky", top: 88 }} className="hidden lg:block self-start">
      <p
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 14,
        }}
      >
        Progress
      </p>
      <div style={{ position: "relative" }}>
        {SIDEBAR_ITEMS.map((item, i) => {
          const state = getState(item.node);
          const isLast = i === SIDEBAR_ITEMS.length - 1;
          const nextState = !isLast ? getState(SIDEBAR_ITEMS[i + 1].node) : null;
          const spineGreen = state === "done" && nextState !== null;

          return (
            <div key={item.node} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                {state === "done" && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, marginTop: 3 }} />
                )}
                {state === "active" && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "hsl(220 20% 20%)",
                      flexShrink: 0,
                      marginTop: 2,
                      boxShadow: "0 0 0 4px hsl(220 20% 20% / .12)",
                      transition: "box-shadow .25s",
                    }}
                  />
                )}
                {state === "pending" && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "transparent",
                      border: "1.5px solid #cbd5e1",
                      flexShrink: 0,
                      marginTop: 3,
                    }}
                  />
                )}
                {!isLast && (
                  <div
                    style={{
                      width: 1.5,
                      flexGrow: 1,
                      minHeight: 24,
                      background: spineGreen ? "#a7f3d0" : "#e2e8f0",
                      marginTop: 3,
                      marginBottom: 3,
                    }}
                  />
                )}
              </div>
              <button
                onClick={() => scrollTo(item.node)}
                style={{
                  paddingTop: 1,
                  paddingBottom: isLast ? 0 : 20,
                  fontSize: 13,
                  fontWeight: state === "active" ? 700 : 500,
                  color: state === "active" ? "#0f172a" : state === "done" ? "#475569" : "#94a3b8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: `1px 0 ${isLast ? 0 : 20}px`,
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

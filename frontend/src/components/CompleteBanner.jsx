import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileDown, Copy, Check } from "lucide-react";

export function CompleteBanner({ pdfKey, latexContent }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!latexContent) return;
    await navigator.clipboard.writeText(latexContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      id="step-__complete__"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ scrollMarginTop: 88 }}
    >
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 20,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, background: "#dcfce7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles style={{ width: 20, height: 20, color: "#16a34a" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Resume tailored successfully</p>
            <p style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Your tailored resume is ready to download</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {latexContent && (
            <button
              onClick={handleCopy}
              style={{
                height: 38, padding: "0 14px", borderRadius: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
                background: "#fff", color: "#15803d", border: "1px solid #bbf7d0",
              }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              {copied ? "Copied!" : "Copy LaTeX"}
            </button>
          )}
          {pdfKey && (
            <button
              style={{
                height: 38, padding: "0 16px", borderRadius: 12, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
                background: "#16a34a", color: "#fff",
              }}
            >
              <FileDown style={{ width: 14, height: 14 }} />
              Download PDF
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

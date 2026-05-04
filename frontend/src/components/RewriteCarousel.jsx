import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { BulletCard } from "./BulletCard";

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
};

export function RewriteCarousel({
  items,
  renderTitle,
  getOriginalBullets,
  jdKeywords,
  label,
}) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [bumpKey, setBumpKey] = useState(0);
  const [showCompare, setShowCompare] = useState(false);

  if (!items?.length) return null;

  const current = items[idx];
  const originalBullets = getOriginalBullets(current);

  function goTo(newIdx) {
    setDir(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
    setBumpKey((k) => k + 1);
    setShowCompare(false);
  }

  const navBtnClass = (disabled) =>
    `w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center transition-opacity ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <div>
      {/* Stepper header */}
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-sm font-bold text-slate-800">
          {items.length} {label}
          {items.length !== 1 ? "s" : ""} rewritten
        </p>
        {items.length > 1 && (
          <div className="flex gap-1.5 items-center">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full border-none cursor-pointer p-0 transition-all duration-200"
                style={{
                  width: i === idx ? 20 : 8,
                  height: 8,
                  background: i === idx ? "hsl(220 20% 20%)" : "#cbd5e1",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence custom={dir} mode="wait">
        <motion.div
          key={bumpKey}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white border border-[hsl(220_10%_90%)] rounded-[20px] shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          {/* Card header */}
          <div className="px-5 pt-[18px] pb-4 border-b border-[hsl(220_10%_95%)] flex items-start justify-between">
            <div>
              <p className="font-display text-lg font-bold text-slate-950 leading-[1.25]">
                {renderTitle(current)}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {label} {idx + 1} of {items.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => idx > 0 && goTo(idx - 1)}
                disabled={idx === 0}
                className={navBtnClass(idx === 0)}
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                onClick={() => idx < items.length - 1 && goTo(idx + 1)}
                disabled={idx === items.length - 1}
                className={navBtnClass(idx === items.length - 1)}
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Compare toggle */}
          {originalBullets.length > 0 && (
            <div className="px-5 pt-2.5">
              <button
                onClick={() => setShowCompare((c) => !c)}
                className={`inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[11px] font-semibold ${showCompare ? "text-slate-950" : "text-slate-400"}`}
              >
                {showCompare ? (
                  <X className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                {showCompare ? "Hide original" : "Compare with original"}
              </button>
            </div>
          )}

          {/* Bullets */}
          <div className="px-5 py-4">
            {showCompare ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-2">
                    Original
                  </p>
                  {originalBullets.map((b, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-[11px] px-3.5 py-2.5 mb-1.5 leading-[1.65]"
                    >
                      {b}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-600 mb-2">
                    Rewritten
                  </p>
                  {(current?.bullets || []).map((b, i) => (
                    <BulletCard
                      key={i}
                      bullet={b}
                      index={i}
                      keywords={jdKeywords}
                    />
                  ))}
                </div>
              </div>
            ) : (
              (current?.bullets || []).map((b, i) => (
                <BulletCard
                  key={i}
                  bullet={b}
                  index={i}
                  originalText={originalBullets[i]}
                  keywords={jdKeywords}
                />
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

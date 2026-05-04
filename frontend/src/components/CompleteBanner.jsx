import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, FileDown, Copy, Check, FileText } from "lucide-react";
import { TokenUsageCard } from "./TokenUsageCard";

export function CompleteBanner({ pdfKey, latexContent, coverLetter, tokenUsageLog }) {
  const [copied, setCopied] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

  async function handleCopy() {
    if (!latexContent) return;
    await navigator.clipboard.writeText(latexContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyCoverLetter() {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  }

  return (
    <>
    <motion.div
      id="step-__complete__"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="scroll-mt-[88px]"
    >
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-green-800">
              Resume tailored successfully
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Your tailored resume is ready to download
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {latexContent && (
            <button
              onClick={handleCopy}
              className="h-[38px] px-3.5 rounded-xl flex items-center gap-1.5 text-[13px] font-bold bg-white text-green-700 border border-green-200 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy LaTeX"}
            </button>
          )}
          {pdfKey && (
            <button className="h-[38px] px-4 rounded-xl flex items-center gap-1.5 text-[13px] font-bold bg-green-600 text-white border-none cursor-pointer">
              <FileDown className="w-3.5 h-3.5" />
              Download PDF
            </button>
          )}
        </div>
      </div>
    </motion.div>
    <TokenUsageCard tokenUsageLog={tokenUsageLog} />
    {coverLetter && (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="scroll-mt-[88px] mt-3"
      >
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-blue-800">
                Cover letter created
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Ready to copy and paste
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyCoverLetter}
            className="h-[38px] px-3.5 rounded-xl flex items-center gap-1.5 text-[13px] font-bold bg-white text-blue-700 border border-blue-200 cursor-pointer"
          >
            {copiedCoverLetter ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedCoverLetter ? "Copied!" : "Copy cover letter"}
          </button>
        </div>
      </motion.div>
    )}
    </>
  );
}

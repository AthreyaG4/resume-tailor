import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

function isExpired(cert) {
  if (!cert.expiry_date) return false;
  return new Date(cert.expiry_date) < new Date();
}

function CertificationCard({ cert, isSelected, onToggle }) {
  const expired = isExpired(cert);
  const selectedClass =
    "bg-white border border-emerald-200 border-l-[3px] border-l-emerald-500";
  const deselectedClass =
    "bg-slate-50 border border-slate-100 opacity-45 hover:opacity-60";

  return (
    <div
      onClick={onToggle}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected ? selectedClass : deselectedClass
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p
            className={`font-display text-sm font-bold text-slate-950 leading-[1.25] ${
              !isSelected ? "line-through text-slate-400" : ""
            }`}
          >
            {cert.name}
          </p>
          {expired ? (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Expired
            </span>
          ) : cert.expiry_date ? (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Valid
            </span>
          ) : null}
        </div>

        <p className="text-[12px] text-slate-500 mb-1.5">{cert.issuing_organization}</p>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {cert.issue_date && <span>Issued {cert.issue_date}</span>}
          {cert.expiry_date && (
            <>
              <span className="text-slate-200">·</span>
              <span>Expires {cert.expiry_date}</span>
            </>
          )}
          {cert.credential_url && (
            <>
              <span className="text-slate-200">·</span>
              <a
                href={cert.credential_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                Verify <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicationCard({ pub, isSelected, onToggle }) {
  const selectedClass =
    "bg-white border border-emerald-200 border-l-[3px] border-l-emerald-500";
  const deselectedClass =
    "bg-slate-50 border border-slate-100 opacity-45 hover:opacity-60";

  return (
    <div
      onClick={onToggle}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected ? selectedClass : deselectedClass
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p
            className={`font-display text-sm font-bold text-slate-950 leading-[1.25] ${
              !isSelected ? "line-through text-slate-400" : ""
            }`}
          >
            {pub.title}
          </p>
          {pub.url && (
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {pub.authors && pub.authors.length > 0 && (
          <p className="text-[12px] text-slate-500 mb-1">
            {pub.authors.join(", ")}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-1.5">
          {pub.publication_venue && <span>{pub.publication_venue}</span>}
          {pub.publication_date && (
            <>
              {pub.publication_venue && <span className="text-slate-200">·</span>}
              <span>{pub.publication_date}</span>
            </>
          )}
        </div>

        {pub.description && (
          <p className="text-[12px] text-slate-400 leading-[1.55] line-clamp-2">
            {pub.description}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-2">
      {children}
    </p>
  );
}

export function CertificationPublicationContent({
  data,
  interruptId,
  onSubmit,
  isSubmitting,
}) {
  const certifications = data.certifications || [];
  const publications = data.publications || [];

  const [selectedCertIndices, setSelectedCertIndices] = useState(
    () => new Set(certifications.map((c, i) => (isExpired(c) ? null : i)).filter((i) => i !== null)),
  );
  const [selectedPubIndices, setSelectedPubIndices] = useState(
    () => new Set(publications.map((_, i) => i)),
  );

  function toggleCert(i) {
    setSelectedCertIndices((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function togglePub(i) {
    setSelectedPubIndices((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function handleConfirm() {
    onSubmit({
      responses: [
        {
          interrupt_id: interruptId,
          approved: true,
          feedback: "",
          selected_certification_indices: [...selectedCertIndices].sort((a, b) => a - b),
          selected_publication_indices: [...selectedPubIndices].sort((a, b) => a - b),
        },
      ],
    });
  }

  const totalSelected = selectedCertIndices.size + selectedPubIndices.size;

  return (
    <div>
      {certifications.length > 0 && (
        <div className="mb-4">
          <SectionLabel>Certifications</SectionLabel>
          <div className="flex flex-col gap-2">
            {certifications.map((cert, i) => (
              <CertificationCard
                key={i}
                cert={cert}
                isSelected={selectedCertIndices.has(i)}
                onToggle={() => toggleCert(i)}
              />
            ))}
          </div>
        </div>
      )}

      {publications.length > 0 && (
        <div className="mb-4">
          <SectionLabel>Publications</SectionLabel>
          <div className="flex flex-col gap-2">
            {publications.map((pub, i) => (
              <PublicationCard
                key={i}
                pub={pub}
                isSelected={selectedPubIndices.has(i)}
                onToggle={() => togglePub(i)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-medium text-slate-400">
          {totalSelected > 0
            ? `${totalSelected} item${totalSelected !== 1 ? "s" : ""} will be included`
            : "Select at least one item to continue"}
        </p>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="h-9 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5 border-none transition-all duration-150 bg-[hsl(220_20%_18%)] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Confirm selection
        </button>
      </div>
    </div>
  );
}

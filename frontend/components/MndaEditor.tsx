"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  buildFilledMnda,
  defaultFormData,
  downloadFilename,
  type MndaFormData,
} from "@/lib/mnda";

interface Props {
  standardTerms: string;
}

type Group = "Parties" | "Agreement";

interface FieldConfig {
  id: keyof MndaFormData;
  label: string;
  group: Group;
  placeholder?: string;
  helper?: string;
  type?: "text" | "date" | "textarea" | "number";
}

const FIELDS: FieldConfig[] = [
  { id: "party1Name", label: "Party 1 — Company", group: "Parties", placeholder: "Acme Inc." },
  { id: "party1Signer", label: "Party 1 — Signer", group: "Parties", placeholder: "Jane Doe" },
  { id: "party1Title", label: "Party 1 — Title", group: "Parties", placeholder: "Chief Executive Officer" },
  { id: "party1Notice", label: "Party 1 — Notice Address", group: "Parties", placeholder: "notices@acme.com" },
  { id: "party2Name", label: "Party 2 — Company", group: "Parties", placeholder: "Widget Co." },
  { id: "party2Signer", label: "Party 2 — Signer", group: "Parties", placeholder: "John Roe" },
  { id: "party2Title", label: "Party 2 — Title", group: "Parties", placeholder: "Chief Executive Officer" },
  { id: "party2Notice", label: "Party 2 — Notice Address", group: "Parties", placeholder: "notices@widget.co" },
  {
    id: "purpose",
    label: "Purpose",
    group: "Agreement",
    type: "textarea",
    helper: "How Confidential Information may be used.",
  },
  { id: "effectiveDate", label: "Effective Date", group: "Agreement", type: "date" },
  {
    id: "mndaTermYears",
    label: "MNDA Term (years)",
    group: "Agreement",
    type: "number",
    helper: "How long this MNDA remains in effect.",
  },
  {
    id: "confidentialityTermYears",
    label: "Term of Confidentiality (years)",
    group: "Agreement",
    type: "number",
    helper: "How long Confidential Information is protected.",
  },
  { id: "governingLaw", label: "Governing Law (state)", group: "Agreement", placeholder: "Delaware" },
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    group: "Agreement",
    placeholder: 'e.g., "courts located in New Castle, DE"',
  },
];

const GROUPS: Group[] = ["Parties", "Agreement"];

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export function MndaEditor({ standardTerms }: Props) {
  const [form, setForm] = useState<MndaFormData>(defaultFormData);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLElement | null>(null);

  const filled = useMemo(
    () => buildFilledMnda(standardTerms, form),
    [standardTerms, form],
  );

  const update = (id: keyof MndaFormData, value: string) =>
    setForm((prev) => ({ ...prev, [id]: value }));

  const handleDownloadPdf = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    try {
      // Dynamic import keeps jsPDF (+ html2canvas) out of the initial bundle.
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      // Letter @ 72dpi = 612x792pt; 48pt margins leave a 516x696 content box.
      await doc.html(previewRef.current, {
        margin: [48, 48, 48, 48],
        autoPaging: "text",
        width: 516,
        windowWidth: 800,
        html2canvas: { scale: 0.75, useCORS: true },
      });
      doc.save(downloadFilename(form, "pdf"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {GROUPS.map((group) => (
            <fieldset key={group} className="space-y-3">
              <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.filter((f) => f.group === group).map((field) => (
                  <label
                    key={field.id}
                    className={`block ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
                  >
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {field.label}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        className={inputClass}
                        rows={3}
                        placeholder={field.placeholder}
                        value={form[field.id]}
                        onChange={(e) => update(field.id, e.target.value)}
                      />
                    ) : (
                      <input
                        className={inputClass}
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        value={form[field.id]}
                        onChange={(e) => update(field.id, e.target.value)}
                      />
                    )}
                    {field.helper && (
                      <span className="mt-1 block text-xs text-slate-500">
                        {field.helper}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setForm(defaultFormData)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              {isExporting ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Preview
          </h2>
          <span className="text-xs text-slate-400">
            Based on CommonPaper Mutual NDA v1.0 (CC BY 4.0)
          </span>
        </div>
        <article
          ref={previewRef}
          className="prose prose-sm prose-slate max-w-none"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{filled}</ReactMarkdown>
        </article>
      </section>
    </div>
  );
}

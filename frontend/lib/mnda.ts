export interface MndaFormData {
  party1Name: string;
  party1Signer: string;
  party1Title: string;
  party1Notice: string;
  party2Name: string;
  party2Signer: string;
  party2Title: string;
  party2Notice: string;
  purpose: string;
  effectiveDate: string;
  mndaTermYears: string;
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
}

export const defaultFormData: MndaFormData = {
  party1Name: "",
  party1Signer: "",
  party1Title: "",
  party1Notice: "",
  party2Name: "",
  party2Signer: "",
  party2Title: "",
  party2Notice: "",
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().slice(0, 10),
  mndaTermYears: "1",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
};

export function buildCoverPage(d: MndaFormData): string {
  const placeholder = (v: string, fallback: string) =>
    v.trim() === "" ? `_${fallback}_` : v;
  const term =
    d.mndaTermYears.trim() === ""
      ? "_[specify term]_"
      : `${d.mndaTermYears} year(s) from the Effective Date`;
  const confidentiality =
    d.confidentialityTermYears.trim() === ""
      ? "_[specify term]_"
      : `${d.confidentialityTermYears} year(s) from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`;

  return `# Mutual Non-Disclosure Agreement

This Mutual Non-Disclosure Agreement (the "MNDA") consists of this Cover Page and the Common Paper Mutual NDA Standard Terms Version 1.0, which are incorporated by reference.

## Purpose
${placeholder(d.purpose, "[fill in purpose]")}

## Effective Date
${placeholder(d.effectiveDate, "[fill in date]")}

## MNDA Term
Expires ${term}.

## Term of Confidentiality
${confidentiality}

## Governing Law & Jurisdiction
Governing Law: ${placeholder(d.governingLaw, "[fill in state]")}

Jurisdiction: ${placeholder(d.jurisdiction, "[fill in city/county and state]")}

## Parties

By signing below, each party agrees to enter into this MNDA as of the Effective Date.

|                | Party 1 | Party 2 |
| -------------- | ------- | ------- |
| Company        | ${placeholder(d.party1Name, "[fill in]")} | ${placeholder(d.party2Name, "[fill in]")} |
| Signer         | ${placeholder(d.party1Signer, "[fill in]")} | ${placeholder(d.party2Signer, "[fill in]")} |
| Title          | ${placeholder(d.party1Title, "[fill in]")} | ${placeholder(d.party2Title, "[fill in]")} |
| Notice Address | ${placeholder(d.party1Notice, "[fill in]")} | ${placeholder(d.party2Notice, "[fill in]")} |
| Signature      |         |         |
| Date           |         |         |
`;
}

// Replace <span class="coverpage_link">VAR</span> tokens in the standard terms
// with the user's values, and strip helper HTML (<label>, residual <span>).
export function fillStandardTerms(
  standardTerms: string,
  d: MndaFormData,
): string {
  const values: Record<string, string> = {
    Purpose: d.purpose || "[Purpose]",
    "Effective Date": d.effectiveDate || "[Effective Date]",
    "MNDA Term":
      d.mndaTermYears.trim() === ""
        ? "[MNDA Term]"
        : `${d.mndaTermYears} year(s)`,
    "Term of Confidentiality":
      d.confidentialityTermYears.trim() === ""
        ? "[Term of Confidentiality]"
        : `${d.confidentialityTermYears} year(s)`,
    "Governing Law": d.governingLaw || "[Governing Law]",
    Jurisdiction: d.jurisdiction || "[Jurisdiction]",
  };

  return standardTerms
    .replace(
      /<span class="coverpage_link">([^<]+)<\/span>/g,
      (_, label: string) => values[label.trim()] ?? label,
    )
    .replace(/<label>[^<]*<\/label>/g, "")
    .replace(/<span[^>]*>([^<]*)<\/span>/g, "$1");
}

export function buildFilledMnda(
  standardTerms: string,
  d: MndaFormData,
): string {
  const coverPage = buildCoverPage(d);
  const filledTerms = fillStandardTerms(standardTerms, d);
  return `${coverPage}\n\n---\n\n${filledTerms}`;
}

export function downloadFilename(
  d: MndaFormData,
  ext: "md" | "pdf" = "pdf",
): string {
  const slug = (s: string) =>
    s.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "Party";
  return `Mutual-NDA-${slug(d.party1Name)}-${slug(d.party2Name)}.${ext}`;
}

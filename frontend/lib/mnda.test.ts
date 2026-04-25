import { describe, expect, it } from "vitest";
import {
  buildCoverPage,
  buildFilledMnda,
  defaultFormData,
  downloadFilename,
  fillStandardTerms,
  type MndaFormData,
} from "./mnda";

const filled: MndaFormData = {
  party1Name: "Acme Inc.",
  party1Signer: "Jane Doe",
  party1Title: "Chief Executive Officer",
  party1Notice: "legal@acme.example",
  party2Name: "Widget Co.",
  party2Signer: "John Roe",
  party2Title: "Chief Executive Officer",
  party2Notice: "legal@widget.example",
  purpose: "Evaluating a partnership.",
  effectiveDate: "2026-04-24",
  mndaTermYears: "2",
  confidentialityTermYears: "3",
  governingLaw: "Delaware",
  jurisdiction: "courts located in Wilmington, DE",
};

const empty: MndaFormData = {
  ...defaultFormData,
  // Clear even the fields that have non-empty defaults so we can assert
  // placeholder behavior in isolation.
  purpose: "",
  effectiveDate: "",
  mndaTermYears: "",
  confidentialityTermYears: "",
};

describe("defaultFormData", () => {
  it("contains every key of MndaFormData", () => {
    const keys: Array<keyof MndaFormData> = [
      "party1Name",
      "party1Signer",
      "party1Title",
      "party1Notice",
      "party2Name",
      "party2Signer",
      "party2Title",
      "party2Notice",
      "purpose",
      "effectiveDate",
      "mndaTermYears",
      "confidentialityTermYears",
      "governingLaw",
      "jurisdiction",
    ];
    for (const k of keys) expect(defaultFormData).toHaveProperty(k);
  });

  it("effectiveDate defaults to an ISO date string", () => {
    expect(defaultFormData.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("purpose has a sensible non-empty default", () => {
    expect(defaultFormData.purpose.length).toBeGreaterThan(0);
  });
});

describe("buildCoverPage", () => {
  it("renders the MNDA title", () => {
    expect(buildCoverPage(filled)).toMatch(/^# Mutual Non-Disclosure Agreement/);
  });

  it("fills Purpose, dates, term, governing law, jurisdiction", () => {
    const out = buildCoverPage(filled);
    expect(out).toContain("Evaluating a partnership.");
    expect(out).toContain("2026-04-24");
    expect(out).toContain("Expires 2 year(s) from the Effective Date.");
    expect(out).toContain("3 year(s) from the Effective Date");
    expect(out).toContain("Governing Law: Delaware");
    expect(out).toContain("Jurisdiction: courts located in Wilmington, DE");
  });

  it("fills the parties table with company, signer, title, notice", () => {
    const out = buildCoverPage(filled);
    expect(out).toContain("Acme Inc.");
    expect(out).toContain("Widget Co.");
    expect(out).toContain("Jane Doe");
    expect(out).toContain("John Roe");
    expect(out).toContain("Chief Executive Officer");
    expect(out).toContain("legal@acme.example");
    expect(out).toContain("legal@widget.example");
  });

  it("shows italic [fill in] placeholders for empty required fields", () => {
    const out = buildCoverPage(empty);
    expect(out).toContain("_[fill in purpose]_");
    expect(out).toContain("_[fill in date]_");
    expect(out).toContain("_[fill in state]_");
    expect(out).toContain("_[fill in city/county and state]_");
    expect(out).toContain("_[fill in]_");
  });

  it("shows [specify term] when term years is blank", () => {
    const out = buildCoverPage(empty);
    expect(out).toContain("_[specify term]_");
  });

  it("treats whitespace-only term years as empty", () => {
    const out = buildCoverPage({ ...filled, mndaTermYears: "   " });
    expect(out).toContain("_[specify term]_");
  });

  it("outputs a well-formed markdown table with header row", () => {
    const out = buildCoverPage(filled);
    expect(out).toMatch(/\| Party 1 \| Party 2 \|/);
    expect(out).toMatch(/\| -+ \| -+ \| -+ \|/);
  });
});

describe("fillStandardTerms", () => {
  const sample = `
1. About. The <span class="coverpage_link">Purpose</span> governs this MNDA from <span class="coverpage_link">Effective Date</span>.
2. Term. Expires after <span class="coverpage_link">MNDA Term</span>.
3. Conf. For <span class="coverpage_link">Term of Confidentiality</span>.
4. Law. Under <span class="coverpage_link">Governing Law</span> with <span class="coverpage_link">Jurisdiction</span> jurisdiction.
5. Again. <span class="coverpage_link">Purpose</span>, <span class="coverpage_link">Governing Law</span>, <span class="coverpage_link">Jurisdiction</span>.
6. Helper. <label>This is a caption</label>
7. Other span. <span class="other">keep me</span>
`;

  it("substitutes all six coverpage_link variables", () => {
    const out = fillStandardTerms(sample, filled);
    expect(out).toContain("Evaluating a partnership.");
    expect(out).toContain("2026-04-24");
    expect(out).toContain("Expires after 2 year(s)");
    expect(out).toContain("For 3 year(s)");
    expect(out).toContain("Under Delaware");
    expect(out).toContain("with courts located in Wilmington, DE jurisdiction");
  });

  it("substitutes every occurrence (not just the first)", () => {
    const out = fillStandardTerms(sample, filled);
    // "Evaluating a partnership." appears 2x in the sample template.
    expect(out.match(/Evaluating a partnership\./g)?.length).toBe(2);
    // "Delaware" appears 2x.
    expect(out.match(/Delaware/g)?.length).toBe(2);
  });

  it("strips <label>...</label> helper captions", () => {
    const out = fillStandardTerms(sample, filled);
    expect(out).not.toMatch(/<label/);
    expect(out).not.toContain("This is a caption");
  });

  it("strips residual <span> tags but preserves their inner text", () => {
    const out = fillStandardTerms(sample, filled);
    expect(out).not.toMatch(/<span/);
    expect(out).toContain("keep me");
  });

  it("leaves no raw span / label markup in the output", () => {
    const out = fillStandardTerms(sample, filled);
    expect(out).not.toMatch(/<\/?(?:span|label)/);
  });

  it("uses [VariableName] fallback when value is empty", () => {
    const out = fillStandardTerms(sample, empty);
    expect(out).toContain("[Purpose]");
    expect(out).toContain("[Effective Date]");
    expect(out).toContain("[MNDA Term]");
    expect(out).toContain("[Term of Confidentiality]");
    expect(out).toContain("[Governing Law]");
    expect(out).toContain("[Jurisdiction]");
  });

  it("preserves unknown coverpage_link labels as their inner text", () => {
    const custom = `A <span class="coverpage_link">Unknown Var</span> stays.`;
    expect(fillStandardTerms(custom, filled)).toContain("A Unknown Var stays.");
  });

  it("is idempotent — running twice produces the same output as once", () => {
    const once = fillStandardTerms(sample, filled);
    const twice = fillStandardTerms(once, filled);
    expect(twice).toBe(once);
  });

  it("preserves surrounding markdown syntax", () => {
    const md = `## Heading
- bullet <span class="coverpage_link">Purpose</span>
**bold** text`;
    const out = fillStandardTerms(md, filled);
    expect(out).toContain("## Heading");
    expect(out).toContain("- bullet Evaluating a partnership.");
    expect(out).toContain("**bold** text");
  });
});

describe("buildFilledMnda", () => {
  const curated = `# Standard Terms
1. Purpose: <span class="coverpage_link">Purpose</span>.
2. Governed by <span class="coverpage_link">Governing Law</span>.`;

  it("joins the cover page and filled standard terms with an hr separator", () => {
    const out = buildFilledMnda(curated, filled);
    expect(out).toContain("# Mutual Non-Disclosure Agreement");
    expect(out).toContain("\n\n---\n\n");
    expect(out).toContain("# Standard Terms");
  });

  it("propagates form data into both sections", () => {
    const out = buildFilledMnda(curated, filled);
    expect(out).toContain("Governing Law: Delaware"); // cover page
    expect(out).toContain("Governed by Delaware."); // standard terms
    expect(out).toContain("Acme Inc."); // cover page
    expect(out).toContain("Evaluating a partnership."); // both sections
  });

  it("never emits raw HTML into the final document", () => {
    const out = buildFilledMnda(curated, filled);
    expect(out).not.toMatch(/<(?:span|label)/i);
  });
});

describe("downloadFilename", () => {
  it("defaults to a .pdf extension", () => {
    expect(downloadFilename(filled)).toBe(
      "Mutual-NDA-Acme-Inc-Widget-Co.pdf",
    );
  });

  it("accepts an explicit md extension", () => {
    expect(downloadFilename(filled, "md")).toBe(
      "Mutual-NDA-Acme-Inc-Widget-Co.md",
    );
  });

  it("slugifies names: spaces and punctuation collapse to single hyphens", () => {
    const d = { ...filled, party1Name: "Foo & Bar, LLC", party2Name: "Baz!Qux" };
    expect(downloadFilename(d)).toBe("Mutual-NDA-Foo-Bar-LLC-Baz-Qux.pdf");
  });

  it("trims leading and trailing hyphens from the slug", () => {
    const d = { ...filled, party1Name: "  -Foo-  ", party2Name: "!Bar!" };
    expect(downloadFilename(d)).toBe("Mutual-NDA-Foo-Bar.pdf");
  });

  it('falls back to "Party" when a name is empty or punctuation-only', () => {
    const d = { ...filled, party1Name: "", party2Name: "!!!" };
    expect(downloadFilename(d)).toBe("Mutual-NDA-Party-Party.pdf");
  });

  it("preserves digits in names", () => {
    const d = { ...filled, party1Name: "Co 2", party2Name: "Team 42" };
    expect(downloadFilename(d)).toBe("Mutual-NDA-Co-2-Team-42.pdf");
  });
});

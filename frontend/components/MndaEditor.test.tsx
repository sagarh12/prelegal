import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MndaEditor } from "./MndaEditor";

const SAMPLE_STANDARD_TERMS = `# Standard Terms
1. About. The <span class="coverpage_link">Purpose</span> governs from <span class="coverpage_link">Effective Date</span>.
2. Law. Under <span class="coverpage_link">Governing Law</span> in <span class="coverpage_link">Jurisdiction</span>.`;

// Mock jsPDF so we can assert the download handler wires up correctly without
// actually rasterizing the DOM to a PDF in a jsdom environment.
const saveMock = vi.fn();
const htmlMock = vi.fn().mockResolvedValue(undefined);
vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    html: htmlMock,
    save: saveMock,
  })),
}));

beforeEach(() => {
  saveMock.mockClear();
  htmlMock.mockClear();
});

describe("<MndaEditor />", () => {
  it("renders every form field grouped under Parties and Agreement", async () => {
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);
    expect(
      screen.getByRole("group", { name: /Parties/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: /Agreement/i }),
    ).toBeInTheDocument();

    for (const label of [
      "Party 1 — Company",
      "Party 1 — Signer",
      "Party 1 — Title",
      "Party 1 — Notice Address",
      "Party 2 — Company",
      "Party 2 — Signer",
      "Party 2 — Title",
      "Party 2 — Notice Address",
      "Purpose",
      "Effective Date",
      "MNDA Term (years)",
      "Term of Confidentiality (years)",
      "Governing Law (state)",
      "Jurisdiction",
    ]) {
      expect(screen.getByLabelText(new RegExp(label, "i"))).toBeInTheDocument();
    }
  });

  it("shows a Download PDF button and a Reset button", () => {
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);
    expect(
      screen.getByRole("button", { name: /Download PDF/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reset/i }),
    ).toBeInTheDocument();
  });

  it("renders the filled cover page + standard terms in the preview on mount", () => {
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);
    // The default form has a non-empty Purpose and today's Effective Date,
    // so the preview should contain the MNDA heading and the standard-terms heading.
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Standard Terms" }),
    ).toBeInTheDocument();
  });

  it("updates the preview live when a field changes", async () => {
    const user = userEvent.setup();
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);

    const law = screen.getByLabelText(/Governing Law/i);
    await user.clear(law);
    await user.type(law, "California");

    // Governing Law appears in both the cover page ("Governing Law: California")
    // and the substituted standard terms body ("Under California in ...").
    expect(
      await screen.findByText(/Governing Law: California/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Under California in/)).toBeInTheDocument();
  });

  it("propagates party-name inputs into the cover-page parties table", async () => {
    const user = userEvent.setup();
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);

    await user.type(screen.getByLabelText(/Party 1 — Company/i), "Acme Inc.");
    await user.type(
      screen.getByLabelText(/Party 2 — Company/i),
      "Widget Co.",
    );

    expect(await screen.findByRole("cell", { name: "Acme Inc." })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Widget Co." })).toBeInTheDocument();
  });

  it("strips raw HTML from the standard-terms source so no <span> leaks into the DOM", () => {
    const { container } = render(
      <MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />,
    );
    // The raw source contains <span class="coverpage_link">...</span>; after
    // substitution none of those spans should exist in the rendered preview.
    expect(container.innerHTML).not.toMatch(/class="coverpage_link"/);
  });

  it("Reset button restores default form values", async () => {
    const user = userEvent.setup();
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);

    const law = screen.getByLabelText(/Governing Law/i) as HTMLInputElement;
    await user.type(law, "California");
    expect(law.value).toBe("California");

    await user.click(screen.getByRole("button", { name: /Reset/i }));
    expect(law.value).toBe("");
  });

  it("clicking Download PDF invokes jsPDF.html and save with the slugified filename", async () => {
    const user = userEvent.setup();
    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);

    await user.type(screen.getByLabelText(/Party 1 — Company/i), "Acme Inc.");
    await user.type(screen.getByLabelText(/Party 2 — Company/i), "Widget Co.");
    await user.click(screen.getByRole("button", { name: /Download PDF/i }));

    // jsPDF was constructed and .html(...) was called with the preview element.
    expect(htmlMock).toHaveBeenCalledTimes(1);
    const [target, options] = htmlMock.mock.calls[0];
    expect(target).toBeInstanceOf(HTMLElement);
    expect(options).toMatchObject({ autoPaging: "text" });

    // After html() resolved, .save(filename) was called with the slug.
    expect(saveMock).toHaveBeenCalledWith(
      "Mutual-NDA-Acme-Inc-Widget-Co.pdf",
    );
  });

  it("Download PDF button shows a loading state while exporting", async () => {
    const user = userEvent.setup();
    // Use a pending jsPDF.html() so the button stays in its loading state.
    let resolveHtml: (() => void) | undefined;
    htmlMock.mockImplementationOnce(
      () => new Promise<void>((r) => (resolveHtml = r)),
    );

    render(<MndaEditor standardTerms={SAMPLE_STANDARD_TERMS} />);
    const btn = screen.getByRole("button", {
      name: /Download PDF/i,
    }) as HTMLButtonElement;
    await user.click(btn);

    // Loading state: button disabled and label updated.
    const loadingBtn = (await screen.findByRole("button", {
      name: /Generating PDF/i,
    })) as HTMLButtonElement;
    expect(loadingBtn).toBeDisabled();

    resolveHtml?.();
  });
});

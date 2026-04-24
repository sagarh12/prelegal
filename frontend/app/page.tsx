import { MndaEditor } from "@/components/MndaEditor";
import { loadStandardTerms } from "@/lib/mnda.server";

export default function Page() {
  const standardTerms = loadStandardTerms();

  return (
    <main className="mx-auto max-w-7xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Mutual NDA Creator</h1>
        <p className="text-sm text-slate-600">
          Fill in the form on the left. The completed NDA updates on the right
          and can be downloaded as a markdown file.
        </p>
      </header>
      <MndaEditor standardTerms={standardTerms} />
    </main>
  );
}

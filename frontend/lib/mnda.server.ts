import "server-only";
import fs from "node:fs";
import path from "node:path";

// Read the curated Common Paper Mutual NDA standard terms from the repo-level
// templates/ directory (maintained by PL-2). Must only be called from server
// code — importing this file into a client component breaks the build.
export function loadStandardTerms(): string {
  const filepath = path.join(
    process.cwd(),
    "..",
    "templates",
    "mutual-nda.md",
  );
  return fs.readFileSync(filepath, "utf8");
}

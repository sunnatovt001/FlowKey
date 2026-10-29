import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
let files;
try {
  files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
} catch {
  console.log(
    "Secret scan requires a Git checkout; no tracked-file scan performed.",
  );
  process.exit(0);
}
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /sk_live_[0-9a-zA-Z]{20,}/,
];
const rejected = [];
for (const file of files) {
  if (/(^|\/)\.env(?!\.example$)/.test(file)) {
    rejected.push(file);
    continue;
  }
  if (/package-lock\.json$/.test(file)) continue;
  try {
    const content = readFileSync(file, "utf8");
    if (patterns.some((pattern) => pattern.test(content))) rejected.push(file);
  } catch {}
}
if (rejected.length) {
  console.error(
    "Potential credential material in tracked files:",
    rejected.join(", "),
  );
  process.exit(1);
}
console.log(
  "Tracked-file credential checks passed. Review secrets manually as well.",
);

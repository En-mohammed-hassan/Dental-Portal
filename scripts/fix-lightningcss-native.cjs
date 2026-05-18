/**
 * Next.js webpack can fail to resolve `lightningcss-win32-x64-msvc` and falls back to
 * `lightningcss/lightningcss.win32-x64-msvc.node`, which optional installs omit.
 * Copy the platform binary into place after install on Windows x64.
 */
const fs = require("fs");
const path = require("path");

if (process.platform !== "win32" || process.arch !== "x64") {
  process.exit(0);
}

const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "node_modules",
  "lightningcss-win32-x64-msvc",
  "lightningcss.win32-x64-msvc.node",
);
const dest = path.join(
  root,
  "node_modules",
  "lightningcss",
  "lightningcss.win32-x64-msvc.node",
);

if (!fs.existsSync(src)) {
  console.warn(
    "[fix-lightningcss-native] Missing lightningcss-win32-x64-msvc; run: npm install --include=optional",
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);

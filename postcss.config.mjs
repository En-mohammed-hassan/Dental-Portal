import path from "node:path";
import { fileURLToPath } from "node:url";

/** Elkood project root — PostCSS/Tailwind scan from here, not `Desktop/my-apps`. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [["@tailwindcss/postcss", { base: projectRoot }]],
};

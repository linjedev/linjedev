/**
 * Pre-build sanity check for build-time public env vars.
 *
 * Some NEXT_PUBLIC_* vars are inlined into the client bundle by Next.js at
 * build time, so they must be set when `next build` runs (not just at runtime).
 * Missing ones don't fail the build — most have library defaults — but they
 * surface as opaque runtime 401s / blank panes that are painful to diagnose.
 *
 * This script prints actionable warnings instead.
 */

import { existsSync, readFileSync } from "node:fs";

const checks = [
    {
        name: "NEXT_PUBLIC_CESIUM_ION_TOKEN",
        why: "Cesium ships a built-in default Ion token, but Cesium periodically revokes it. Without your own token, base imagery and world terrain may return 401 Unauthorized at runtime.",
        how: "Get a free token at https://ion.cesium.com and set NEXT_PUBLIC_CESIUM_ION_TOKEN before building (e.g. in .env).",
    },
];

const envFileValues = readEnvFiles([".env.local", ".env.production", ".env"]);
const missing = checks.filter(c => !process.env[c.name] && !envFileValues.has(c.name));
if (missing.length === 0) process.exit(0);

const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
console.warn(yellow("\n⚠  Build-time env vars not set:"));
for (const c of missing) {
    console.warn(yellow(`\n  ${c.name}`));
    console.warn(`    ${c.why}`);
    console.warn(`    Fix: ${c.how}`);
}
console.warn(yellow("\nContinuing build — these are warnings, not errors.\n"));

function readEnvFiles(paths) {
    const values = new Map();
    for (const path of paths) {
        if (!existsSync(path)) continue;
        const content = readFileSync(path, "utf8");
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eq = trimmed.indexOf("=");
            if (eq <= 0) continue;
            values.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
        }
    }
    return values;
}

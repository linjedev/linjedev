import { execSync } from "child_process";
import fs from "fs";

function loadEnv(file, { override = false } = {}) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (!match) continue;
        const key = match[1];
        if (!override && process.env[key] !== undefined) continue;
        let value = match[2] || "";
        if (
            (value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}

function run(command) {
    execSync(command, { stdio: "inherit", shell: true });
}

loadEnv(".env");
loadEnv(".env.local", { override: true });

const edition = (process.env.NEXT_PUBLIC_WWV_EDITION || "local").trim().toLowerCase();

if (edition !== "demo") {
    run("node scripts/boot-db.mjs");
    loadEnv(".env", { override: true });
    const bootedDatabaseUrl = process.env.DATABASE_URL;
    loadEnv(".env.local", { override: true });
    if (bootedDatabaseUrl) process.env.DATABASE_URL = bootedDatabaseUrl;
    run("node scripts/safe-db-push.mjs");
}

run("npx prisma generate");
run("node scripts/copy-cesium.mjs");
run("node scripts/sync-local-plugins.mjs");

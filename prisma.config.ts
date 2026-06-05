import fs from "fs";
import path from "path";

let dbUrl = process.env.DATABASE_URL;

function readDatabaseUrl(fileName: string) {
    const envPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(envPath)) return null;
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^DATABASE_URL=["']?(.*?)["']?$/m);
    return match?.[1]?.trim() ?? null;
}

if (!dbUrl) {
    try {
        dbUrl = readDatabaseUrl(".env") ?? undefined;
        dbUrl = readDatabaseUrl(".env.local") ?? dbUrl;
    } catch {
        // Ignore; Prisma will report a missing datasource URL.
    }
}

export default {
    datasource: {
        url: dbUrl,
    },
};

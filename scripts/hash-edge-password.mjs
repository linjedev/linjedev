import { pbkdf2Sync, randomBytes } from "crypto";

const password = process.argv[2];

if (!password) {
    console.error("Usage: pnpm edge:hash-password <password>");
    process.exit(1);
}

const iterations = 210_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");

console.log(`pbkdf2-sha256$${iterations}$${salt.toString("base64url")}$${hash.toString("base64url")}`);

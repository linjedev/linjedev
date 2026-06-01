import { createHmac, timingSafeEqual } from "crypto";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
    return process.env.AUTH_SECRET
        ?? process.env.NEXTAUTH_SECRET
        ?? "linje-track-local-captcha";
}

function encode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
    return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export interface CaptchaChallenge {
    question: string;
    token: string;
}

export function createCaptchaChallenge(): CaptchaChallenge {
    const left = Math.floor(Math.random() * 8) + 2;
    const right = Math.floor(Math.random() * 8) + 2;
    const expires = Date.now() + CAPTCHA_TTL_MS;
    const payload = JSON.stringify({ answer: left + right, expires });
    const encoded = encode(payload);

    return {
        question: `${left} + ${right}`,
        token: `${encoded}.${sign(encoded)}`,
    };
}

export function verifyCaptcha(token: string, answer: string): boolean {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;

    const expected = sign(payload);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length) return false;
    if (!timingSafeEqual(providedBuffer, expectedBuffer)) return false;

    try {
        const parsed = JSON.parse(decode(payload)) as { answer?: number; expires?: number };
        if (!parsed.expires || Date.now() > parsed.expires) return false;
        return String(parsed.answer) === answer.trim();
    } catch {
        return false;
    }
}

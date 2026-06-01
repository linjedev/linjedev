"use server";

import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/db";

interface RegisterResult {
    success: boolean;
    message?: string;
    error?: string;
}

function normalizeEmail(value: FormDataEntryValue | null): string {
    return String(value ?? "").trim().toLowerCase();
}

/** Create or refresh a pending access request. Approval is handled by admins. */
export async function requestAccessAction(formData: FormData): Promise<RegisterResult> {
    const name = String(formData.get("name") ?? "").trim();
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (!name || !email || !password) {
        return { success: false, error: "All fields are required." };
    }
    if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." };
    }
    if (password !== confirm) {
        return { success: false, error: "Passwords do not match." };
    }

    const hasAdmin = await prisma.user.count({
        where: { role: { in: ["admin", "demo-admin"] } },
    });
    if (hasAdmin === 0) {
        return { success: false, error: "Create the admin account first." };
    }

    const hashedPassword = hashSync(password, 12);
    const existing = await prisma.user.findFirst({ where: { email } });

    if (existing?.role === "admin" || existing?.role === "demo-admin") {
        return { success: false, error: "Use the admin login for this account." };
    }

    if (existing?.status === "approved") {
        return { success: true, message: "Access is already approved. You can sign in now." };
    }

    if (existing) {
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                name,
                hashedPassword,
                status: "pending",
                requestedAt: new Date(),
                approvedAt: null,
                approvedById: null,
            },
        });
        return { success: true, message: "Access request refreshed. An admin can approve it from the admin panel." };
    }

    await prisma.user.create({
        data: {
            name,
            email,
            hashedPassword,
            role: "user",
            status: "pending",
        },
    });

    return { success: true, message: "Access request sent. You can sign in after an admin approves it." };
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { DEMO_ADMIN_ROLE } from "@/core/edition";
import { prisma } from "@/lib/db";

async function requireAdmin() {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "admin" && role !== DEMO_ADMIN_ROLE) {
        throw new Error("Admin access required.");
    }
    return session as NonNullable<typeof session>;
}

export async function approveUserAction(formData: FormData) {
    const session = await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    await prisma.user.updateMany({
        where: {
            id: userId,
            role: { notIn: ["admin", "demo-admin"] },
        },
        data: {
            status: "approved",
            approvedAt: new Date(),
            approvedById: session.user?.id,
        },
    });
    revalidatePath("/admin");
}

export async function denyUserAction(formData: FormData) {
    await requireAdmin();
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    await prisma.user.updateMany({
        where: {
            id: userId,
            role: { notIn: ["admin", "demo-admin"] },
        },
        data: {
            status: "denied",
            approvedAt: null,
            approvedById: null,
        },
    });
    revalidatePath("/admin");
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Shield, X } from "lucide-react";
import { auth } from "@/lib/auth";
import { DEMO_ADMIN_ROLE } from "@/core/edition";
import { prisma } from "@/lib/db";
import { approveUserAction, denyUserAction } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

function statusClass(status: string): string {
    if (status === "approved") return `${styles.status} ${styles.approved}`;
    if (status === "denied") return `${styles.status} ${styles.denied}`;
    return `${styles.status} ${styles.pending}`;
}

export default async function AdminPage() {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "admin" && role !== DEMO_ADMIN_ROLE) {
        redirect("/login?next=/admin");
    }

    const users = await prisma.user.findMany({
        where: { role: { notIn: ["admin", "demo-admin"] } },
        orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            requestedAt: true,
        },
    });

    const pendingCount = users.filter(user => user.status === "pending").length;

    return (
      <main className={styles.shell}>
        <section className={styles.panel}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <div className={styles.mark}><Shield size={20} /></div>
              <div>
                <h1 className={styles.title}>Linje.track Admin</h1>
                <p className={styles.subtitle}>{pendingCount} pending access request{pendingCount === 1 ? "" : "s"}</p>
              </div>
            </div>
            <Link className={styles.homeLink} href="/">Open Globe</Link>
          </header>

          <div className={styles.sections}>
            <section>
              <h2 className={styles.sectionTitle}>Access Requests</h2>
              {users.length === 0 ? (
                <div className={styles.empty}>No access requests yet.</div>
              ) : (
                <div className={styles.table}>
                  <div className={`${styles.row} ${styles.head}`}>
                    <span>Name</span>
                    <span>Email</span>
                    <span>Status</span>
                    <span>Requested</span>
                    <span>Actions</span>
                  </div>
                  {users.map(user => (
                    <div className={styles.row} key={user.id}>
                      <span className={styles.name}>{user.name}</span>
                      <span className={styles.muted}>{user.email}</span>
                      <span className={statusClass(user.status)}>{user.status}</span>
                      <span className={styles.muted}>{user.requestedAt.toLocaleDateString("en-GB")}</span>
                      <span className={styles.actions}>
                        <form action={approveUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button className={`${styles.iconButton} ${styles.approve}`} type="submit" title="Approve access">
                            <Check size={15} /> Approve
                          </button>
                        </form>
                        <form action={denyUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button className={`${styles.iconButton} ${styles.deny}`} type="submit" title="Deny access">
                            <X size={15} /> Deny
                          </button>
                        </form>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    );
}

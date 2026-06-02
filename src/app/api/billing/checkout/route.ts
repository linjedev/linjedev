import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { billingLimiter, getClientIp } from "@/lib/rateLimiters";

const PRICE_ENV_BY_PLAN: Record<string, string> = {
    pro: "STRIPE_PRICE_PRO",
    team: "STRIPE_PRICE_TEAM",
    enterprise: "STRIPE_PRICE_ENTERPRISE",
};

interface CheckoutBody {
    plan?: unknown;
}

export async function POST(req: Request) {
    const rateLimited = billingLimiter.check(getClientIp(req));
    if (rateLimited) return rateLimited;

    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json() as CheckoutBody;
    const plan = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
    const priceEnv = PRICE_ENV_BY_PLAN[plan];
    const priceId = priceEnv ? process.env[priceEnv] : undefined;
    if (!priceId) {
        return NextResponse.json({ error: "Unknown or unavailable plan" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
        client_reference_id: session.user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
}

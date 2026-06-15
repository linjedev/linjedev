import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";
import { grantLinjeTuneCheckoutSession } from "@/lib/linjetune/entitlements";

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig!,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.metadata?.app === "linjetune") {
            await grantLinjeTuneCheckoutSession(session);
        } else {
            console.log("Subscription completed!");
            // Update user tier in DB, send license key via email
        }
    }

    return new NextResponse(null, { status: 200 });
}

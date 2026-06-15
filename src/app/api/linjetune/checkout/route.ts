import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { billingLimiter, getClientIp } from "@/lib/rateLimiters";
import { getLinjeTuneProduct } from "@/lib/linjetune/products";
import { grantLinjeTunePurchase, isValidLinjeTuneOwnerId } from "@/lib/linjetune/entitlements";

interface CheckoutBody {
  productId?: unknown;
}

export async function POST(req: Request) {
  const rateLimited = billingLimiter.check(getClientIp(req));
  if (rateLimited) return rateLimited;

  const ownerId = (await cookies()).get("tl_v1_owner")?.value;
  if (!isValidLinjeTuneOwnerId(ownerId)) {
    return NextResponse.json({ error: "Missing LinjeTune owner id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as CheckoutBody;
  const product = getLinjeTuneProduct(body.productId);
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy_key") {
    const entitlements = await grantLinjeTunePurchase({
      ownerId,
      productId: product.id,
      stripeSessionId: `preview_${product.id}_${Date.now()}`,
      amountTotal: product.unitAmountGbpPence,
      currency: "gbp",
    });
    return NextResponse.json({ preview: true, entitlements });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    adaptive_pricing: { enabled: true },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: product.unitAmountGbpPence,
        product_data: {
          name: product.name,
          description: product.description,
          metadata: {
            app: "linjetune",
            productId: product.id,
          },
        },
      },
    }],
    metadata: {
      app: "linjetune",
      ownerId,
      productId: product.id,
      tuneTokens: String(product.tuneTokens),
      paintLabUnlocked: product.unlocksPaintLab ? "true" : "false",
    },
    success_url: `${appUrl}/tunelab?billing=success&product=${product.id}`,
    cancel_url: `${appUrl}/tunelab?billing=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

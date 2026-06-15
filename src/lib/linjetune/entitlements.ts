import { prisma } from "@/lib/db";
import type Stripe from "stripe";
import { getLinjeTuneProduct } from "./products";

export interface LinjeTuneEntitlements {
  ownerId: string;
  paintLabUnlocked: boolean;
  tuneTokens: number;
  paidTuneAccess: boolean;
}

export function isValidLinjeTuneOwnerId(ownerId: unknown): ownerId is string {
  return typeof ownerId === "string" && /^lt_[a-zA-Z0-9_-]{16,80}$/.test(ownerId);
}

export async function getLinjeTuneEntitlements(ownerId: string): Promise<LinjeTuneEntitlements> {
  const account = await prisma.linjeTuneAccount.upsert({
    where: { ownerId },
    update: {},
    create: { ownerId },
    select: { ownerId: true, paintLabUnlocked: true, tuneTokens: true },
  });

  return {
    ...account,
    paidTuneAccess: account.tuneTokens > 0,
  };
}

export async function consumeLinjeTuneToken(ownerId: string): Promise<LinjeTuneEntitlements> {
  const account = await prisma.linjeTuneAccount.upsert({
    where: { ownerId },
    update: {},
    create: { ownerId },
  });
  if (account.tuneTokens <= 0) throw new Error("NO_TUNE_TOKENS");

  const updated = await prisma.linjeTuneAccount.update({
    where: { ownerId },
    data: {
      tuneTokens: { decrement: 1 },
      transactions: {
        create: {
          productId: "tune_credit_use",
          type: "consume",
          tuneTokensDelta: -1,
        },
      },
    },
    select: { ownerId: true, paintLabUnlocked: true, tuneTokens: true },
  });

  return {
    ...updated,
    paidTuneAccess: updated.tuneTokens > 0,
  };
}

export async function grantLinjeTunePurchase(params: {
  ownerId: string;
  productId: string;
  stripeSessionId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
}): Promise<LinjeTuneEntitlements> {
  const product = getLinjeTuneProduct(params.productId);
  if (!product) throw new Error("UNKNOWN_LINJETUNE_PRODUCT");

  await prisma.linjeTuneAccount.upsert({
    where: { ownerId: params.ownerId },
    update: {},
    create: { ownerId: params.ownerId },
  });

  if (params.stripeSessionId) {
    const existing = await prisma.linjeTuneTransaction.findUnique({
      where: { stripeSessionId: params.stripeSessionId },
      select: { id: true },
    });
    if (existing) return getLinjeTuneEntitlements(params.ownerId);
  }

  const updated = await prisma.linjeTuneAccount.update({
    where: { ownerId: params.ownerId },
    data: {
      paintLabUnlocked: product.unlocksPaintLab ? true : undefined,
      tuneTokens: product.tuneTokens ? { increment: product.tuneTokens } : undefined,
      transactions: {
        create: {
          stripeSessionId: params.stripeSessionId,
          productId: product.id,
          type: "purchase",
          tuneTokensDelta: product.tuneTokens,
          paintLabUnlocked: product.unlocksPaintLab,
          amountTotal: params.amountTotal,
          currency: params.currency,
        },
      },
    },
    select: { ownerId: true, paintLabUnlocked: true, tuneTokens: true },
  });

  return {
    ...updated,
    paidTuneAccess: updated.tuneTokens > 0,
  };
}

export async function grantLinjeTuneCheckoutSession(session: Stripe.Checkout.Session) {
  const ownerId = session.metadata?.ownerId;
  const productId = session.metadata?.productId;
  if (!isValidLinjeTuneOwnerId(ownerId) || !productId) return null;

  return grantLinjeTunePurchase({
    ownerId,
    productId,
    stripeSessionId: session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
  });
}

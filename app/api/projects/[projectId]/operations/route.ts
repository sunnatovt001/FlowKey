import { z } from "zod";
import { requireUser } from "@/server/auth";
import { projectAccess } from "@/server/project-access";
import { body, handle, sameOrigin, limit } from "@/server/http";
import {
  financialOverview,
  refundPayment,
  requestPayout,
  transitionPayout,
  createSubscription,
  billSubscription,
  cancelSubscription,
} from "@/server/finance";
import { ApiError } from "@/server/security";
const id = z.string().min(1).max(128);
const amount = z.number().int().positive().max(1_000_000_000);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("refund"), paymentId: id, amountMinor: amount }),
  z.object({ action: z.literal("payout"), amountMinor: amount }),
  z.object({ action: z.enum(["approve", "reject", "complete", "fail"]), id }),
  z.object({
    action: z.literal("subscribe"),
    title: z.string().trim().min(2).max(100),
    amountMinor: amount,
    interval: z.enum(["monthly", "yearly"]),
    consent: z.literal(true),
  }),
  z.object({
    action: z.literal("bill"),
    id,
    period: z.number().int().nonnegative(),
  }),
  z.object({ action: z.literal("cancel"), id }),
]);
type Context = { params: Promise<{ projectId: string }> };
const safe = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? String(v) : v)),
  );
export async function GET(_req: Request, { params }: Context) {
  return handle(async () => {
    const user = await requireUser();
    const { projectId } = await params;
    await projectAccess(projectId, user.id, "finance");
    return safe(await financialOverview(projectId));
  });
}
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await limit(`operations:${user.id}`, 30);
    const data = schema.parse(await body(req));
    const scope = ["approve", "reject", "complete", "fail", "refund"].includes(
      data.action,
    )
      ? "owner"
      : ["subscribe", "bill", "cancel"].includes(data.action)
        ? "technical"
        : "finance";
    await projectAccess(projectId, user.id, scope);
    const key = req.headers.get("idempotency-key");
    if (!key || !/^[\w-]{8,128}$/.test(key))
      throw new ApiError(400, "Idempotency-Key kerak.");
    let result: unknown;
    if (data.action === "refund")
      result = await refundPayment(
        projectId,
        user.id,
        data.paymentId,
        BigInt(data.amountMinor),
        key,
      );
    else if (data.action === "payout")
      result = await requestPayout(
        projectId,
        user.id,
        BigInt(data.amountMinor),
        key,
      );
    else if (data.action === "subscribe")
      result = await createSubscription(
        projectId,
        user.id,
        {
          title: data.title,
          amountMinor: BigInt(data.amountMinor),
          interval: data.interval,
        },
        key,
      );
    else if (data.action === "bill")
      result = await billSubscription(projectId, user.id, data.id, data.period);
    else if (data.action === "cancel")
      result = await cancelSubscription(projectId, user.id, data.id);
    else if ("id" in data)
      result = await transitionPayout(projectId, user.id, data.id, data.action);
    return { data: safe(result), livemode: false };
  });
}

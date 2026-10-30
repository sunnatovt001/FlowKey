import { randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { requireUser, requireProject } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { checkoutInput } from "@/server/checkout-validation";
import { checkoutUrl } from "@/server/checkout";
import { ApiError } from "@/server/security";
type Context = { params: Promise<{ projectId: string }> };
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await requireProject(projectId, user.id, true, "technical");
    await limit(`links:${user.id}`, 20);
    const data = checkoutInput.parse(await body(req));
    const link = await db.paymentLink.create({
      data: {
        id: randomBytes(32).toString("hex"),
        projectId,
        title: data.title,
        amountMinor: data.amount_minor,
        currency: data.currency,
      },
    });
    return {
      id: link.id,
      url: checkoutUrl(`/pay/${link.id}`),
      livemode: false,
    };
  });
}
export async function DELETE(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await requireProject(projectId, user.id, true, "technical");
    const input = (await body(req)) as { id?: unknown };
    if (typeof input.id !== "string")
      throw new ApiError(400, "Havola ID’si kerak.");
    const result = await db.paymentLink.updateMany({
      where: { id: input.id, projectId },
      data: { disabledAt: new Date() },
    });
    if (!result.count) throw new ApiError(404, "Havola topilmadi.");
    return { disabled: true };
  });
}

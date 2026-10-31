import { body, handle, limit, sameOrigin } from "@/server/http";
import { completeSession } from "@/server/checkout";
import { checkoutOutcome } from "@/server/checkout-validation";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(req);
    const { id } = await params;
    await limit(`checkout-complete:${id}`, 10);
    return completeSession(id, checkoutOutcome.parse(await body(req)).result);
  });
}

import { z } from "zod";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { body, handle, limit, sameOrigin } from "@/server/http";
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`welcome-tour:${user.id}`, 30);
    z.object({ alreadySeen: z.boolean() })
      .strict()
      .parse(await body(req));
    const claimed = await db.user.updateMany({
      where: { id: user.id, tourSeenAt: null },
      data: { tourSeenAt: new Date() },
    });
    return { show: claimed.count === 1 };
  });
}

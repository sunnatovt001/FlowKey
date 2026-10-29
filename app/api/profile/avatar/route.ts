import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { handle, limit, sameOrigin } from "@/server/http";
import { ApiError } from "@/server/security";
import { avatarUpload } from "@/shared/avatar-upload";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return {
      image: user.image?.startsWith("data:image/")
        ? `/api/profile/avatar/image?v=${user.updatedAt.getTime()}`
        : null,
    };
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`avatar:${user.id}`, 20);
    let upload;
    try {
      upload = await avatarUpload(req);
    } catch (e) {
      throw new ApiError(
        400,
        e instanceof Error ? e.message : "Rasm noto‘g‘ri.",
      );
    }
    await db.user.update({
      where: { id: user.id },
      data: {
        image: `data:${upload.type};base64,${Buffer.from(upload.bytes).toString("base64")}`,
      },
    });
    return { ok: true };
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`avatar:${user.id}`, 20);
    await db.user.update({ where: { id: user.id }, data: { image: null } });
    return { ok: true };
  });
}

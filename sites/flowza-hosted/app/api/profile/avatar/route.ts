import { requireUser } from "@/server/auth";
import { handle, limit, sameOrigin } from "@/server/http";
import { ApiError } from "@/server/security";
import { avatarBucket, avatarKey } from "@/server/avatar";
import { avatarUpload } from "@/shared/avatar-upload";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const image = await avatarBucket().head(avatarKey(user.id));
    return {
      image: image
        ? `/api/profile/avatar/image?v=${encodeURIComponent(image.etag)}`
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
    await avatarBucket().put(avatarKey(user.id), upload.bytes, {
      httpMetadata: { contentType: upload.type },
    });
    return { ok: true };
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`avatar:${user.id}`, 20);
    await avatarBucket().delete(avatarKey(user.id));
    return { ok: true };
  });
}

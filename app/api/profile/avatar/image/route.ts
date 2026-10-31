import { requireUser } from "@/server/auth";
import { handle } from "@/server/http";
import { avatarBucket, avatarKey } from "@/server/avatar";
export async function GET() {
  try {
    const user = await requireUser();
    const image = await avatarBucket().get(avatarKey(user.id));
    if (!image) return new Response(null, { status: 404 });
    return new Response(image.body, {
      headers: {
        "Content-Type": image.httpMetadata?.contentType || "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handle(async () => {
      throw error;
    });
  }
}

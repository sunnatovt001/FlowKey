import { requireUser } from "@/server/auth";
import { handle } from "@/server/http";
export async function GET() {
  try {
    const user = await requireUser();
    const image = user.image;
    const match = image?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
    if (!match) return new Response(null, { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), {
      headers: {
        "Content-Type": match[1],
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

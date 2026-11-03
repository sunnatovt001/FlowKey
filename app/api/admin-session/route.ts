import { cookies } from "next/headers";
import { z } from "zod";
import { verifyPassword } from "better-auth/crypto";
import { requireUser } from "@/server/auth";
import { isPlatformAdmin } from "@/server/admin-access";
import { ApiError } from "@/server/security";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { adminCookie, adminSessionId } from "@/server/admin-session";
import {
  issueAdminToken,
  ADMIN_SESSION_SECONDS,
} from "@/server/admin-session-token";
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    if (!isPlatformAdmin(user.id))
      throw new ApiError(403, "Admin ruxsati kerak.");
    await limit(`admin-login:${user.id}`, 5);
    await limit("admin-login:global", 20);
    const data = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(128),
      })
      .strict()
      .parse(await body(req));
    const hash = process.env.FLOWKEY_ADMIN_PASSWORD_HASH,
      key = process.env.FLOWKEY_ADMIN_SESSION_SECRET,
      email = process.env.FLOWKEY_ADMIN_EMAIL;
    if (!hash || !key || key.length < 32 || !email)
      throw new ApiError(503, "Admin kirishi sozlanmagan.");
    const valid = await verifyPassword({ password: data.password, hash });
    if (
      !valid ||
      data.email.toLowerCase() !== email.toLowerCase() ||
      user.email.toLowerCase() !== email.toLowerCase()
    )
      throw new ApiError(401, "Login yoki parol noto‘g‘ri.");
    const sessionId = await adminSessionId();
    if (!sessionId) throw new ApiError(401, "Hisobga qayta kiring.");
    (await cookies()).set(
      adminCookie(),
      issueAdminToken(user.id, sessionId, key, hash),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ADMIN_SESSION_SECONDS,
      },
    );
    return { ok: true };
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    (await cookies()).set(adminCookie(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return { ok: true };
  });
}

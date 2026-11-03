import { cookies, headers } from "next/headers";
import { auth } from "./auth-instance";
import { validAdminToken } from "./admin-session-token";
export const adminCookie = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-flowkey_admin"
    : "flowkey_admin";
export async function adminSessionId() {
  return (await auth.api.getSession({ headers: await headers() }))?.session.id;
}
export async function hasAdminSession(userId: string) {
  const sessionId = await adminSessionId();
  const token = (await cookies()).get(adminCookie())?.value;
  return (
    !!sessionId &&
    !!token &&
    validAdminToken(
      token,
      userId,
      sessionId,
      process.env.FLOWKEY_ADMIN_SESSION_SECRET || "",
      process.env.FLOWKEY_ADMIN_PASSWORD_HASH || "",
    )
  );
}

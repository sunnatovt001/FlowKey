import { handle, limit } from "@/server/http";
import {
  requireAdmin,
  adminOverview,
  adminUsers,
  adminProjects,
  adminTickets,
  adminAudit,
} from "@/server/admin";
import { ApiError } from "@/server/security";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  return handle(async () => {
    const user = await requireAdmin();
    await limit(`admin-read:${user.id}`, 60);
    const { resource } = await params;
    const query = Object.fromEntries(new URL(req.url).searchParams);
    switch (resource) {
      case "overview":
        return adminOverview();
      case "users":
        return adminUsers(query);
      case "projects":
        return adminProjects(query);
      case "tickets":
        return adminTickets(query);
      case "audit":
        return adminAudit(query);
      default:
        throw new ApiError(404, "Bo‘lim topilmadi.");
    }
  });
}

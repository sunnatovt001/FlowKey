import { requireUser } from "@/server/auth";
import { projectAccess } from "@/server/project-access";
import { handle } from "@/server/http";
import { db } from "@/server/db";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return handle(async () => {
    const user = await requireUser();
    const { projectId } = await params;
    await projectAccess(projectId, user.id, "finance");
    const rows = await db.ledgerEntry.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10000,
    });
    const csv = [
      "date,operation,account,currency,amount_minor",
      ...rows.map((r) =>
        [
          r.createdAt.toISOString(),
          r.operationId,
          r.account,
          r.currency,
          String(r.amountMinor),
        ].join(","),
      ),
    ].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="flowkey-sandbox-ledger.csv"',
        "Cache-Control": "no-store",
      },
    });
  });
}

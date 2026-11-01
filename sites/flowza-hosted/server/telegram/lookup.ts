import { unpackText } from "./storage";
import { z } from "zod";
import { db } from "../db";
import { redact, safeWebsite } from "./policy";
const argumentsSchema = z
  .object({
    section: z.enum([
      "projects",
      "transactions",
      "webhooks",
      "keys",
      "tickets",
    ]),
    query: z.string().max(100).nullable(),
    project_id: z.string().max(100).nullable(),
    status: z.string().max(40).nullable(),
    offset: z.number().int().min(0).max(100000),
  })
  .strict();
export const accountLookupTool = {
  type: "function",
  name: "lookup_account",
  description:
    "Read-only search of this signed-in account, including older records outside the initial snapshot. Returns count and a page of up to 25 records. Project IDs never grant access to another owner. No secrets are returned.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      section: {
        type: "string",
        enum: ["projects", "transactions", "webhooks", "keys", "tickets"],
      },
      query: { type: ["string", "null"] },
      project_id: { type: ["string", "null"] },
      status: { type: ["string", "null"] },
      offset: { type: "integer", minimum: 0, maximum: 100000 },
    },
    required: ["section", "query", "project_id", "status", "offset"],
    additionalProperties: false,
  },
};
export async function lookupAccount(userId: string, args: unknown) {
  const a = argumentsSchema.parse(args),
    owned = {
      business: { ownerId: userId },
      ...(a.project_id ? { id: a.project_id } : {}),
    };
  let rows: unknown[], count: number;
  const take = 25,
    skip = a.offset;
  if (a.section === "projects") {
    const where = {
      ...owned,
      ...(a.query
        ? { name: { contains: a.query } }
        : {}),
    };
    [rows, count] = await Promise.all([
      db.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          website: true,
          archivedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.project.count({ where }),
    ]);
    rows = (rows as { website: string | null }[]).map((row) => ({
      ...row,
      website: safeWebsite(row.website),
    }));
  } else if (a.section === "transactions") {
    const where = {
      project: owned,
      ...(a.query ? { id: { contains: a.query } } : {}),
      ...(a.status ? { status: a.status } : {}),
    };
    [rows, count] = await Promise.all([
      db.transaction.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          amountMinor: true,
          currency: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.transaction.count({ where }),
    ]);
  } else if (a.section === "webhooks") {
    const where = {
      endpoint: { project: owned },
      ...(a.query ? { id: { contains: a.query } } : {}),
      ...(a.status ? { status: a.status } : {}),
    };
    [rows, count] = await Promise.all([
      db.webhookDelivery.findMany({
        where,
        select: {
          id: true,
          status: true,
          attempts: true,
          responseCode: true,
          error: true,
          createdAt: true,
          endpoint: { select: { projectId: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.webhookDelivery.count({ where }),
    ]);
  } else if (a.section === "keys") {
    const where = {
      project: owned,
      ...(a.query
        ? { name: { contains: a.query } }
        : {}),
      ...(a.status === "active" ? { revokedAt: null } : {}),
    };
    [rows, count] = await Promise.all([
      db.apiKey.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          name: true,
          createdAt: true,
          revokedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.apiKey.count({ where }),
    ]);
  } else {
    const where = {
      userId,
      ...(a.query ? { id: { contains: a.query } } : {}),
      ...(a.status ? { status: a.status } : {}),
    };
    [rows, count] = await Promise.all([
      db.supportTicket.findMany({
        where,
        select: {
          id: true,
          summary: true,
          status: true,
          createdAt: true,
          deliveredAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      db.supportTicket.count({ where }),
    ]);
  }
  if (a.section === "tickets")
    rows = (rows as { summary: string }[]).map((r) => ({
      ...r,
      summary: unpackText(r.summary),
    }));
  return JSON.parse(
    JSON.stringify(
      {
        count,
        offset: skip,
        nextOffset: skip + rows.length < count ? skip + rows.length : null,
        rows,
      },
      (_, v) =>
        typeof v === "bigint"
          ? v.toString()
          : typeof v === "string"
            ? redact(v)
            : v,
    ),
  );
}

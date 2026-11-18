import { existsSync } from "node:fs";
import { PgBoss } from "pg-boss";
import { deliverReplyNotifications } from "../server/support-replies";
import { dispatchDue } from "../server/webhooks";
import { db } from "../server/db";
if (existsSync(".env")) process.loadEnvFile(".env");

const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
boss.on("error", () =>
  console.error(JSON.stringify({ event: "worker.error" })),
);
await boss.start();
await boss.createQueue("webhook-dispatch");
await boss.work("webhook-dispatch", async () => {
  const count = await dispatchDue();
  await deliverReplyNotifications();
  console.info(
    JSON.stringify({
      event: "worker.heartbeat",
      deliveries: count,
      at: new Date().toISOString(),
    }),
  );
});
const tick = async () => {
  await boss.send(
    "webhook-dispatch",
    {},
    { singletonKey: "dispatch", singletonSeconds: 10 },
  );
};
await tick();
const timer = setInterval(() => {
  tick().catch(() =>
    console.error(JSON.stringify({ event: "worker.enqueue_failed" })),
  );
}, 10000);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    clearInterval(timer);
    await boss.stop();
    await db.$disconnect();
    process.exit(0);
  });

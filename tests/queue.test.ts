import test from "node:test";
import "./helpers";
import assert from "node:assert/strict";
import { PgBoss } from "pg-boss";
test(
  "queued work survives a queue-process restart",
  { skip: !process.env.FLOWZA_TEST_URL },
  async () => {
    const url = new URL(process.env.DATABASE_URL || "");
    assert.ok(url.pathname.endsWith("_test"));
    const name = `restart-${Date.now()}`;
    const first = new PgBoss({ connectionString: url.href });
    await first.start();
    await first.createQueue(name);
    const id = await first.send(name, { marker: "persistent-work" });
    assert.ok(id);
    await first.stop();
    const second = new PgBoss({ connectionString: url.href });
    try {
      await second.start();
      const persisted = await second.getJobById<{ marker: string }>(name, id);
      assert.equal(persisted?.data.marker, "persistent-work");
      assert.equal(persisted?.state, "created");
      await second.deleteQueue(name);
    } finally {
      await second.stop();
    }
  },
);

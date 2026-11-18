import test from "node:test";
import assert from "node:assert/strict";
import {
  paymentDate,
  paymentFilters,
  paymentRangeError,
  paymentPeriod,
  paymentHref,
  paymentToday,
  paymentDateLabel,
  paymentTimeLabel,
} from "../shared/payments";
test("payment filters reject rollover dates, array inputs and unknown states", () => {
  assert.equal(paymentDate("2026-02-30"), "");
  assert.equal(paymentDate("0000-01-01"), "");
  assert.equal(paymentDate("2024-02-29"), "2024-02-29");
  assert.deepEqual(
    paymentFilters({
      q: ["x"],
      status: "anything",
      from: "2026-02-30",
      to: ["2026-11-01"],
    }),
    { q: "", status: "", from: "", to: "" },
  );
  assert.ok(
    paymentRangeError({
      q: "",
      status: "",
      from: "2026-11-15",
      to: "2026-11-01",
    }),
  );
});
test("payment periods follow Tashkent day boundaries and include today", () => {
  assert.equal(paymentToday(new Date("2026-11-14T19:00:00Z")), "2026-11-15");
  assert.equal(paymentToday(new Date("2026-11-14T18:59:59Z")), "2026-11-14");
  assert.deepEqual(paymentPeriod(7, "2026-11-15"), {
    from: "2026-11-09",
    to: "2026-11-15",
  });
  assert.deepEqual(paymentPeriod(7, "2026-03-03"), {
    from: "2026-02-25",
    to: "2026-03-03",
  });
});
test("payment navigation preserves project and filters, encodes queries and resets pagination", () => {
  const f = {
    q: "test & id",
    status: "pending",
    from: "2026-11-01",
    to: "2026-11-15",
  };
  const url = new URL(paymentHref("owner-project", f, 2), "https://flowkey.uz");
  assert.equal(url.searchParams.get("q"), f.q);
  assert.equal(url.searchParams.get("project"), "owner-project");
  assert.equal(url.searchParams.get("page"), "2");
  assert.ok(!paymentHref("owner-project", f).includes("page="));
});

test("payment date labels are deterministic across server and browser locale databases", () => {
  assert.equal(paymentDateLabel("2026-11-14T19:00:00Z"), "15 noy 2026");
  assert.equal(paymentTimeLabel("2026-11-14T19:01:00Z"), "00:01");
});

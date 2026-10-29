import test from "node:test";
import "./helpers";
import assert from "node:assert/strict";
import {
  hash,
  secret,
  passwordHash,
  encrypt,
  decrypt,
} from "../server/security";
import { verifyWebhook } from "../server/webhook-signature";
const base = process.env.FLOWZA_TEST_URL;
test(
  "delivery revalidates unsafe destinations, records failure truthfully, and enforces retry limit",
  { skip: !base },
  async () => {
    const { db } = await import("../server/db");
    const token = secret("");
    const user = await db.user.create({
      data: {
        email: `webhook-${Date.now()}@example.com`,
        passwordHash: passwordHash("webhook-fixture-password"),
        emailVerified: true,
      },
    });
    try {
      const business = await db.business.create({
        data: {
          ownerId: user.id,
          name: "Webhook security test",
          type: "Startup",
        },
      });
      const project = await db.project.create({
        data: {
          businessId: business.id,
          name: "Webhook fixture",
          memberships: { create: { userId: user.id } },
        },
      });
      await db.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      // Fixture bypasses registration deliberately to prove validation happens again at delivery time.
      const endpoint = await db.webhookEndpoint.create({
        data: {
          projectId: project.id,
          url: "https://127.0.0.1/private",
          events: ["payment.successful"],
          secretEncrypted: encrypt(secret("whsec_")),
        },
      });
      const transaction = await db.transaction.create({
        data: {
          projectId: project.id,
          amountMinor: 100,
          currency: "UZS",
          status: "successful",
          idempotencyKey: secret("test_"),
          requestHash: hash("fixture"),
        },
      });
      const delivery = await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          transactionId: transaction.id,
          event: "payment.successful",
        },
      });
      const { deliver } = await import("../server/webhooks");
      for (let attempt = 1; attempt <= 5; attempt++) {
        const result = await deliver(delivery.id, project.id);
        assert.equal(result.status, "failed");
        assert.equal(result.attempts, attempt);
        assert.equal(result.responseCode, null);
        assert.ok(result.error);
      }
      await assert.rejects(deliver(delivery.id, project.id), /limiti/);
      assert.equal(
        await db.webhookDeliveryAttempt.count({
          where: { deliveryId: delivery.id },
        }),
        5,
      );
      await db.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: { url: "https://receiver.example/events" },
      });
      const payload = JSON.stringify({
        id: "evt_receiver_fixture",
        livemode: false,
      });
      const receiverTransaction = await db.transaction.create({
        data: {
          projectId: project.id,
          amountMinor: 100,
          currency: "UZS",
          status: "successful",
          idempotencyKey: secret("receiver_"),
          requestHash: hash("receiver"),
        },
      });
      const receiverDelivery = await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          transactionId: receiverTransaction.id,
          event: "payment.successful",
          payload,
        },
      });
      let received = 0;
      const receiver = async (
        _destination: string,
        body: string,
        signature: string,
      ) => {
        assert.equal(body, payload);
        assert.equal(
          verifyWebhook(body, signature, decrypt(endpoint.secretEncrypted)),
          true,
        );
        received++;
        return received === 1 ? 503 : 204;
      };
      assert.equal(
        (await deliver(receiverDelivery.id, project.id, receiver)).status,
        "failed",
      );
      assert.equal(
        (await deliver(receiverDelivery.id, project.id, receiver)).status,
        "delivered",
      );
      const history = await db.webhookDeliveryAttempt.findMany({
        where: { deliveryId: receiverDelivery.id },
        orderBy: { attemptNumber: "asc" },
      });
      assert.deepEqual(
        history.map((attempt) => attempt.responseCode),
        [503, 204],
      );
      const interruptedTransaction = await db.transaction.create({
        data: {
          projectId: project.id,
          amountMinor: 100,
          currency: "UZS",
          status: "pending",
          idempotencyKey: secret("lease_"),
          requestHash: hash("lease"),
        },
      });
      const interrupted = await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          transactionId: interruptedTransaction.id,
          event: "payment.pending",
          status: "sending",
          attempts: 1,
          leaseUntil: new Date(0),
          nextAttemptAt: new Date(Date.now() + 3600000),
          history: { create: { attemptNumber: 1 } },
        },
      });
      const { dispatchDue } = await import("../server/webhooks");
      await dispatchDue();
      assert.equal(
        (
          await db.webhookDelivery.findUniqueOrThrow({
            where: { id: interrupted.id },
          })
        ).status,
        "failed",
      );
      assert.ok(
        (
          await db.webhookDeliveryAttempt.findFirstOrThrow({
            where: { deliveryId: interrupted.id },
          })
        ).completedAt,
      );
    } finally {
      await db.webhookDeliveryAttempt.deleteMany({
        where: {
          delivery: {
            endpoint: { project: { business: { ownerId: user.id } } },
          },
        },
      });
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    }
  },
);

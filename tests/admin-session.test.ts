import test from "node:test";
import assert from "node:assert/strict";
import {
  issueAdminToken,
  validAdminToken,
  ADMIN_SESSION_SECONDS,
} from "../server/admin-session-token";
test("admin grant expires, rejects tampering and is bound to account, login session and credential", () => {
  const now = 1000000,
    key = "test-key-for-session-signing-123456",
    hash = "test-credential-hash";
  const token = issueAdminToken("owner", "session-1", key, hash, now);
  assert.equal(
    validAdminToken(token, "owner", "session-1", key, hash, now),
    true,
  );
  for (const [user, session, secret, credential, time] of [
    ["other", "session-1", key, hash, now],
    ["owner", "session-2", key, hash, now],
    ["owner", "session-1", "changed", hash, now],
    ["owner", "session-1", key, "rotated", now],
    ["owner", "session-1", key, hash, now + ADMIN_SESSION_SECONDS * 1000],
  ] as const)
    assert.equal(
      validAdminToken(token, user, session, secret, credential, time),
      false,
    );
  assert.equal(
    validAdminToken(token + "x", "owner", "session-1", key, hash, now),
    false,
  );
  assert.equal(
    validAdminToken(token, "owner", "session-1", "", hash, now),
    false,
  );
  assert.equal(
    validAdminToken("bad", "owner", "session-1", key, hash, now),
    false,
  );
});

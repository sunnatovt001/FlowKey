import test from "node:test";
import assert from "node:assert/strict";
import { authTrustedOrigins, matchesAppOrigin } from "../server/origins";
import { authError } from "../shared/locale";
test("local auth trusts both loopback names only on the configured port", () => {
  assert.deepEqual(authTrustedOrigins("http://localhost:3000", true), [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  assert.deepEqual(authTrustedOrigins("http://127.0.0.1:3100", true), [
    "http://127.0.0.1:3100",
    "http://localhost:3100",
  ]);
  assert.ok(
    !authTrustedOrigins("http://localhost:3000", true).includes(
      "http://127.0.0.1:3001",
    ),
  );
});
test("production and remote hosts get no added loopback trust", () => {
  assert.deepEqual(authTrustedOrigins("https://flowkey.example", true), [
    "https://flowkey.example",
  ]);
  assert.deepEqual(authTrustedOrigins("http://localhost:3000", false), [
    "http://localhost:3000",
  ]);
});
test("loopback writes require the alias to match the actual request origin", () => {
  assert.ok(
    matchesAppOrigin(
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3000/api/projects",
      "http://localhost:3000",
      true,
    ),
  );
  assert.ok(
    !matchesAppOrigin(
      "http://127.0.0.1:3000",
      "http://localhost:3000/api/projects",
      "http://localhost:3000",
      true,
    ),
  );
  assert.ok(
    !matchesAppOrigin(
      "http://evil.example",
      "http://127.0.0.1:3000/api/projects",
      "http://localhost:3000",
      true,
    ),
  );
  assert.ok(
    !matchesAppOrigin(
      null,
      "http://localhost:3000/api/projects",
      "http://localhost:3000",
      true,
    ),
  );
  assert.ok(
    !matchesAppOrigin(
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3000/api/projects",
      "http://localhost:3000",
      false,
    ),
  );
});
test("auth failures show useful Uzbek messages without raw server errors", () => {
  assert.match(authError("INVALID_ORIGIN", 403), /manzili/);
  assert.match(authError(undefined, 503), /baza/);
  assert.match(authError(undefined, 429), /kutib/);
});

test("development accepts the real loopback Host when Next normalizes req.url", () => {
  assert.equal(
    matchesAppOrigin(
      "http://127.0.0.1:3000",
      "http://localhost:3000/api/telegram",
      "http://localhost:3000",
      true,
      "127.0.0.1:3000",
    ),
    true,
  );
  assert.equal(
    matchesAppOrigin(
      "http://localhost:3000",
      "http://127.0.0.1:3000/api/telegram",
      "http://127.0.0.1:3000",
      true,
      "localhost:3000",
    ),
    true,
  );
});

test("Host correction keeps cross-origin, other port and production writes blocked", () => {
  for (const host of [
    "evil.example",
    "localhost:3000",
    "127.0.0.1:3001",
    "127.0.0.1:3000,evil.example",
  ]) {
    assert.equal(
      matchesAppOrigin(
        "http://127.0.0.1:3000",
        "http://localhost:3000/api/telegram",
        "http://localhost:3000",
        true,
        host,
      ),
      false,
    );
  }
  assert.equal(
    matchesAppOrigin(
      "http://127.0.0.1:3000",
      "http://localhost:3000/api/telegram",
      "http://localhost:3000",
      false,
      "127.0.0.1:3000",
    ),
    false,
  );
  assert.equal(
    matchesAppOrigin(
      "https://evil.example",
      "http://localhost:3000/api/telegram",
      "http://localhost:3000",
      true,
      "evil.example",
    ),
    false,
  );
  assert.equal(
    matchesAppOrigin(
      "http://127.0.0.1:3000",
      "https://remote.example/api/telegram",
      "http://localhost:3000",
      true,
      "127.0.0.1:3000",
    ),
    false,
  );
});

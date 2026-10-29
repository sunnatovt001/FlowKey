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

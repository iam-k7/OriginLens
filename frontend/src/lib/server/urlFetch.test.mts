import assert from "node:assert/strict";
import { test } from "node:test";
import { checkUrl, isBlockedAddress, sniffImage } from "./urlFetch.ts";

test("private, loopback, link-local and mapped addresses are blocked", () => {
  for (const a of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "not-an-ip"]) {
    assert.equal(isBlockedAddress(a), true, a);
  }
  for (const a of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) assert.equal(isBlockedAddress(a), false, a);
});

test("unsafe URLs are rejected before any network access", () => {
  for (const u of ["http://127.0.0.1/x.png", "http://169.254.169.254/latest", "http://[::1]/a", "file:///etc/passwd",
    "http://example.com:8080/a.png", "http://user:pw@example.com/a.png", "gopher://example.com/", "not a url"]) {
    assert.throws(() => checkUrl(u), u);
  }
  assert.equal(checkUrl("https://example.com/a.png").hostname, "example.com");
});

test("image format comes from the bytes, not the name", () => {
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.mime, "image/jpeg");
  assert.equal(sniffImage(Buffer.from("GIF89a...."))?.mime, "image/gif");
  assert.equal(sniffImage(Buffer.from("<svg xmlns=...>")), null);
});

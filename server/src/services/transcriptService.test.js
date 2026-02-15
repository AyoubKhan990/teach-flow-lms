import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { __test__ } from "./transcriptService.js";

test("parseVttToText strips timestamps and duplicates", () => {
  const vtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.000
Hello <b>world</b>

2
00:00:02.000 --> 00:00:03.000
Hello world

3
00:00:03.000 --> 00:00:04.000
Next line`;

  const out = __test__.parseVttToText(vtt);
  assert.equal(out, "Hello world Next line");
});

test("fetchWithTimeout aborts slow requests", async () => {
  const server = http.createServer((req, res) => {
    setTimeout(() => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    }, 200);
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    await assert.rejects(
      () => __test__.fetchWithTimeout(`http://127.0.0.1:${port}/`, { timeoutMs: 25 }),
      (err) => err && (err.name === "AbortError" || String(err.message || "").includes("aborted"))
    );
  } finally {
    server.close();
  }
});


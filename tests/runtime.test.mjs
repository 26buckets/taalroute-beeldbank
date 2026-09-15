import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

test("Worker-runtime bewaart in echte lokale D1 en leest uit lokale R2", async () => {
  const bundle = await build({
    stdin: {
      contents:
        'import {handle} from "./worker/index.js"; export default {fetch(request,env){return handle(request,env,async()=>"local-test-user");}};',
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
  });
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: bundle.outputFiles[0].text,
      compatibilityDate: "2026-09-15",
      d1Databases: { DB: "runtime-test" },
      r2Buckets: ["IMAGES"],
    }),
  );
  try {
    const db = await mf.getD1Database("DB");
    for (const statement of readFileSync("migrations/0001_initial.sql", "utf8")
      .split(";")
      .filter((s) => s.trim()))
      await db.prepare(statement).run();
    const data = await (
      await mf.dispatchFetch("https://example.test/data/badkamer.json")
    ).json();
    assert.equal(data.assets.length, 50);
    const image = { type: "image", n: 1, uid: 1 };
    const save = await mf.dispatchFetch("https://example.test/api/lesson", {
      method: "PUT",
      headers: {
        origin: "https://example.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({ items: [image], revision: 0 }),
    });
    assert.equal(save.status, 200);
    assert.deepEqual(
      await (await mf.dispatchFetch("https://example.test/api/lesson")).json(),
      { items: [image], revision: 1 },
    );
    const bucket = await mf.getR2Bucket("IMAGES");
    await bucket.put("images/badkamer/test.avif", "pixels", {
      httpMetadata: { contentType: "image/avif" },
    });
    const response = await mf.dispatchFetch(
      "https://example.test/images/badkamer/test.avif",
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "pixels");
    assert.equal(response.headers.get("content-type"), "image/avif");
  } finally {
    await mf.dispose();
  }
});

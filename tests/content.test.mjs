import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const load = (path) => readFile(resolve(root, path), "utf8").then(JSON.parse);
const data = await load("public/data/badkamer.json");

test("iedere reeks verwijst naar vier bestaande, verschillende beeldkaarten", () => {
  const numbers = new Set(data.assets.map((a) => a.n));
  const ids = new Set(data.assets.map((a) => a.id));
  assert.equal(numbers.size, 50);
  assert.equal(ids.size, 50);
  assert.equal(data.sequences.length, 3);
  for (const s of data.sequences) {
    assert.equal(s.steps.length, 4);
    assert.equal(new Set(s.steps).size, 4);
    for (const n of s.steps)
      assert.ok(numbers.has(n), `${s.id}: beeld ${n} ontbreekt`);
    for (const field of ["verbs", "instruction", "past", "order", "keywords"]) {
      assert.equal(s[field].length, s.steps.length, `${s.id}.${field}`);
      assert.ok(
        s[field].every((text) => typeof text === "string" && text.trim()),
      );
    }
  }
});

test("alle lokale beeldvarianten bestaan en blijven binnen de bestandsgroottebegroting", async () => {
  let avifTotal = 0,
    total = 0;
  for (const a of data.assets) {
    for (const size of ["thumb", "full"]) {
      const rendition = a.renditions[size];
      assert.ok(rendition.width > 0 && rendition.height > 0);
      assert.ok(
        Math.max(rendition.width, rendition.height) <=
          (size === "thumb" ? 256 : 960),
      );
      for (const format of ["avif", "webp"]) {
        const path = rendition[format];
        assert.match(
          path,
          /^images\/badkamer\/bav-\d{3}-(thumb|full)-[a-f0-9]{10}\.(avif|webp)$/,
        );
        const file = await stat(resolve(root, "public", path));
        assert.ok(file.size > 0);
        assert.ok(
          file.size < (size === "thumb" ? 16384 : 131072),
          `${path}: te groot`,
        );
        total += file.size;
        if (format === "avif") avifTotal += file.size;
      }
    }
  }
  assert.ok(avifTotal < 750000, `AVIF-set is ${avifTotal} bytes`);
  assert.ok(total < 2500000, `Alle varianten samen zijn ${total} bytes`);
  const names = await readdir(resolve(root, "public/images/badkamer"));
  assert.equal(names.length, 200);
  assert.ok(names.every((n) => /\.(avif|webp)$/.test(n)));
});

test("HTML, code en gegevens bevatten geen ingebedde foto's of Codex-afhankelijkheid", async () => {
  for (const path of [
    "public/index.html",
    "public/assets/app.js",
    "public/data/badkamer.json",
  ]) {
    const text = await readFile(resolve(root, path), "utf8");
    assert.doesNotMatch(
      text,
      /data:image|b64_string|download_url|window\.openai|globalThis\.Tweak|__BATH_DATA__/,
    );
  }
});

test("de broninhoud en de gepubliceerde inhoud hebben dezelfde betekenissen en reeksen", async () => {
  const original = await load("content/badkamer.json");
  assert.deepEqual(data.sequences, original.sequences);
  assert.deepEqual(
    data.assets.map(({ renditions, ...a }) => a),
    original.assets,
  );
  assert.ok(data.methodLinks.every(l => l.assetId && l.lesson && l.url.startsWith("https://docent.lingua-academy.nl/")));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { collectionTree } from "../public/assets/collection-tree.js";

const registry = JSON.parse(
  await readFile(
    new URL("../public/data/collections.json", import.meta.url),
    "utf8",
  ),
);
const tree = collectionTree(registry.nodes);

test("de badkamer hoort bij het huis en lege categorieën verschijnen niet in de docentnavigatie", () => {
  assert.deepEqual(
    tree.trail("badkamer-verzorging").map((n) => n.id),
    ["het-huis", "badkamer-verzorging"],
  );
  assert.deepEqual(
    tree.children().map((n) => n.id),
    ["het-huis"],
  );
  assert.deepEqual(
    tree.children("het-huis").map((n) => n.id),
    ["badkamer-verzorging"],
  );
  assert.deepEqual(
    tree.leaves("het-huis").map((n) => n.dataset),
    ["badkamer.json"],
  );
  const topics = new Set(registry.topics.map((t) => t.id));
  for (const node of registry.nodes) {
    for (const topic of node.topics ?? [])
      assert.ok(topics.has(topic), `Onbekend label: ${topic}`);
  }
});

test("een collectieboom weigert ontbrekende ouders, dubbele ID's en kringverwijzingen", () => {
  assert.throws(
    () => collectionTree([{ id: "a", parentId: "missing" }]),
    /ontbreekt/,
  );
  assert.throws(() => collectionTree([{ id: "a" }, { id: "a" }]), /Dubbele/);
  assert.throws(
    () =>
      collectionTree([
        { id: "a", parentId: "b" },
        { id: "b", parentId: "a" },
      ]),
    /Cirkel/,
  );
  const sample = collectionTree([
    { id: "home", kind: "group", parentId: null, status: "published" },
    { id: "floor", kind: "group", parentId: "home", status: "published" },
    { id: "room", kind: "collection", parentId: "floor", status: "published" },
  ]);
  assert.deepEqual(
    sample.leaves("home").map((n) => n.id),
    ["room"],
  );
});

test("de huiscover heeft kleine lokale AVIF- en WebP-varianten", async () => {
  const cover = tree.get("het-huis").cover;
  assert.ok(cover.alt.length > 20);
  let avifBytes = 0;
  for (const [size, rendition] of Object.entries(cover.renditions)) {
    assert.ok(rendition.width <= (size === "thumb" ? 320 : 960));
    for (const format of ["avif", "webp"]) {
      assert.match(
        rendition[format],
        /^images\/het-huis\/huis-(thumb|full)-[a-f0-9]{10}\.(avif|webp)$/,
      );
      const file = await stat(
        new URL("../public/" + rendition[format], import.meta.url),
      );
      assert.ok(
        file.size > 0 && file.size < (size === "thumb" ? 16384 : 131072),
      );
      if (format === "avif") avifBytes += file.size;
    }
  }
  assert.ok(avifBytes < 65536);
});

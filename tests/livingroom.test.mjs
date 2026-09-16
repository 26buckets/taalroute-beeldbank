import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { indexCollections } from "../public/assets/collection-data.js";
const read = async (path) => JSON.parse(await readFile(new URL("../" + path, import.meta.url), "utf8"));

test("woonkamer voegt 50 compacte beelden en drie complete reeksen toe aan het huis", async () => {
  const room = await read("public/data/woonkamer.json");
  const source = await read("content/woonkamer.json");
  const registry = await read("public/data/collections.json");
  const packages = await Promise.all(registry.nodes.filter(n => n.kind === "collection" && n.status === "published").map(n => read("public/data/" + n.dataset)));
  const library = indexCollections(packages);
  assert.equal(library.assets.size, 154);
  assert.equal(library.sequences.size, 7);
  assert.equal(library.assets.get(2001).collectionId, "woonkamer");
  assert.equal(room.assets.length, 50);
  assert.equal(room.sequences.length, 3);
  assert.deepEqual(room.assets.map(({renditions, ...a}) => a), source.assets);
  assert.deepEqual(room.sequences, source.sequences);
  let total = 0, avif = 0;
  for (const a of room.assets) {
    assert.ok(a.title && a.description && a.words.length && a.uses.length);
    for (const [size, r] of Object.entries(a.renditions)) {
      assert.ok(Math.max(r.width, r.height) <= (size === "thumb" ? 256 : a.type === "OVZ" ? 960 : 768));
      for (const format of ["avif", "webp"]) {
        assert.match(r[format], /^images\/woonkamer\/woo-\d{3}-(thumb|full)-[a-f0-9]{10}\.(avif|webp)$/);
        const file = await stat(new URL("../public/" + r[format], import.meta.url));
        assert.ok(file.size > 0 && file.size < (size === "thumb" ? 16384 : 131072));
        total += file.size;
        if (format === "avif") avif += file.size;
      }
    }
  }
  assert.ok(avif < 1500000, `AVIF: ${avif} bytes`);
  assert.ok(total < 4000000, `Alle varianten: ${total} bytes`);
  for (const s of room.sequences) {
    assert.equal(new Set(s.steps).size, 4);
    for (const [i,n] of s.steps.entries()) assert.equal(library.assets.get(n).sourceNumber, 39 + room.sequences.indexOf(s) * 4 + i);
    for (const key of ["verbs", "instruction", "past", "order", "keywords"]) {
      assert.equal(s[key].length, 4);
      assert.ok(s[key].every(text => typeof text === "string" && text.trim()));
    }
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { indexCollections } from "../public/assets/collection-data.js";
import { validItems } from "../worker/index.js";
const read = async (p) =>
  JSON.parse(await readFile(new URL("../" + p, import.meta.url), "utf8"));
const bathroom = await read("public/data/badkamer.json");
const kitchen = await read("public/data/keuken.json");
test("keuken en badkamer behouden unieke verwijzingen in een gemengde les", () => {
  const library = indexCollections([bathroom, kitchen]);
  assert.equal(library.assets.size, 104);
  assert.equal(library.assets.get(1).title, "De tandenborstel");
  assert.equal(library.assets.get(1001).title, "Het bord");
  assert.equal(library.assets.get(1001).collectionId, "keuken-koken");
  assert.equal(library.sequences.size, 4);
  assert.ok(
    validItems([
      { type: "image", n: 1, uid: 1 },
      { type: "image", n: 1001, uid: 2 },
      {
        type: "sequence",
        id: "seq-keuken-groente",
        uid: 3,
        mode: "volgorde",
        level: "A2",
        help: "words",
        order: [0, 1, 2, 3],
      },
    ]),
  );
  assert.throws(
    () =>
      indexCollections([
        bathroom,
        { ...kitchen, assets: [{ ...kitchen.assets[0], n: 1 }] },
      ]),
    /Dubbel beeldnummer/,
  );
});
test("keuken heeft complete metadata, een bestaande vierstapsreeks en compacte beeldvarianten", async () => {
  const source = await read("content/keuken.json");
  assert.deepEqual(
    kitchen.assets.map(({ renditions, ...a }) => a),
    source.assets,
  );
  assert.deepEqual(kitchen.sequences, source.sequences);
  let avifBytes = 0;
  for (const a of kitchen.assets) {
    assert.ok(a.title && a.description && a.words.length && a.uses.length);
    for (const [size, r] of Object.entries(a.renditions)) {
      assert.ok(Math.max(r.width, r.height) <= (size === "thumb" ? 256 : 960));
      for (const fmt of ["avif", "webp"]) {
        assert.match(
          r[fmt],
          /^images\/keuken\/kee-\d{3}-(thumb|full)-[a-f0-9]{10}\.(avif|webp)$/,
        );
        const f = await stat(new URL("../public/" + r[fmt], import.meta.url));
        assert.ok(f.size > 0 && f.size < (size === "thumb" ? 16384 : 131072));
        if (fmt === "avif") avifBytes += f.size;
      }
    }
  }
  assert.ok(avifBytes < 850000);
  for (const s of kitchen.sequences) {
    assert.equal(new Set(s.steps).size, 4);
    for (const n of s.steps) assert.ok(kitchen.assets.some((a) => a.n === n));
    for (const key of ["verbs", "instruction", "past", "order", "keywords"])
      assert.equal(s[key].length, 4);
  }
});

test("groentereeks gebruikt originele stappen en behoudt de verschillende losse acties", () => {
  assert.deepEqual(kitchen.sequences[0].steps, [1051, 1052, 1053, 1054]);
  assert.equal(kitchen.assets.length, 54);
  for (const n of [1021, 1025, 1032, 1034])
    assert.equal(kitchen.assets.find(a => a.n === n).type, "ACT");
  assert.equal(kitchen.assets.filter(a => a.n === 1054).length, 1);
  for (const n of kitchen.sequences[0].steps)
    assert.equal(kitchen.assets.find(a => a.n === n).type, "REE");
});

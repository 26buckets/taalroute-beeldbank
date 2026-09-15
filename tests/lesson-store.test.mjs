import test from "node:test";
import assert from "node:assert/strict";
import { lessonStore } from "../public/assets/lesson-store.js";
const tick = () => new Promise((resolve) => setImmediate(resolve));
test("snelle wijzigingen worden op volgorde opgeslagen met het actuele versienummer", async () => {
  const saves = [];
  let release;
  const fetcher = async (url, options) => {
    if (!options.method) return Response.json({ items: [], revision: 0 });
    const body = JSON.parse(options.body);
    saves.push(body);
    if (saves.length === 1) await new Promise((r) => (release = r));
    return Response.json({ revision: body.revision + 1 });
  };
  const store = await lessonStore(assert.fail, () => {}, fetcher);
  store.save([{ type: "image", n: 1, uid: 1 }]);
  store.save([{ type: "image", n: 2, uid: 2 }]);
  store.save([{ type: "image", n: 3, uid: 3 }]);
  assert.equal(store.dirty(), true);
  release();
  await tick();
  await tick();
  assert.equal(saves.length, 2);
  assert.equal(saves[1].revision, 1);
  assert.equal(saves[1].items[0].n, 3);
  assert.equal(store.dirty(), false);
});
test("mislukte wijzigingen blijven beschikbaar voor opnieuw opslaan", async () => {
  let fail = true,
    message;
  const fetcher = async (url, options) => {
    if (!options.method) return Response.json({ items: [], revision: 0 });
    if (fail) throw new Error("offline");
    return Response.json({ revision: 1 });
  };
  const store = await lessonStore(
    (m) => (message = m),
    () => {},
    fetcher,
  );
  store.save([{ type: "image", n: 1, uid: 1 }]);
  await tick();
  assert.equal(store.dirty(), true);
  assert.match(message, /nog niet opgeslagen/);
  fail = false;
  store.retry();
  await tick();
  assert.equal(store.dirty(), false);
});

test("publieke lesselecties blijven in de eigen browser en komen terug na opnieuw openen", async () => {
  const { browserLessonStore } = await import(
    "../public/assets/lesson-store.js"
  );
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const a = browserLessonStore(assert.fail, () => {}, storage);
  const items = [{ type: "image", n: 1, uid: 1 }];
  a.save(items);
  assert.deepEqual(
    browserLessonStore(assert.fail, () => {}, storage).items,
    items,
  );
  assert.deepEqual(
    browserLessonStore(assert.fail, () => {}, { getItem: () => null }).items,
    [],
  );
  assert.equal(a.dirty(), false);
});

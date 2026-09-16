import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { generateKeyPair, SignJWT, jwtVerify } from "jose";
import { handle, identity, content } from "../worker/index.js";
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(
    readFileSync(
      new URL("../migrations/0001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  return {
    sql,
    prepare(query) {
      return {
        bind(...args) {
          return {
            async first() {
              return sql.prepare(query).get(...args) ?? null;
            },
            async run() {
              return {
                meta: {
                  changes: Number(sql.prepare(query).run(...args).changes),
                },
              };
            },
          };
        },
      };
    },
  };
}
const base = "https://beeldbank.taalroute.nl";
const req = (path, body, origin = base) =>
  new Request(
    base + path,
    body
      ? {
          method: "PUT",
          headers: { "content-type": "application/json", origin },
          body: JSON.stringify(body),
        }
      : {},
  );
const image = { type: "image", n: 1, uid: 1 };

test("alle app-, data- en afbeeldingsroutes weigeren ongeauthenticeerde verzoeken", async () => {
  for (const path of [
    "/",
    "/assets/app.js",
    "/data/badkamer.json",
    "/images/badkamer/test.avif",
    "/api/lesson",
  ]) {
    const response = await handle(req(path), {});
    assert.equal(response.status, 403);
  }
  assert.equal(
    (
      await handle(
        new Request(base, {
          headers: {
            "cf-access-authenticated-user-email": "fake@example.com",
            "cf-access-jwt-assertion": "forged",
          },
        }),
        {
          ACCESS_AUD: "app",
          ACCESS_TEAM_DOMAIN: "lingua-academy.cloudflareaccess.com",
        },
      )
    ).status,
    403,
  );
});
test("JWT controle verifieert handtekening, audience, uitgever en vervaldatum", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const env = {
    ACCESS_AUD: "beeldbank",
    ACCESS_TEAM_DOMAIN: "lingua-academy.cloudflareaccess.com",
  };
  const verify = (token, ignored, options) =>
    jwtVerify(token, publicKey, options);
  async function token(options = {}) {
    return new SignJWT({ email: "teacher@example.com" })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("teacher")
      .setIssuer(
        options.issuer ?? "https://lingua-academy.cloudflareaccess.com",
      )
      .setAudience(options.aud ?? "beeldbank")
      .setExpirationTime(options.exp ?? "1h")
      .sign(privateKey);
  }
  for (const [options, expected] of [
    [{}, "teacher"],
    [{ aud: "other" }, null],
    [{ issuer: "https://wrong.example" }, null],
    [{ exp: 1 }, null],
  ]) {
    const request = new Request(base, {
      headers: { "cf-access-jwt-assertion": await token(options) },
    });
    assert.equal(await identity(request, env, verify), expected);
  }
  const forged = (await token()).split(".");
  forged[1] = Buffer.from(
    JSON.stringify({ sub: "attacker", email: "attacker@example.com" }),
  ).toString("base64url");
  assert.equal(
    await identity(
      new Request(base, {
        headers: { "cf-access-jwt-assertion": forged.join(".") },
      }),
      env,
      verify,
    ),
    null,
  );
});
test("D1 bewaart lesselecties per docent en weigert gelijktijdig overschrijven", async () => {
  const DB = database(),
    env = { DB };
  const as = (id) => async () => id;
  assert.deepEqual(
    await (await handle(req("/api/lesson"), env, as("a"))).json(),
    { items: [], revision: 0 },
  );
  assert.equal(
    (
      await handle(
        req("/api/lesson", { items: [image], revision: 0 }),
        env,
        as("a"),
      )
    ).status,
    200,
  );
  assert.deepEqual(
    await (await handle(req("/api/lesson"), env, as("a"))).json(),
    { items: [image], revision: 1 },
  );
  assert.deepEqual(
    await (await handle(req("/api/lesson"), env, as("b"))).json(),
    { items: [], revision: 0 },
  );
  assert.equal(
    (await handle(req("/api/lesson", { items: [], revision: 0 }), env, as("a")))
      .status,
    409,
  );
  assert.equal(
    (await handle(req("/api/lesson", { items: [], revision: 1 }), env, as("a")))
      .status,
    200,
  );
});
test("D1 weigert vreemde oorsprong, onbekende beelden en ongeldige reeksen", async () => {
  const env = { DB: database() },
    as = async () => "a";
  assert.equal(
    (
      await handle(
        req("/api/lesson", { items: [], revision: 0 }, "https://other.example"),
        env,
        as,
      )
    ).status,
    403,
  );
  for (const items of [
    [{ ...image, n: 999 }],
    [{ ...image, type: "sequence", id: "nope" }],
    [image, image],
  ])
    assert.equal(
      (await handle(req("/api/lesson", { items, revision: 0 }), env, as))
        .status,
      400,
    );
});
test("collectie-initialisatie behoudt latere inhoudswijzigingen in D1", async () => {
  const db = database();
  const data = await content(db, "badkamer.json");
  assert.equal(data.assets.length, 50);
  db.sql
    .prepare("UPDATE content_packages SET payload=? WHERE id=?")
    .run('{"edited":true}', "badkamer.json");
  assert.deepEqual(await content(db, "badkamer.json"), { edited: true });
  assert.equal(await content(db, "unlisted.json"), null);
});
test("R2 levert privéafbeeldingen met ETag en 304 na authenticatie", async () => {
  const env = {
    IMAGES: {
      async get() {
        return {
          body: "pixels",
          httpEtag: '"example"',
          writeHttpMetadata(h) {
            h.set("content-type", "image/avif");
          },
        };
      },
    },
  };
  const request = new Request(base + "/images/badkamer/test.avif");
  const result = await handle(request, env, async () => "a");
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "private, max-age=86400");
  assert.equal(
    (
      await handle(
        new Request(request, { headers: { "if-none-match": '"example"' } }),
        env,
        async () => "a",
      )
    ).status,
    304,
  );
});

test("publieke testversie opent app en beelden zonder account en houdt D1-selecties privé", async () => {
  const env = {
    PUBLIC_PREVIEW: "true",
    ASSETS: { fetch: async () => new Response("app") },
    DB: {
      prepare() {
        throw new Error("Private lesson data must not be read");
      },
    },
    IMAGES: {
      get: async () => ({
        body: "pixels",
        httpEtag: '"image"',
        writeHttpMetadata(h) {
          h.set("content-type", "image/avif");
        },
      }),
    },
  };
  const noAuth = async () => {
    throw new Error("Public preview must not require login");
  };
  assert.equal((await handle(req("/"), env, noAuth)).status, 200);
  assert.equal(
    (await handle(req("/images/badkamer/test.avif"), env, noAuth)).status,
    200,
  );
  assert.deepEqual(
    await (await handle(req("/api/lesson"), env, noAuth)).json(),
    { storage: "browser", items: [], revision: 0 },
  );
  assert.equal(
    (await handle(req("/api/lesson", { items: [], revision: 0 }), env, noAuth))
      .status,
    403,
  );
  assert.equal(
    (await handle(req("/api/lesson?owner=someone-else"), env, noAuth)).status,
    200,
  );
});

test("publicatie van woonkamerregister behoudt eerdere D1-inhoud en docentselecties", async () => {
  const db = database();
  db.sql
    .prepare("INSERT INTO content_packages(id,payload) VALUES (?,?)")
    .run("collections.json", '{"old":true}');
  db.sql
    .prepare(
      "INSERT INTO lesson_selections(owner,items,revision) VALUES (?,?,?)",
    )
    .run("existing", JSON.stringify([image]), 7);
  const registry = await content(db, "collections.json");
  assert.ok(
    registry.nodes.some(
      (n) => n.id === "woonkamer" && n.status === "published",
    ),
  );
  assert.equal(
    db.sql
      .prepare("SELECT payload FROM content_packages WHERE id=?")
      .get("collections.json").payload,
    '{"old":true}',
  );
  assert.equal(
    db.sql
      .prepare("SELECT revision FROM lesson_selections WHERE owner=?")
      .get("existing").revision,
    7,
  );
  const items = [
    image,
    { type: "image", n: 1001, uid: 2 },
    { type: "image", n: 2001, uid: 3 },
    {
      type: "sequence",
      id: "woo-woonkamer-opruimen",
      uid: 4,
      mode: "volgorde",
      level: "A2",
      help: "none",
      order: [0, 1, 2, 3],
    },
  ];
  assert.equal(
    (
      await handle(
        req("/api/lesson", { items, revision: 0 }),
        { DB: db },
        async () => "new",
      )
    ).status,
    200,
  );
  assert.deepEqual(
    await (
      await handle(req("/api/lesson"), { DB: db }, async () => "new")
    ).json(),
    { items, revision: 1 },
  );
});

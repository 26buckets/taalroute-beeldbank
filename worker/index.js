import { createRemoteJWKSet, jwtVerify } from "jose";
import p0 from "../public/data/badkamer.json" with { type: "json" };
import p1 from "../public/data/keuken.json" with { type: "json" };
import p2 from "../public/data/woonkamer.json" with { type: "json" };
import p3 from "../public/data/los-leren-en-vrije-tijd.json" with { type: "json" };
import p4 from "../public/data/los-eten-en-drinken.json" with { type: "json" };
import p5 from "../public/data/los-dieren-en-natuur.json" with { type: "json" };
import p6 from "../public/data/los-kleding-en-persoonlijke-spullen.json" with { type: "json" };
import p7 from "../public/data/los-wonen-en-het-huis.json" with { type: "json" };
import p8 from "../public/data/los-lichaam-en-zorg.json" with { type: "json" };
import p9 from "../public/data/los-werk-en-gereedschap.json" with { type: "json" };
import p10 from "../public/data/los-vervoer-en-omgeving.json" with { type: "json" };
import p11 from "../public/data/los-symbolen-en-hoeveelheden.json" with { type: "json" };
import p12 from "../public/data/wonen-ruimtes.json" with { type: "json" };
import p13 from "../public/data/wonen-buitenruimtes.json" with { type: "json" };
import p14 from "../public/data/wonen-woningtypen.json" with { type: "json" };
import p15 from "../public/data/wonen-inrichting.json" with { type: "json" };
import p16 from "../public/data/wonen-wonen-regelen.json" with { type: "json" };
import collections from "../public/data/collections.json" with { type: "json" };
const seeds = {
  "badkamer.json": p0,
  "keuken.json": p1,
  "woonkamer.json": p2,
  "los-leren-en-vrije-tijd.json": p3,
  "los-eten-en-drinken.json": p4,
  "los-dieren-en-natuur.json": p5,
  "los-kleding-en-persoonlijke-spullen.json": p6,
  "los-wonen-en-het-huis.json": p7,
  "los-lichaam-en-zorg.json": p8,
  "los-werk-en-gereedschap.json": p9,
  "los-vervoer-en-omgeving.json": p10,
  "los-symbolen-en-hoeveelheden.json": p11,
  "wonen-ruimtes.json": p12,
  "wonen-buitenruimtes.json": p13,
  "wonen-woningtypen.json": p14,
  "wonen-inrichting.json": p15,
  "wonen-wonen-regelen.json": p16,
  "collections.json": collections,
};
// Versioned D1 packages preserve earlier content and teacher selections.
const packageKeys = Object.fromEntries(Object.keys(seeds).map(id => [id, id.replace(".json", "-20260923-wonen-los-v1.json")]));
const contentIds = Object.keys(seeds).filter(id => id !== "collections.json");
const allContent = { assets: contentIds.flatMap(id => seeds[id].assets), sequences: contentIds.flatMap(id => seeds[id].sequences) };
const keys = new Map();
const json = (value, status = 200, headers = {}) =>
  Response.json(value, {
    status,
    headers: { "cache-control": "private, no-store", ...headers },
  });

export async function identity(request, env, verify = jwtVerify) {
  if (
    !env.ACCESS_AUD ||
    env.ACCESS_AUD === "pending" ||
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN || "")
  )
    return null;
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  if (!keys.has(issuer))
    keys.set(
      issuer,
      createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
    );
  try {
    const { payload } = await verify(token, keys.get(issuer), {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "sub", "email"],
    });
    return typeof payload.sub === "string" && typeof payload.email === "string"
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

// Initialize only absent content packages from the versioned sources. Never overwrite an edited package.
export async function content(db, id) {
  if (!Object.hasOwn(seeds, id)) return null;
  const storageId = packageKeys[id] ?? id;
  let row = await db
    .prepare("SELECT payload FROM content_packages WHERE id = ?")
    .bind(storageId)
    .first();
  if (!row) {
    await db
      .prepare(
        "INSERT OR IGNORE INTO content_packages (id, payload) VALUES (?, ?)",
      )
      .bind(storageId, JSON.stringify(seeds[id]))
      .run();
    row = await db
      .prepare("SELECT payload FROM content_packages WHERE id = ?")
      .bind(storageId)
      .first();
  }
  return JSON.parse(row.payload);
}

export function validItems(items, data = allContent) {
  if (!Array.isArray(items) || items.length > 200) return false;
  const seen = new Set();
  return items.every((item) => {
    if (
      !item ||
      !Number.isSafeInteger(item.uid) ||
      item.uid < 1 ||
      seen.has(item.uid)
    )
      return false;
    seen.add(item.uid);
    if (item.type === "image")
      return (
        Object.keys(item).every((k) => ["type", "n", "uid"].includes(k)) &&
        data.assets.some((a) => a.n === item.n)
      );
    return (
      item.type === "sequence" &&
      Object.keys(item).every((k) =>
        ["type", "id", "uid", "mode", "level", "help", "order", "instructionForm"].includes(k),
      ) &&
      data.sequences.some((s) => s.id === item.id) &&
      ["nu", "volgorde", "instructie", "verleden"].includes(item.mode) &&
      (!Object.hasOwn(item, "instructionForm") ||
        ["moet", "imperatief"].includes(item.instructionForm)) &&
      ["A2", "B1"].includes(item.level) &&
      ["none", "words", "starters"].includes(item.help) &&
      Array.isArray(item.order) &&
      item.order.length === 4 &&
      [...item.order].sort().join(",") === "0,1,2,3"
    );
  });
}

export async function lesson(request, db, owner) {
  if (request.method === "GET") {
    const row = await db
      .prepare("SELECT items, revision FROM lesson_selections WHERE owner = ?")
      .bind(owner)
      .first();
    return json(
      row
        ? { items: JSON.parse(row.items), revision: row.revision }
        : { items: [], revision: 0 },
    );
  }
  if (request.method !== "PUT")
    return json({ error: "Methode niet toegestaan" }, 405, {
      allow: "GET, PUT",
    });
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    !request.headers.get("content-type")?.startsWith("application/json")
  )
    return json({ error: "Ongeldig verzoek" }, 403);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Leeg verzoek" }, 400);
  let size = 0,
    chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      return json({ error: "Selectie te groot" }, 413);
    }
    chunks.push(value);
  }
  let body;
  try {
    body = JSON.parse(await new Blob(chunks).text());
  } catch {
    return json({ error: "Ongeldige selectie" }, 400);
  }
  const packages = await Promise.all(
    contentIds.map((id) => content(db, id)),
  );
  const data = {
    assets: packages.flatMap((p) => p.assets),
    sequences: packages.flatMap((p) => p.sequences),
  };
  if (
    !Number.isSafeInteger(body?.revision) ||
    body.revision < 0 ||
    !validItems(body.items, data)
  )
    return json({ error: "Ongeldige selectie" }, 400);
  const result =
    body.revision === 0
      ? await db
          .prepare(
            "INSERT OR IGNORE INTO lesson_selections (owner,items,revision) VALUES (?,?,1)",
          )
          .bind(owner, JSON.stringify(body.items))
          .run()
      : await db
          .prepare(
            "UPDATE lesson_selections SET items=?, revision=revision+1, updated_at=CURRENT_TIMESTAMP WHERE owner=? AND revision=?",
          )
          .bind(JSON.stringify(body.items), owner, body.revision)
          .run();
  if (!result.meta.changes)
    return json(
      {
        error:
          "Je lesselectie is in een ander venster gewijzigd. Herlaad de pagina.",
      },
      409,
    );
  return json({ revision: body.revision + 1 });
}

export async function handle(request, env, authenticate = identity) {
  const url = new URL(request.url);
  const publicPreview = env.PUBLIC_PREVIEW === "true";
  const owner = publicPreview ? null : await authenticate(request, env);
  if (!publicPreview && !owner)
    return new Response("Log in om de Taalroute Beeldbank te openen.", {
      status: 403,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
      },
    });
  if (url.pathname === "/api/lesson") {
    if (publicPreview) {
      return request.method === "GET"
        ? json({ storage: "browser", items: [], revision: 0 })
        : json(
            {
              error:
                "Lesselecties worden in deze testversie in je browser bewaard.",
            },
            403,
          );
    }
    return lesson(request, env.DB, owner);
  }
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405 });
  if (url.pathname.startsWith("/data/")) {
    const data = await content(env.DB, url.pathname.slice(6));
    return data ? json(data) : json({ error: "Niet gevonden" }, 404);
  }
  if (url.pathname.startsWith("/api/"))
    return json({ error: "Niet gevonden" }, 404);
  if (url.pathname.startsWith("/images/")) {
    if (
      !/^\/images\/[a-z0-9-]+\/[a-zA-Z0-9._-]+\.(avif|webp)$/.test(url.pathname)
    )
      return new Response(null, { status: 404 });
    const object =
      request.method === "HEAD"
        ? await env.IMAGES.head(url.pathname.slice(1))
        : await env.IMAGES.get(url.pathname.slice(1));
    if (!object) return new Response(null, { status: 404 });
    const headers = new Headers({
      "cache-control": "private, max-age=86400",
      etag: object.httpEtag,
      "x-content-type-options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "private, max-age=86400");
    if (request.headers.get("if-none-match") === object.httpEtag)
      return new Response(null, { status: 304, headers });
    return new Response(request.method === "HEAD" ? null : object.body, {
      headers,
    });
  }
  const response = await env.ASSETS.fetch(request);
  const result = new Response(response.body, response);
  result.headers.set("cache-control", "private, no-cache");
  result.headers.set("x-content-type-options", "nosniff");
  result.headers.set("referrer-policy", "same-origin");
  result.headers.set(
    "content-security-policy",
    "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
  );
  return result;
}
export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (error) {
      console.error("Beeldbank request failed", error.name);
      return json(
        { error: "Laden is tijdelijk niet mogelijk. Probeer opnieuw." },
        503,
      );
    }
  },
};

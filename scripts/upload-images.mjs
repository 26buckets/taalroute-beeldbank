import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
const files = (await readdir("public/images", { recursive: true })).filter(
  (f) => /\.(avif|webp)$/.test(f),
);
let done = 0;
async function upload() {
  while (files.length) {
    const file = files.shift();
    await new Promise((resolve, reject) => {
      const p = spawn("node_modules/.bin/wrangler", [
        "r2",
        "object",
        "put",
        `taalroute-beeldbank-images/images/${file}`,
        "--file",
        `public/images/${file}`,
        "--remote",
        "--jurisdiction",
        "eu",
        "--content-type",
        file.endsWith(".avif") ? "image/avif" : "image/webp",
        "--cache-control",
        "private, max-age=86400",
      ]);
      let out = "";
      p.stdout.on("data", (c) => (out += c));
      p.stderr.on("data", (c) => (out += c));
      p.on("error", reject);
      p.on("close", (code) =>
        code ? reject(new Error(`${file}: ${out}`)) : resolve(),
      );
    });
    if (++done % 25 === 0) console.log(`${done} afbeeldingen geüpload`);
  }
}
await Promise.all(Array.from({ length: 4 }, upload));
console.log(`Gereed: ${done} afbeeldingen`);

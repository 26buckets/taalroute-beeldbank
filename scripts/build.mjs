import { rm, mkdir, cp } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public/index.html", "dist/index.html");
await cp("public/assets", "dist/assets", { recursive: true });
console.log(
  "Appbestanden gebouwd; collectiegegevens en afbeeldingen worden via de Worker geladen.",
);

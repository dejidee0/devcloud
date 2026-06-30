import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");
const svg = readFileSync(join(pub, "favicon.svg"), "utf8");

function renderPng(size) {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
}

const pngSizes = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
for (const [name, size] of Object.entries(pngSizes)) {
  writeFileSync(join(pub, name), renderPng(size));
  console.log("wrote", name, `(${size}x${size})`);
}

writeFileSync(join(pub, "favicon.ico"), await pngToIco([renderPng(16), renderPng(32), renderPng(48)]));
console.log("wrote favicon.ico (16/32/48)");

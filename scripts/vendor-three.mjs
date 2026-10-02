import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(`${root}assets/promo/vendor`, { recursive: true });
await build({
  stdin: {
    contents: "export { Scene, Group, PerspectiveCamera, WebGLRenderer, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, Shape, ShapeGeometry, ExtrudeGeometry, CanvasTexture, SRGBColorSpace, AmbientLight, DirectionalLight, MathUtils, NoToneMapping } from 'three';",
    resolveDir: root,
    sourcefile: "three-entry.js"
  },
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  legalComments: "inline",
  outfile: `${root}assets/promo/vendor/three.js`
});
await copyFile(`${root}node_modules/three/LICENSE`, `${root}assets/promo/vendor/THREE-LICENSE.txt`);
console.log("Built local Three.js module.");
